import pandas as pd
import xarray as xr
from erddapy import ERDDAP

def fetch_oceansat2_via_api(dataset_id, lat, lon, target_date):
    server_url = "https://erddap.incois.gov.in/erddap"
    
    try:
        print(f"Connecting to INCOIS ERDDAP: {server_url}/griddap/{dataset_id} ...\n")
        
        # 1. Connect to the ERDDAP server
       # 1. Connect to the ERDDAP server
        e = ERDDAP(
            server=server_url,
            protocol="griddap",
            requests_kwargs={"verify": False} # Add this line to bypass SSL
        )
        
        # Load dataset into xarray
        ds = e.to_xarray()
        
        # 2. Print available variables (replicating your console output)
        print("Available Variables in this OceanSat-2 Dataset:")
        for var in ds.data_vars:
            print(f" - {var}")
        print("\n---------------------------------------------------------")
        
        # 3. FIX: Convert the string date to a Pandas Timestamp to avoid the TypeError
        if isinstance(target_date, str):
            target_date = pd.to_datetime(target_date)
            
        # 4. Fetch the specific data point (using nearest neighbor for coordinates/time)
        # Note: ERDDAP variable names for coordinates might be 'lat'/'lon' or 'latitude'/'longitude'. 
        # Adjust 'latitude' and 'longitude' below if your specific dataset names them differently.
        selected_data = ds.sel(
            time=target_date, 
            latitude=lat, 
            longitude=lon, 
            method="nearest"
        )
        
        print("\nSuccessfully fetched data:")
        for var in selected_data.data_vars:
            print(f"{var}: {selected_data[var].values}")
            
        return selected_data

    except Exception as e:
        print(f"\nFailed to fetch INCOIS data: {e}")
        print("Check if the target_date is correct, or if INCOIS servers are down.")
        return None

# --- Test the Function ---
# Ensure your date format is exactly like this: YYYY-MM-DDTHH:MM:SSZ
if __name__ == "__main__":
    test_dataset = "incois_oceansat2_datasets"
    test_lat = 9.9312
    test_lon = 76.2673
    test_time = "2023-12-01T12:00:00Z"
    
    fetch_oceansat2_via_api(test_dataset, test_lat, test_lon, test_time)