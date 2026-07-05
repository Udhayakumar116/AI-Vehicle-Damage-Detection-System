# 🚗 AI Vehicle Damage Detection System (YOLOv8 + Streamlit)

A professional, production-ready AI/ML system that detects, localizes, and classifies vehicle damages (including scratches, dents, broken lights, bumper damage, and glass damage) in real-time from uploaded images. Powered by the high-speed **YOLOv8 Convolutional Neural Network (Ultralytics)** and packaged into an interactive, high-fidelity **Streamlit** dashboard.

---

## 🌟 Key Features
- **Multi-Image Processing**: Upload and analyze multiple vehicle images simultaneously.
- **Advanced Preprocessing (OpenVINO/OpenCV)**: Optional high-speed contrast enhancement (CLAHE) and Fast Non-Local Means Denoising to optimize inputs for inference.
- **YOLOv8 Model Engine**: Local real-time damage localization with custom confidence and Non-Maximum Suppression (IoU) threshold controls.
- **Granular Reports**: Automatic creation of summary statistics, progress bars indicating model confidence, and precise coordinates mapping of structural damage.
- **Report & Media Exporting**: Instant image download and automated saving of annotated images into a local `/outputs` directory.
- **Built-in Resiliency**: Graceful fallback structures to load standard pretrained YOLOv8 models if a custom `best.pt` file is not detected.

---

## 📂 Folder Structure
The recommended physical structure for your project is as follows:
```text
ai-vehicle-damage-detection/
├── app.py                  # Main Streamlit Dashboard Application
├── requirements.txt        # Python dependency manifest (pinned versions)
├── README.md               # Professional GitHub documentation (this file)
├── .gitignore              # Configured Git exclusion definitions
├── models/
│   └── best.pt             # Place your custom-trained YOLOv8 weights here
└── outputs/                # Auto-created folder for saving processed results
```

---

## 🛠️ Step-by-Step Setup & Installation

Follow these steps to deploy and run this application locally on your system.

### 1. Prerequisite Checks
Ensure you have **Python 3.10 or 3.11** installed on your system. You can verify this by running:
```bash
python --version
```

### 2. Clone the Repository & Navigate
```bash
git clone <your-repo-link>
cd ai-vehicle-damage-detection
```

### 3. Setup Virtual Environment (Highly Recommended)
Isolate your dependencies to prevent version conflicts with your system packages.

**On Linux/macOS:**
```bash
python -m venv .venv
source .venv/bin/activate
```

**On Windows (Command Prompt):**
```cmd
python -m venv .venv
.venv\Scripts\activate
```

**On Windows (PowerShell):**
```powershell
python -m venv .venv
# Note: If you encounter an execution policy restriction, see the Troubleshooting section below.
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.venv\Scripts\Activate.ps1
```

### 4. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Add Your Trained YOLOv8 Weights (Optional)
If you have a custom trained YOLOv8 model:
1. Create a `models` folder or place the file directly in the root directory.
2. Name it `best.pt`.
3. *If missing, the applet automatically handles the exception by loading `yolov8n.pt` so you can test immediately!*

### 6. Run the Streamlit App
Run the following command in your terminal to boot up the web interface:
```bash
streamlit run app.py
```
After a few seconds, the applet will automatically open in your default browser at `http://localhost:8501`.

---

## 🧠 Explanation of Major Code Sections

### 1. Advanced Image Preprocessing
Before feeding images into the YOLOv8 neural network, contrast adjustments can drastically increase inference accuracy, especially in low-light garages or over-exposed sunlight conditions.
```python
def preprocess_image(image_pil, use_clahe=False, use_denoise=False):
    img_bgr = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
    if use_clahe:
        # Convert to LAB space to equalize the Lightness (L) channel separately
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        img_bgr = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
    if use_denoise:
        # Remove digital noise while preserving crisp edges
        img_bgr = cv2.fastNlMeansDenoisingColored(img_bgr, None, 10, 10, 7, 21)
    return img_bgr
```

