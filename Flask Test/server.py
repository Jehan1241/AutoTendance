import os
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from flask import send_from_directory
from datetime import datetime
from retinaface import RetinaFace
import cv2
import matplotlib.pyplot as plt
import os
from deepface import DeepFace
import pandas as pd
import re
pd.set_option('display.max_colwidth', None)

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


def get_db_connection():
    conn = sqlite3.connect('autoTendanceDB.db')
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn

@app.route('/login', methods=['GET'])
def login():
    username = request.args.get('username')
    password = request.args.get('password')

    print(f"Username: {username}, Password: {password}")

    conn = get_db_connection()
    user = conn.execute('SELECT id FROM credentials WHERE username = ? AND password = ?', (username, password)).fetchone()
    
    conn.close()

    if user:
        user_id = user['id']  # Get the user ID
        print(user_id)
        return jsonify({"message": "Login successful", "user_id": user_id}), 200
    else:
        return jsonify({"message": "invalid"}), 200

@app.route('/images/<path:filename>', methods=['GET'])
def get_image(filename):
    return send_from_directory('/home/jehan/Projects/AutoTendance/AutoTendanceBackend/Photos', filename)

@app.route('/getAttendancePercentage', methods=['GET'])
def getAttendancePercentage():
    rollno = request.args.get('rollno')
    print(f"Requested rollno: {rollno}")

    conn = get_db_connection()
    
    # Fetch attendance records for the given roll number
    attendance_records = conn.execute(
        'SELECT status FROM Attendance_LY_ETRX WHERE rollno = ?', (rollno,)
    ).fetchall()
    
    conn.close()

    # Check if attendance records are found
    total_classes = len(attendance_records)
    if total_classes == 0:
        return jsonify({
            "rollno": rollno,
            "attendance_percentage": 0,
            "total_classes": 0,
            "present_count": 0
        }), 200

    present_count = sum(1 for record in attendance_records if record['status'] == 'Present')
    
    attendance_percentage = (present_count / total_classes) * 100
    print(present_count)

    return jsonify({
        "rollno": rollno,
        "attendance_percentage": attendance_percentage,
        "total_classes": total_classes,
        "present_count": present_count
    }), 200


@app.route('/getTimeTable', methods=['GET'])
def getTimeTable():
    conn = get_db_connection()
    timetable = conn.execute('SELECT * FROM TT_LY_ETRX ORDER BY Day, Time').fetchall()
    conn.close()
    timetable_data = {}

    for row in timetable:
        day = row['Day']
        time = row['Time']
        subject = row['Subject']  # Assuming you have a 'Subject' field

        # If the day is not in the timetable_data dictionary, add it
        if day not in timetable_data:
            timetable_data[day] = {}

        # Add the subject to the corresponding time slot for that day
        timetable_data[day][time] = subject

    return jsonify(timetable_data), 200

@app.route('/getBasicInfo', methods=['GET'])
def getBasicInfo():
    rollno = request.args.get('rollno')
    print(f"rollno: {rollno}")

    conn = get_db_connection()
    info = conn.execute('SELECT * FROM StudentInfo WHERE RollNo = ?', (rollno,)).fetchone()
    
    conn.close()

    if info:
        name = info['Name']
        branch = info['Branch']
        year = info['Year']
        return jsonify({"name": name, "branch": branch, "year": year}), 200
    else:
        return jsonify({"message": "invalid"}), 200

