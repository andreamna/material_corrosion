import requests

url = "http://127.0.0.1:5000/predict"

image_path = "test_image_7.jpg"

with open(image_path, "rb") as image_file:
    files = {"image": image_file}
    response = requests.post(url, files=files)

if response.status_code == 200:
    print("Prediction:", response.json())  
else:
    print("Error:", response.status_code, response.text)
