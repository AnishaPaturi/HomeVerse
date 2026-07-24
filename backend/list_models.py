import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print("Using key:", api_key[:10] + "..." if api_key else "None")

client = genai.Client(api_key=api_key)

try:
    for m in client.models.list():
        print(m.name)
except Exception as e:
    print("Error listing models:", e)