@app.route('/admin/students', methods=['GET'])
@cross_origin()
def get_all_students():
    try:
        conn = get_db_connection()
        students = conn.execute('SELECT RollNo, Name, Branch, Year FROM StudentInfo ORDER BY RollNo').fetchall()
        conn.close()
        
        students_list = [
            {
                'rollNo': row['RollNo'],
                'name': row['Name'],
                'branch': row['Branch'],
                'year': row['Year']
            }
            for row in students
        ]
        
        return jsonify({'students': students_list}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin/student-attendance', methods=['GET'])
@cross_origin()
def get_all_attendance():
    try:
        conn = get_db_connection()
        students = conn.execute('SELECT DISTINCT rollno FROM Attendance_LY_ETRX').fetchall()
        
        attendance_data = []
        for student in students:
            rollno = student['rollno']
            
            # Get attendance records for each student
            attendance_records = conn.execute(
                'SELECT status FROM Attendance_LY_ETRX WHERE rollno = ?', 
                (rollno,)
            ).fetchall()
            
            total_classes = len(attendance_records)
            present_count = sum(1 for record in attendance_records if record['status'] == 'Present')
            attendance_percentage = (present_count / total_classes * 100) if total_classes > 0 else 0
            
            attendance_data.append({
                'rollNo': rollno,
                'totalClasses': total_classes,
                'presentCount': present_count,
                'attendancePercentage': round(attendance_percentage, 2)
            })
        
        conn.close()
        return jsonify({'attendance': attendance_data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/add-attendance', methods=['POST'])
@cross_origin()
def add_attendance():
    data = request.json
    roll_no = data.get('rollNo')
    date_str = data.get('date')
    lecture = data.get('lecture')
    date_object = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
    formatted_date = date_object.strftime("%d/%m/%Y")

    print(roll_no, formatted_date, lecture)
    if not roll_no or not date_str or not lecture:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        print("Try")
        # Check for existing attendance record
        existing_record = conn.execute(
            'SELECT status FROM Attendance_LY_ETRX WHERE rollno = ? AND date = ? AND lecture = ?', 
            (roll_no, formatted_date, lecture)
        ).fetchone()

        if existing_record:
            print("exist")
            if existing_record['status'] == 'Absent':
                # If marked absent, change to present
                conn.execute(
                    'UPDATE Attendance_LY_ETRX SET status = ?, lecture = ? WHERE rollno = ? AND date = ? AND lecture = ?',
                    ('Present', lecture, roll_no, formatted_date, lecture)
                )
            else:
                print("Alr makred")
                return jsonify({"error": "Already marked present for this date."}), 400
        else:
            # Insert new attendance record
            conn.execute(
                'INSERT INTO Attendance_LY_ETRX (rollno, date, lecture, status) VALUES (?, ?, ?, ?)',
                (roll_no, formatted_date, lecture, 'Present')
            )

        conn.commit()
        return jsonify({"message": "Attendance added successfully."}), 201
    except Exception as e:
        print("AA",e)
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/mark-absence', methods=['POST'])
@cross_origin()
def mark_absence():
    data = request.json
    roll_no = data.get('rollNo')
    date_str = data.get('date')
    lecture = data.get('lecture')
    date_object = datetime.strptime(date_str, "%Y-%m-%dT%H:%M:%S.%fZ")
    formatted_date = date_object.strftime("%d/%m/%Y")
    
    print(roll_no, formatted_date, lecture)
    if not roll_no or not date_str:
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    try:
        # Check for existing attendance record
        existing_record = conn.execute(
            'SELECT status FROM Attendance_LY_ETRX WHERE rollno = ? AND date = ? AND lecture = ?', 
            (roll_no, formatted_date, lecture)
        ).fetchone()

        if existing_record:
            if existing_record['status'] == 'Present':
                # Change from present to absent
                conn.execute(
                    'UPDATE Attendance_LY_ETRX SET status = ?, lecture = ? WHERE rollno = ? AND date = ? AND lecture = ?',
                    ('Absent', lecture, roll_no, formatted_date, lecture)
                )
            else:
                return jsonify({"error": "Already marked absent for this date."}), 400
        else:
            # Insert new absence record
            conn.execute(
                'INSERT INTO Attendance_LY_ETRX (rollno, date, lecture, status) VALUES (?, ?, ?, ?)',
                (roll_no, formatted_date, lecture, 'Absent')
            )

        conn.commit()
        return jsonify({"message": "Absence marked successfully."}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/AddStudent', methods=['POST'])
@cross_origin()
def AddStudent():
    # Check if the post request has the file part
    if 'picture' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['picture']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Get other student information from the form data
    name = request.form.get('name')
    branch = request.form.get('branch')
    year = request.form.get('year')
    username = request.form.get('username')
    password = request.form.get('password')
    rollno = request.form.get('rollNo')

    # Check if username already exists
    conn = get_db_connection()
    existing_user = conn.execute('SELECT id FROM credentials WHERE username = ?', (username,)).fetchone()
    existing_user2 = conn.execute('SELECT id FROM credentials WHERE id = ?', (rollno,)).fetchone()

    if existing_user or existing_user2:
        print("Username or roll no. alr exists")
        conn.close()
        return jsonify({"error": "User already exists."}), 400

    # Insert new user credentials
    conn.execute('INSERT INTO credentials (username, password, id) VALUES (?, ?, ?)', (username, password, rollno))
    conn.commit()
    conn.execute('INSERT INTO StudentInfo (RollNo, Name, Branch, Year) VALUES (?, ?, ?, ?)', (rollno, name, branch, year))
    conn.commit()


    # Define the directory path
    directory = os.path.join(f"/home/jehan/Projects/AutoTendance/AutoTendanceBackend/Photos/{year}/{rollno}")
    
    # Create the directory if it does not exist
    os.makedirs(directory, exist_ok=True)

    # Save the picture as '{rollno}.jpg'
    filename = f'{rollno}.jpeg'
    file_path = os.path.join(directory, filename)
    file.save(file_path)

    # Print the student information
    print(f"RollNo: {rollno}, Name: {name}, Branch: {branch}, Year: {year}, Username: {username}, Password: {password}, Picture Saved: {filename}")

    conn.close()
    return jsonify({"message": "Student information received."}), 200

@app.route('/automatic-attendance', methods=['POST'])
@cross_origin()
def automatic_attendance():
    # Check if the post request has the file part
    if 'picture' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['picture']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    # Get other student information from the form data
    branch = request.form.get('branch')
    year = request.form.get('year')
    date = request.form.get('date')  # Assuming you pass the date in the request
    date_object = datetime.strptime(date, "%Y-%m-%dT%H:%M:%S.%fZ")
    formatted_date = date_object.strftime("%d-%m-%Y")
    lecture = request.form.get('lecture')  # Assuming you pass the lecture in the request

    # Print the date and lecture
    print(f"Date: {formatted_date}, Lecture: {lecture}", branch, year)

    # Define the temporary directory path
    temp_directory = "/home/jehan/Projects/AutoTendance/AutoTendanceBackend/temp"
    # Save the picture as 'date-lecture.jpeg'
    filename = f"{formatted_date}-{lecture}.jpeg"
    file_path = os.path.join(temp_directory, filename)
    
    # Create the temporary directory if it does not exist
    os.makedirs(temp_directory, exist_ok=True)
    file.save(file_path)

    rollNoFound = doFaceRec(file_path)
    print(rollNoFound)

    for roll_no in rollNoFound:
        print(f"Processing roll number: {roll_no}")
        conn = get_db_connection()
        
        try:
            print("Try")
            # Check for existing attendance record for the current roll number
            existing_record = conn.execute(
                'SELECT status FROM Attendance_LY_ETRX WHERE rollno = ? AND date = ? AND lecture = ?', 
                (roll_no, formatted_date, lecture)
            ).fetchone()

            if existing_record:
                print("Record exists")
                if existing_record['status'] == 'Absent':
                    # If marked absent, change to present
                    conn.execute(
                        'UPDATE Attendance_LY_ETRX SET status = ?, lecture = ? WHERE rollno = ? AND date = ? AND lecture = ?',
                        ('Present', lecture, roll_no, formatted_date, lecture)
                    )
                else:
                    print("Already marked present")
                    return jsonify({"error": "Already marked present for this date."}), 400
            else:
                # Insert new attendance record if not already existing
                conn.execute(
                    'INSERT INTO Attendance_LY_ETRX (rollno, date, lecture, status) VALUES (?, ?, ?, ?)',
                    (roll_no, formatted_date, lecture, 'Present')
                )

            conn.commit()

            # Step 2: Mark all other students in the branch/year who are not marked as "Present" as "Absent"
            # Fetch all roll numbers for the branch and year who are not marked present for this date and lecture
            students_to_mark_absent = conn.execute(
                '''
                SELECT rollno FROM StudentInfo 
                WHERE branch = ? AND year = ? AND rollno NOT IN (
                    SELECT rollno FROM Attendance_LY_ETRX WHERE date = ? AND lecture = ? AND status = 'Present'
                )
                ''', 
                (branch, year, formatted_date, lecture)
            ).fetchall()

            for student in students_to_mark_absent:
                student_rollno = student['rollno']
                # Update status to 'Absent' for each student not marked present
                conn.execute(
                    'INSERT INTO Attendance_LY_ETRX (rollno, date, lecture, status) VALUES (?, ?, ?, ?)',
                    (student_rollno, formatted_date, lecture, 'Absent')
                )

            # Commit the changes for absent students
            conn.commit()

            return jsonify({"message": "Attendance updated successfully."}), 201
        
        except Exception as e:
            print(f"Error: {e}")
            conn.rollback()  # Rollback in case of an error
            return jsonify({'error': str(e)}), 500
        finally:
            conn.close()


    return jsonify({"message": "Student information received."}), 200


def doFaceRec(img_path):
    RollNoFound = []
    
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
                for identity in df['identity']:
                    match = re.search(r'(\d+)(?=\.jpeg)', identity)
                    print(match)
                    if match:
                        RollNoFound.append(match.group(0))

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

    return(RollNoFound)



if __name__ == "__main__":
    app.run(debug=True)