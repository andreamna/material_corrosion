from flask import Flask, request, jsonify, send_from_directory
import torch
from torchvision import models, transforms
from PIL import Image
import numpy as np
import io
import os
import time
import random
import cv2
import requests
import gdown

app = Flask(__name__)

class_to_corrosion_level = {1: 5, 2: 6, 3: 7, 4: 8, 5: 9}
file_id = '1WX92JEuqkS9CbmPhBQNZumiX4MrvW5Tj'

url = f"https://drive.google.com/uc?id={file_id}"

output = 'final_corrosion_model.pth'  
gdown.download(url, output, quiet=False)

model = models.resnet18(weights="IMAGENET1K_V1")
model.fc = torch.nn.Linear(model.fc.in_features, 5)
model.load_state_dict(torch.load(output, map_location=torch.device('cpu')))
model.eval()

transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

OUTPUT_DIR = "/tmp/heatmaps"
os.makedirs(OUTPUT_DIR, exist_ok=True)

def generate_grad_cam_plus_plus(image_tensor, original_image):
    target_layer = model.layer4[-1]
    gradients = None
    activations = None

    def backward_hook(module, grad_in, grad_out):
        nonlocal gradients
        gradients = grad_out[0]

    def forward_hook(module, inp, out):
        nonlocal activations
        activations = out

    target_layer.register_full_backward_hook(backward_hook)
    target_layer.register_forward_hook(forward_hook)

    output = model(image_tensor)
    class_idx = torch.argmax(output).item()

    model.zero_grad()
    output[0, class_idx].backward(retain_graph=True)

    if activations is None or gradients is None:
        raise RuntimeError("Failed to capture activations or gradients.")

    alpha = torch.abs(gradients).mean(dim=[2, 3], keepdim=True)
    weights = torch.mean(alpha, dim=[1, 2], keepdim=True)

    grad_cam = torch.sum(weights * activations, dim=1).cpu().detach().numpy().squeeze()
    grad_cam = np.maximum(grad_cam, 0)
    grad_cam = (grad_cam - grad_cam.min()) / (grad_cam.max() - grad_cam.min())

    heatmap = cv2.resize(grad_cam, (224, 224))
    heatmap = np.uint8(255 * heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    original = np.array(original_image)
    original = cv2.resize(original, (224, 224))

    alpha = 0.4
    superimposed = cv2.addWeighted(original, 1, heatmap, alpha, 0)

    unique_filename = f"gradcam_output_{int(time.time())}_{random.randint(1000, 9999)}.jpg"
    heatmap_path = os.path.join(OUTPUT_DIR, unique_filename)
    cv2.imwrite(heatmap_path, superimposed)

    return heatmap_path

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400

    img = request.files['image']
    image = Image.open(io.BytesIO(img.read()))
    transformed_image = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(transformed_image)
        _, preds = torch.max(outputs, 1)

    corrosion_level = class_to_corrosion_level.get(int(preds.item()) + 1, "Unknown")

    heatmap_path = generate_grad_cam_plus_plus(transformed_image, image)

    heatmap_url = f"/heatmap/{os.path.basename(heatmap_path)}"

    return jsonify({
        'predicted_corrosion_level': corrosion_level,
        'heatmap_url': heatmap_url,
        'status': 'returned'
    })

@app.route('/heatmap/<filename>', methods=['GET'])
def get_heatmap(filename):
    return send_from_directory(OUTPUT_DIR, filename)

if __name__ == "__main__":
    app.run(debug=True)
