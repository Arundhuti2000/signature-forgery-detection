from app import app, load_model

if __name__ == '__main__':
    # Load the model before starting the server
    if load_model():
        # Run the app
        app.run(host='0.0.0.0', port=5000)
    else:
        print("Failed to load model. Exiting.")