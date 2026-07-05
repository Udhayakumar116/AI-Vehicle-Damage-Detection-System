# AI Vehicle Damage Detection System

A production-ready web application that uses computer vision to detect and classify vehicle damage from uploaded images. Built with Streamlit for the interface and YOLOv8 for object detection.

## Features
- Single and multiple image upload support
- Real-time damage detection using YOLOv8
- Adjustable confidence and IoU thresholds
- Bounding box visualization on detected damage regions
- Detailed detection breakdown with confidence levels and coordinates
- Downloadable processed images with annotations
- Fallback to a pretrained model if a custom-trained model isn't available

## Tech Stack
- Streamlit (interface)
- YOLOv8 / Ultralytics (detection model)
- OpenCV, Pillow (image processing)
- PyTorch (deep learning framework)

## How to Run
```bash
pip install -r requirements.txt
streamlit run app.py
```

## Model Notes
If a custom-trained `best.pt` model isn't found, the app falls back to the pretrained `yolov8n.pt` model for demo purposes.