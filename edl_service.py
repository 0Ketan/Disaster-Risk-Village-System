import os
import requests
from dotenv import load_dotenv

# .env file se variables load karein
load_dotenv()

BEARER_TOKEN = os.getenv("EDL_BEARER_TOKEN")

def call_edl_api():
    url = "YAHAN_APNA_API_ENDPOINT_URL_DAALEIN"
    
    headers = {
        "Authorization": f"Bearer {BEARER_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status() # Agar error hoga toh exception throw karega
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"API request mein error aaya: {e}")
        return None