### 2. Model Loading & Fallback Resiliency
A key production consideration is ensuring the app doesn't crash if custom weights (`best.pt`) aren't present. We handle this with a try-except layer that automatically falls back to an open-source pre-trained model.
```python
@st.cache_resource(show_spinner=False)
def load_yolo_model(path):
    try:
        if os.path.exists(path):
            return YOLO(path), f"Successfully loaded custom model: **{path}**"
        else:
            return YOLO("yolov8n.pt"), "Fallback model loaded automatically: **yolov8n.pt**"
    except Exception as e:
        return None, f"Error: {str(e)}"
```

---

## 🔧 Troubleshooting & Common Bug Fixes

### ❌ PowerShell Script Execution Policy Error
* **Symptom:** Run `Activate.ps1` fails with "Script execution is disabled on this system".
* **Solution:** Open PowerShell as Administrator and run:
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
  ```
  Then reactivate your environment.

### ❌ Missing OpenCV Library Errors (`ImportError: libGL.so.1`)
* **Symptom:** App crashes on Linux/Docker complaining about `libGL.so` or other shared object files.
* **Solution:** This is due to standard OpenCV requiring graphical desktop modules. We resolve this by utilizing `opencv-python-headless` instead of `opencv-python` in `requirements.txt`. If running on bare metal Linux, run:
  ```bash
  sudo apt-get update && sudo apt-get install -y libgl1-mesa-glx
  ```

### ❌ Memory Overflow / PyTorch Crashing
* **Symptom:** App crashes or sluggishly loads on older laptops.
* **Solution:** Turn down the slider values for resolution or inference size inside the Streamlit sidebar. Close other background programs to free up RAM.

---

## 🔥 Future Enhancements & Production Roadmap

This system is built as a highly modular prototype. For enterprise production deployments, consider implementing the following roadmap:

1. **AI-Based Damage Cost Estimation (Insurance Integration)**  
   Develop a lookup engine correlating the volume/severity of detected damages (e.g., severe dent on front door panel) with standard regional repair costs and hourly labor rates.
   
2. **Automatic Insurance Claim Report Generation (PDF Format)**  
   Integrate `ReportLab` or `Weasyprint` to output structured PDF insurance claim packages including side-by-side visual comparisons, timestamped metadata, coordinate matrices, and repair estimates.

3. **Email Notification System**  
   Integrate an SMTP gateway or SendGrid client to dispatch compiled PDF claim packets and damage analysis logs to insurance inspectors or client emails directly from the dashboard.

4. **Robust Enterprise Cloud Deployment**  
   Deploy the Streamlit frontend to Streamlit Cloud or AWS ECS, containerizing the app with Docker and serving YOLO model endpoints via AWS SageMaker or Azure ML.

5. **Analytical Dashboard & Historical Database**  
   Deploy a MongoDB or PostgreSQL database to log client records, past car damage detections, average damage rates, and visual trends over time, rendering logs in a Streamlit dashboard.

6. **Custom Dataset Expansion & Fine-Tuning**  
   Consistently expand model vocabulary by training on additional datasets (e.g. COCO-Damage, CarDam) to fine-tune anchor boxes and reduce false positives under heavy occlusion or shadows.

7. **Native Mobile App Deployment (Flutter / React Native)**  
   Create a responsive cross-platform mobile companion app allowing inspection agents to snap vehicle images on-site and communicate with the backend via a secure JSON REST API.

8. **High-Performance FastAPI REST Backend**  
   Decouple model inference into a robust, high-performance **FastAPI** service running asynchronously on GPU-enabled instances, leaving the Streamlit or React app to serve strictly as a visual presentation layer.

9. **Dashcam / Real-Time Video Damage Detection**  
   Expand the preprocessing pipeline to digest video files and RTMP stream URLs (dashcam recordings) to record events and flag collision frames on-the-fly.
