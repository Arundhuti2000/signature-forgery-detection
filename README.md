# Signature Forgery Detection System

A machine learning-powered web application that detects forged signatures using deep learning techniques and computer vision.

## Overview

This application uses a trained ResNet50 model to determine whether a signature is authentic or forged. It provides two main functionalities:

1. **Single Verification** - Analyze a single signature image to determine if it's authentic or forged
2. **Compare Signatures** - Compare multiple test signatures against a reference signature

## Features

- Intuitive web interface built with React and TypeScript
- Real-time signature verification with confidence scores
- Support for comparing multiple signatures against a reference
- Visual indicators for verification results
- Responsive design that works on various devices

## Project Structure

```
signature-forgery-detection/
│
├── api/
│   ├── app.py                 # Flask API server
│   ├── run_server.py          # Script to start the server       
│   ├── model.keras            # Trained model file
│   └── tensorflow_windows_fix.py  # Helper script for Windows
├── model/
│   └── signature_verification.ipynb
├── data/
│   ├── forged
│   └── real
├── ui/
│   └── signature-verification/  # React app
│       ├── public/
│       ├── src/
│       │   ├── signature_app.tsx  # Main component
│       │   ├── index.js
│       │   └── ...
│       ├── package.json
│       └── ...
│
├── requirements.txt
└── README.md                  # This file
```

## Technology Stack

### Backend
- Python 3.8+
- TensorFlow 2.x
- Flask for the REST API
- OpenCV for image processing
- NumPy for numerical operations

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Lucide React for icons
- Vite as the build tool

## How It Works

1. **Image Upload**: Users upload signature images through the UI
2. **Preprocessing**: Images are normalized, resized, and converted to grayscale
3. **Model Prediction**: The trained ResNet50 model analyzes the signature
4. **Result Display**: Verification results are displayed with confidence scores

## Machine Learning Model

The system uses a modified ResNet50 architecture trained on a dataset of real and forged signatures. The model was trained using transfer learning with the following characteristics:

- Input shape: 128x128x1 (grayscale images)
- Two-class classification (authentic/forged)
- Training with early stopping to prevent overfitting
- Data augmentation to improve model robustness

## Installation and Setup

### Prerequisites
- Python 3.8+
- Node.js and npm
- Git (optional)

### Backend Setup

1. Clone the repository (or download and extract)
   ```
   git clone https://github.com/yourusername/signature-forgery-detection.git
   cd signature-forgery-detection/backend
   ```

2. Create a virtual environment (recommended)
   ```
   python -m venv venv
   venv\Scripts\activate  # On Windows
   source venv/bin/activate  # On Unix/Mac
   ```

3. Install dependencies
   ```
   cd api
   pip install -r ../requirements.txt
   ```
4. Run Fix Tensorflow issue
   ```
   python tensorflow_windows_fix.py
   ```
5. Run the Flask server
   ```
   python run_server.py
   ```

### Frontend Setup

1. Navigate to the UI directory
   ```
   cd ../ui/signature-verification
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Start the development server
   ```
   npm run dev
   ```

4. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173)

## Usage

### Single Signature Verification

1. Click on the "Single Verification" tab
2. Upload a signature image
3. Click "Verify Signature"
4. View the results showing whether the signature is authentic or forged

### Compare Signatures

1. Click on the "Compare Signatures" tab
2. Upload a reference signature (known authentic)
3. Upload one or more test signatures to compare
4. Click "Compare Signatures"
5. View the detailed results for each signature

## Troubleshooting

### Common TensorFlow Issues on Windows

1. **Missing DLLs**: Install the Microsoft Visual C++ Redistributable
2. **Memory Issues**: Set environment variables before running the Flask server
   ```
   set TF_FORCE_GPU_ALLOW_GROWTH=true
   set TF_CPP_MIN_LOG_LEVEL=2
   ```
3. **Model Loading Errors**: Ensure the model file path is correct

### API Connection Issues

1. Ensure both servers (backend and frontend) are running
2. Check that the API_BASE_URL in the React app matches your Flask server URL
3. Look for CORS errors in the browser console

## License

[MIT License](LICENSE)

## Acknowledgments

- The signature dataset used for training was obtained from [Kaggle's Handwritten Signature Verification dataset](https://www.kaggle.com/datasets/tienen/handwritten-signature-verification)
- This project was inspired by real-world applications of AI in document forensics

## Future Improvements

- Add user authentication
- Implement a database to store verification history
- Enhance the model with more training data
- Add support for batch processing
- Create verification reports

---
## Screenshots
- Home Screen
  ![image](https://github.com/user-attachments/assets/00761a4c-f059-48d7-bbb2-b794ef38017d)
  ![image](https://github.com/user-attachments/assets/82bcea35-dc00-4154-8f46-8499eefefef1)
- Authentication Check :
  Forged Data
  ![image](https://github.com/user-attachments/assets/977af532-3ecf-4637-bb32-0171a61b3751)
  ![image](https://github.com/user-attachments/assets/1fd9c6e2-5054-49c0-9e6f-062cd8a64c01)
  Real Data
  ![image](https://github.com/user-attachments/assets/2e453044-62a5-4280-a767-93eceb220078)
  ![image](https://github.com/user-attachments/assets/9b541ea7-d3b8-4a74-968c-6279d756ceef)


Created with ❤️ by Arundhati Das
