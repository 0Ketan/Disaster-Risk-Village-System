from fastapi import FastAPI, HTTPException
from edl_service import call_edl_api

app = FastAPI()

@app.get("/fetch-data")
def get_village_data():
    data = call_edl_api()
    if not data:
        raise HTTPException(status_code=500, detail="Failed to fetch data from EDL API")
    return {"message": "Data fetched successfully", "data": data}uvicorn main:app --reload