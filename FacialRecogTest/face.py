from retinaface import RetinaFace
import cv2
import matplotlib.pyplot as plt
import os
from deepface import DeepFace
import pandas as pd
pd.set_option('display.max_colwidth', None)

# Paths
img_path = "/home/jehan/Projects/AutoTendance/AutoTendanceBackend/temp/office.jpeg"
faces_folder = "/home/jehan/Projects/AutoTendance/AutoTendanceBackend/Photos/LY/"

# Read the main image
img = cv2.imread(img_path)

# Check if the image was loaded correctly
if img is None:
    print("Error: Could not read the main image. Please check the file path.")
    exit()

# Detect faces using RetinaFace
resp = RetinaFace.detect_faces(img_path)

# Loop through detected faces
i = 0
for key in resp.keys():
    identity = resp[key]
    facial_area = identity["facial_area"]
    
    # Extract coordinates
    x1, y1, x2, y2 = facial_area[0], facial_area[1], facial_area[2], facial_area[3]
    
    # Draw rectangle around the face
    cv2.rectangle(img, (x1, y1), (x2, y2), (255, 255, 255), 2)
    
    # Put text on the image
    cv2.putText(img, f'Face {i}', (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 5, cv2.LINE_AA)

    # Crop the face from the image
    face = img[y1:y2, x1:x2]
    
    # Check if the face is cropped correctly
    if face.size == 0:
        print(f"Warning: Face {key} could not be cropped. Check coordinates.")
        continue
    
    # Resize the cropped face for consistency
    face_resized = cv2.resize(face, (224, 224))  # Resize to 224x224
    temp_face_path = f"/home/jehan/Projects/AutoTendance/FacialRecogTest/tmp/face_{i}.jpeg"
    
    # Save the cropped face
    success = cv2.imwrite(temp_face_path, face_resized)
    
    # Check if the face was saved successfully
    if not success:
        print(f"Error: Could not save the temporary face image at {temp_face_path}.")
        continue

    # Use DeepFace.find to search for matches in the faces folder
    try:
        results = DeepFace.find(img_path=temp_face_path, db_path=faces_folder, model_name="Facenet512")
        df = results[0]  # Access the DataFrame directly
        print(f"For Face {i}")
        if df.empty:
            print("No matches \n")
        else:
            print(df[["identity", "threshold", "distance"]])
            print()

    except Exception as e:
        print(f"Error finding matches for {temp_face_path}: {str(e)} \n")
    
    # Increment face index
    i += 1

    # Cleanup the temporary face image
    try:
        os.remove(temp_face_path)
    except Exception as e:
        print(f"Error removing temporary file {temp_face_path}: {e}")

# Optionally, display the original image with rectangles and labels
plt.figure()
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
plt.imshow(img_rgb)
plt.axis('off')
plt.title("Original Image with Faces Highlighted")
plt.show()



