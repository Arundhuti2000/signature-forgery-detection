import numpy as np
import cv2
from PIL import Image
import io
import os
from flask import Flask, request, jsonify
import base64
import onnxruntime as ort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Find the ONNX model file


def find_model_file(model_name="signature_model.onnx"):
    """Find the model file in current or parent directories"""
    current_dir = os.path.dirname(os.path.abspath(__file__))

    # List of possible paths to check
    possible_paths = [
        # Same directory
        os.path.join(current_dir, model_name),
        os.path.join(os.path.dirname(current_dir),
                     model_name),          # Parent directory
        os.path.join(os.path.dirname(current_dir), 'model',
                     model_name),  # Parent/model directory
        # Current/model directory
        os.path.join(current_dir, 'model', model_name)
    ]

    # Check each path
    for path in possible_paths:
        if os.path.exists(path):
            print(f"Found model at: {path}")
            return path

    # If no model found, return default path
    return os.path.join(current_dir, model_name)


# Get the model path
model_path = find_model_file()

# Load the ONNX model
try:
    session = ort.InferenceSession(model_path)
    print(f"ONNX model loaded successfully from {model_path}")
except Exception as e:
    print(f"Error loading ONNX model: {e}")
    print("Please make sure you've run convert_to_onnx.py to generate the model")
    print(f"Looking for model at: {model_path}")
    # Placeholder for graceful handling if model can't be loaded
    session = None


def preprocess_signature(image_data, target_size=(128, 128)):
    """
    Preprocess signature image to match training preprocessing
    """
    # Handle different input types
    if isinstance(image_data, str):  # If file path
        img = Image.open(image_data)
    elif isinstance(image_data, bytes):  # If bytes
        img = Image.open(io.BytesIO(image_data))
    elif isinstance(image_data, Image.Image):  # If PIL Image
        img = image_data
    else:
        raise TypeError("Unsupported image data type")

    # Convert to numpy array and then to grayscale using cv2
    img_array = np.array(img.resize(target_size))
    if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)

    # Normalize pixel values
    img_array = img_array / 255.0

    # Add channel dimension
    img_array = np.expand_dims(img_array, axis=-1)

    # Add batch dimension
    img_array = np.expand_dims(img_array, axis=0)

    return img_array.astype(np.float32)  # ONNX requires float32


def verify_signature(signature_image):
    """
    Verify a single signature
    """
    # Check if model was loaded successfully
    if session is None:
        return {
            "error": "Model not loaded",
            "status": "error",
            "message": "The signature verification model could not be loaded. Please check the server logs."
        }

    # Preprocess the image
    processed_image = preprocess_signature(signature_image)

    # Make prediction with ONNX runtime
    input_name = session.get_inputs()[0].name
    prediction = session.run(None, {input_name: processed_image})[0]

    # Extract results (same format as your TensorFlow model)
    forged_prob = float(prediction[0][0])
    real_prob = float(prediction[0][1])
    is_real = real_prob > forged_prob

    return {
        "is_authentic": bool(is_real),
        "confidence": float(real_prob if is_real else forged_prob),
        "real_probability": real_prob,
        "forged_probability": forged_prob,
        "status": "real" if is_real else "forged"
    }

# API endpoints


@app.route('/verify/single', methods=['POST'])
def verify_single_signature():
    """API endpoint for verifying a single signature"""
    try:
        if 'signature' not in request.files and (not request.json or 'signature' not in request.json):
            return jsonify({'error': 'No signature provided'}), 400

        # Get signature from request
        if 'signature' in request.files:
            signature_file = request.files['signature']
            signature_bytes = signature_file.read()
        else:
            signature_bytes = base64.b64decode(request.json['signature'])

        # Verify signature
        result = verify_signature(signature_bytes)

        return jsonify({
            'result': result
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/verify/compare', methods=['POST'])
def verify_multiple_signatures():
    """API endpoint for comparing a reference signature against test signatures"""
    try:
        data = request.json

        if not data or 'reference_signature' not in data or 'test_signatures' not in data:
            return jsonify({'error': 'Missing required signature data'}), 400

        # Get reference signature
        reference_sig_b64 = data['reference_signature']
        reference_sig = base64.b64decode(reference_sig_b64)

        # Verify reference signature first
        ref_result = verify_signature(reference_sig)

        # Process test signatures
        results = []
        for i, test_sig_b64 in enumerate(data['test_signatures']):
            test_sig = base64.b64decode(test_sig_b64)
            result = verify_signature(test_sig)
            results.append({
                'signature_index': i,
                'result': result
            })

        # Return results
        return jsonify({
            'reference_signature': ref_result,
            'results': results,
            'summary': {
                'total': len(results),
                'authentic': sum(1 for r in results if r['result']['is_authentic']),
                'forged': sum(1 for r in results if not r['result']['is_authentic'])
            }
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    # Don't run in debug mode if model couldn't be loaded
    debug_mode = session is not None
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)
