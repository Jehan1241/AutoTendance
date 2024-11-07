from deepface import DeepFace
import pandas as pd
pd.set_option('display.max_colwidth', None)

faces_folder = "/home/jehan/Projects/AutoTendance/FacialRecogTest/faces"
temp_face_path = "/home/jehan/Projects/AutoTendance/FacialRecogTest/obama.jpeg"

try:
    # Perform the find operation
    resp = DeepFace.find(img_path=temp_face_path, db_path=faces_folder)
    
    # Check if resp is a list and contains a DataFrame
    if isinstance(resp, list) and len(resp) > 0:
        df = resp[0]  # Access the DataFrame directly
        print("DataFrame created successfully.")
        print(df[["identity","threshold","distance"]])
    else:
        print("No matches found or unexpected response format.")
except Exception as e:
    print(f"An error occurred: {e}")
