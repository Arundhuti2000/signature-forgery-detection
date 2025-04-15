from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load the model
model = None

def load_model():
    global model
    try:
        model = tf.keras.models.load_model("model.keras")
        print("Model loaded successfully!")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def preprocess_image(image_data, target_size=(128, 128)):
    """
    Preprocess the image data to match the model's input requirements
    """
    # Convert base64 to image
    try:
        img = Image.open(BytesIO(base64.b64decode(image_data)))
        img = img.convert('RGB')  # Convert to RGB if it's not
        
        # Convert to numpy array
        img_array = np.array(img)
        
        # Resize image
        img_resized = cv2.resize(img_array, target_size)
        
        # Convert to grayscale
        img_gray = cv2.cvtColor(img_resized, cv2.COLOR_RGB2GRAY)
        
        # Normalize pixel values
        img_normalized = img_gray / 255.0
        
        # Add channel dimension
        img_final = np.expand_dims(img_normalized, axis=-1)
        
        # Add batch dimension
        img_final = np.expand_dims(img_final, axis=0)
        
        return img_final, None
    
    except Exception as e:
        return None, str(e)

def classify_signature(preprocessed_image):
    """
    Use the model to classify if the signature is real or forged
    """
    try:
        # Get model prediction
        prediction = model.predict(preprocessed_image)
        
        # Extract probabilities
        real_prob = float(prediction[0][1])  # Assuming index 1 is for real
        forged_prob = float(prediction[0][0])  # Assuming index 0 is for forged
        
        # Determine if authentic based on probability
        is_authentic = real_prob > forged_prob
        
        # Calculate confidence
        confidence = max(real_prob, forged_prob)
        
        return {
            "is_authentic": bool(is_authentic),
            "confidence": confidence,
            "real_probability": real_prob,
            "forged_probability": forged_prob
        }, None
        
    except Exception as e:
        return None, str(e)

@app.route('/verify/single', methods=['POST'])
def verify_single():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # Get signature base64 data
        data = request.json
        signature_data = data.get('signature')
        
        if not signature_data:
            return jsonify({"error": "No signature data provided"}), 400
        
        # Preprocess the image
        preprocessed_image, error = preprocess_image(signature_data)
        
        if error:
            return jsonify({"error": f"Error preprocessing image: {error}"}), 400
        
        # Classify the signature
        result, error = classify_signature(preprocessed_image)
        
        if error:
            return jsonify({"error": f"Error classifying signature: {error}"}), 500
            
        return jsonify({"result": result}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/verify/compare', methods=['POST'])
def verify_compare():
    if not model:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # Get the data
        data = request.json
        reference_signature = data.get('reference_signature')
        test_signatures = data.get('test_signatures', [])
        
        if not reference_signature:
            return jsonify({"error": "No reference signature provided"}), 400
            
        if not test_signatures:
            return jsonify({"error": "No test signatures provided"}), 400
            
        # Process reference signature
        ref_image, error = preprocess_image(reference_signature)
        
        if error:
            return jsonify({"error": f"Error preprocessing reference signature: {error}"}), 400
            
        ref_result, error = classify_signature(ref_image)
        
        if error:
            return jsonify({"error": f"Error classifying reference signature: {error}"}), 500
            
        # Process test signatures
        results = []
        authentic_count = 0
        forged_count = 0
        
        for i, test_sig in enumerate(test_signatures):
            test_image, error = preprocess_image(test_sig)
            
            if error:
                continue
                
            test_result, error = classify_signature(test_image)
            
            if error:
                continue
                
            results.append({
                "signature_index": i,
                "result": test_result
            })
            
            if test_result["is_authentic"]:
                authentic_count += 1
            else:
                forged_count += 1
        
        # Prepare response
        response = {
            "reference_signature": ref_result,
            "results": results,
            "summary": {
                "total": len(results),
                "authentic": authentic_count,
                "forged": forged_count
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/status', methods=['GET'])
def status():
    if model:
        return jsonify({"status": "ready"}), 200
    else:
        return jsonify({"status": "model not loaded"}), 200

if __name__ == '__main__':
    # Load the model before starting the server
    if load_model():
        # Run the app
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("Failed to load model. Exiting.")