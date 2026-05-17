import requests
import json

base_url = "http://localhost:11434"
model = "llama3.2"

try:
    response = requests.post(
        f"{base_url}/api/generate",
        json={
            "model": model,
            "prompt": "Say hello",
            "stream": False
        },
        timeout=30
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
