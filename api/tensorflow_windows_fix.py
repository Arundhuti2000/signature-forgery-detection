"""
TensorFlow Windows Setup Helper

This script helps check and configure TensorFlow on Windows for CPU-only usage.
It displays system information and tests if TensorFlow is working properly.
"""

import os
import sys
import platform
import subprocess
import importlib.util

def check_package_installed(package_name):
    """Check if a Python package is installed."""
    return importlib.util.find_spec(package_name) is not None

def install_package(package_name):
    """Install a Python package using pip."""
    subprocess.check_call([sys.executable, "-m", "pip", "install", package_name])

def set_environment_variables():
    """Set recommended environment variables for TensorFlow on Windows."""
    # Disable GPU memory allocation
    os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
    # Allow TensorFlow to allocate only as much GPU memory as needed
    os.environ["TF_FORCE_GPU_ALLOW_GROWTH"] = "true"
    # Reduce TensorFlow logging verbosity
    os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
    print("✓ Set environment variables for TensorFlow on Windows")

def print_system_info():
    """Print system information."""
    print("\n=== System Information ===")
    print(f"Operating System: {platform.system()} {platform.version()}")
    print(f"Python Version: {platform.python_version()}")
    
    if check_package_installed("tensorflow"):
        import tensorflow as tf
        print(f"TensorFlow Version: {tf.__version__}")
        gpu_available = len(tf.config.list_physical_devices('GPU')) > 0
        print(f"GPU Available: {'Yes' if gpu_available else 'No'}")
    else:
        print("TensorFlow is not installed")

def test_tensorflow():
    """Test if TensorFlow is working properly."""
    print("\n=== Testing TensorFlow ===")
    
    if not check_package_installed("tensorflow"):
        print("❌ TensorFlow is not installed. Installing TensorFlow CPU version...")
        try:
            install_package("tensorflow-cpu")
            print("✓ TensorFlow CPU installed successfully")
        except Exception as e:
            print(f"❌ Failed to install TensorFlow: {e}")
            return False
    
    try:
        # Import TensorFlow
        import tensorflow as tf
        
        # Disable GPU
        tf.config.set_visible_devices([], 'GPU')
        
        # Create and run a simple model
        print("Creating a simple model...")
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(1, input_shape=(1,))
        ])
        model.compile(optimizer='adam', loss='mean_squared_error')
        
        # Generate some dummy data
        import numpy as np
        x = np.array([[1.0], [2.0], [3.0], [4.0]])
        y = np.array([[2.0], [4.0], [6.0], [8.0]])
        
        # Fit the model
        print("Training the model...")
        model.fit(x, y, epochs=1, verbose=0)
        
        # Make a prediction
        print("Making a prediction...")
        prediction = model.predict(np.array([[5.0]]), verbose=0)
        print(f"Prediction for input 5.0: {prediction[0][0]:.2f} (expected ~10.0)")
        
        # Save and load the model
        print("Testing model saving and loading...")
        model.save("test_model.h5")
        loaded_model = tf.keras.models.load_model("test_model.h5")
        loaded_prediction = loaded_model.predict(np.array([[5.0]]), verbose=0)
        print(f"Prediction after loading: {loaded_prediction[0][0]:.2f}")
        
        # Clean up
        os.remove("test_model.h5")
        
        print("✓ TensorFlow is working correctly on your system")
        return True
        
    except Exception as e:
        print(f"❌ TensorFlow test failed: {e}")
        return False

def install_tf_dependencies():
    """Install required dependencies for TensorFlow."""
    print("\n=== Installing TensorFlow Dependencies ===")
    dependencies = [
        "numpy",
        "six",
        "protobuf",
        "absl-py",
        "h5py"
    ]
    
    for dep in dependencies:
        if not check_package_installed(dep):
            try:
                print(f"Installing {dep}...")
                install_package(dep)
                print(f"✓ {dep} installed successfully")
            except Exception as e:
                print(f"❌ Failed to install {dep}: {e}")

def main():
    """Main function."""
    print("=== TensorFlow Windows Setup Helper ===")
    
    # Set environment variables
    set_environment_variables()
    
    # Print system information
    print_system_info()
    
    # Install dependencies
    install_tf_dependencies()
    
    # Test TensorFlow
    result = test_tensorflow()
    
    print("\n=== Summary ===")
    if result:
        print("✅ Your system is ready to use TensorFlow on CPU.")
        print("You can now run your signature verification model.")
    else:
        print("❌ There were issues with TensorFlow on your system.")
        print("Please check the error messages above and fix the issues.")
        print("Additional troubleshooting steps:")
        print("1. Try installing a specific version: pip install tensorflow-cpu==2.10.0")
        print("2. Install Microsoft Visual C++ Redistributable")
        print("3. Restart your computer and try again")

if __name__ == "__main__":
    main()