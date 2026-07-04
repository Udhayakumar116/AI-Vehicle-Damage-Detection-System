# AI Vehicle Damage Detection System

A production-ready web application that uses computer vision to detect and classify vehicle damage from uploaded images. Built with **Streamlit** for the interface and **YOLOv8** for object detection.

## Features

- 📤 Single and multiple image upload support
- 🔍 Real-time damage detection using YOLOv8
- 🎚️ Adjustable confidence and IoU thresholds
- 📦 Bounding box visualization on detected damage regions
- 📊 Detailed detection breakdown with confidence levels and coordinates
- 💾 Downloadable processed images with annotations
- ⚡ Fallback to a pretrained model if a custom-trained model isn't available

## Tech Stack

| Component | Technology |
|---|---|
| Interface | Streamlit |
| Detection Model | YOLOv8 (Ultralytics) |
| Image Processing | OpenCV, Pillow (PIL) |
| Deep Learning Framework | PyTorch |

## Project Structure

```
python-project/
├── app.py                 # Main Streamlit application
├── requirements.txt        # Python dependencies
├── .env.example            # Environment variable template
├── best.pt                 # Custom-trained damage detection model (not included)
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.9 or higher
- pip

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ai-vehicle-damage-detector.git
   cd ai-vehicle-damage-detector/python-project
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\Activate.ps1
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables (if needed)
   ```bash
   cp .env.example .env
   ```

### Running the App

```bash
streamlit run app.py
```

The app will open automatically at `http://localhost:8501`.

## Usage

1. Upload one or more images of a vehicle using the upload panel
2. Adjust the confidence and IoU thresholds in the sidebar if needed
3. View detected damage regions with bounding boxes and confidence scores
4. Download the processed image with annotations

## Model Notes

This app expects a custom-trained YOLOv8 model file named `best.pt`, trained specifically on a labeled vehicle damage dataset (dents, scratches, cracks, etc.). If this file is not present in the project directory, the app automatically falls back to the general pretrained `yolov8n.pt` model for demonstration purposes — note that this fallback model detects general objects (like "car" or "person") rather than actual damage.

To use real damage detection, place a trained `best.pt` file in the project root.

## License

This project is open source and available for personal and educational use.
