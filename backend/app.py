from flask import Flask
from flask_cors import CORS  # Import CORS
import os

app = Flask(__name__)
CORS(app)  # This enables CORS for all routes in your app


@app.route("/")
def hello():
    # We change this to return JSON data
    # The frontend will fetch and display this message
    return {"message": "Hello from the Python-Flask Backend!"}


@app.route("/health")
def health():
    # Health check endpoint for Docker
    return {"status": "healthy"}, 200
    

if __name__ == "__main__":
    # Use environment variable for debug mode, default to False in production
    debug_mode = os.getenv("FLASK_DEBUG", "False").lower() == "true"
    app.run(debug=debug_mode, host="0.0.0.0", port=5000)
