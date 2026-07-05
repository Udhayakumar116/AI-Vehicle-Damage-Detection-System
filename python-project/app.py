"""
AI Vehicle Damage Detection System
Author: Senior AI/ML Engineer
Stack: Streamlit + YOLOv8 + OpenCV + PyTorch

This script implements a production-ready vehicle damage detection application.
It supports single/multiple image uploads, image preprocessing, real-time bounding box
inference, stats calculation, and image saving/downloading.
"""

import os
import time
import cv2
import numpy as np
import streamlit as st
from PIL import Image
from ultralytics import YOLO

# --- Page Configuration ---
st.set_page_config(
    page_title="AI Vehicle Damage Detection System",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Ensure Required Folders Exist ---
OUTPUT_DIR = "outputs"
MODEL_DIR = "models"
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)

# --- Custom Styling ---
st.markdown("""
<style>
    .main-title {
        font-size: 2.8rem;
        font-weight: 700;
        color: #1E3A8A;
        text-align: center;
        margin-bottom: 5px;
    }
    .subtitle {
        font-size: 1.2rem;
        color: #4B5563;
        text-align: center;
        margin-bottom: 30px;
    }
    .metric-card {
        background-color: #F3F4F6;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        text-align: center;
        border-left: 5px solid #1E3A8A;
    }
    .metric-val {
        font-size: 1.8rem;
        font-weight: bold;
        color: #1F2937;
    }
    .metric-label {
        font-size: 0.9rem;
        color: #6B7280;
    }
</style>
""", unsafe_allow_html=True)

# --- Sidebar Controls ---
st.sidebar.image("https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=200", use_container_width=True)
st.sidebar.title("🔧 Configuration Panel")
st.sidebar.markdown("Configure the YOLOv8 model inference parameters below.")

# Model selection & loading
# Defaulting to best.pt, but supporting a fallback yolov8n.pt for run-anywhere compatibility
model_path = st.sidebar.text_input("Model Path", value="best.pt", help="Path to your custom YOLOv8 model file (e.g. best.pt)")
conf_threshold = st.sidebar.slider("Confidence Threshold", min_value=0.05, max_value=1.0, value=0.25, step=0.05, help="Minimum confidence score to filter detections")
iou_threshold = st.sidebar.slider("IoU (Overlap) Threshold", min_value=0.05, max_value=1.0, value=0.45, step=0.05, help="Intersection-over-Union threshold for non-maximum suppression")

# Preprocessing Option
st.sidebar.subheader("🖼️ Preprocessing Settings")
enable_clahe = st.sidebar.checkbox("Enhance Contrast (CLAHE)", value=False, help="Enhance image contrast using Adaptive Histogram Equalization")
enable_denoise = st.sidebar.checkbox("Denoise Image", value=False, help="Apply fast non-local means denoising to reduce graininess")

st.sidebar.markdown("---")
st.sidebar.markdown("""
### 🏷️ Damage Categories
The model is trained to detect:
- 🔴 **Dent** (Panel deformations)
- 🔵 **Scratch** (Paint surface damage)
- 🟡 **Broken Light** (Headlight/taillight damage)
- 🟢 **Bumper Damage** (Cracks/misalignment)
- 🟣 **Glass Damage** (Windshield cracks/chips)
""")

# --- Helper Functions ---

@st.cache_resource(show_spinner=False)
def load_yolo_model(path):
    """
    Load YOLOv8 model. If the target model path doesn't exist,
    notifies the user and loads standard yolov8n.pt as a fallback.
    """
    try:
        if os.path.exists(path):
            return YOLO(path), f"Successfully loaded custom model: **{path}**"
        else:
            # Fallback to general yolov8n.pt
            st.warning(f"⚠️ Custom model '{path}' not found. Downloading and falling back to pretrained 'yolov8n.pt' for structural demo.")
            return YOLO("yolov8n.pt"), "Fallback model: **yolov8n.pt**"
    except Exception as e:
        st.error(f"Error loading model: {str(e)}")
        return None, "Error"

def preprocess_image(image_pil, use_clahe=False, use_denoise=False):
    """
    Perform advanced OpenCV preprocessing on PIL image.
    Returns the preprocessed image in BGR format for OpenCV operations.
    """
    # Convert PIL Image to OpenCV (BGR)
    img_bgr = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
    
    if use_clahe:
        # Convert to LAB color space to apply CLAHE to Lightness channel only
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        img_bgr = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
        
    if use_denoise:
        img_bgr = cv2.fastNlMeansDenoisingColored(img_bgr, None, 10, 10, 7, 21)
        
    return img_bgr

# --- App Header ---
st.markdown('<div class="main-title">AI Vehicle Damage Detection System</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">State-of-the-art Computer Vision pipeline powered by YOLOv8 for professional damage assessment</div>', unsafe_allow_html=True)

# Load the model
with st.spinner("Initializing YOLOv8 engine..."):
    model, load_msg = load_yolo_model(model_path)
st.info(load_msg)

# --- File Uploader ---
uploaded_files = st.file_uploader(
    "Upload vehicle images (JPEG, JPG, PNG)",
    type=["jpg", "jpeg", "png"],
    accept_multiple_files=True
)

if uploaded_files:
    # Handle single or multiple image workflows
    st.write(f"📂 Processing **{len(uploaded_files)}** uploaded image(s):")
    
    for i, file in enumerate(uploaded_files):
        # Create visual separator for multiple uploads
        if len(uploaded_files) > 1:
            st.markdown(f"---")
            st.subheader(f"🚗 Image #{i+1}: {file.name}")
            
        try:
            # 1. Load image via PIL
            pil_img = Image.open(file).convert("RGB")
            
            # 2. Run Preprocessing
            processed_bgr = preprocess_image(pil_img, use_clahe=enable_clahe, use_denoise=enable_denoise)
            
            # 3. Model Inference
            t_start = time.time()
            results = model.predict(
                source=processed_bgr,
                conf=conf_threshold,
                iou=iou_threshold,
                verbose=False
            )
            t_end = time.time()
            inference_time_ms = int((t_end - t_start) * 1000)
            
            # 4. Extract Detections
            result = results[0]
            boxes = result.boxes
            num_detections = len(boxes)
            
            # Draw bounding boxes manually using OpenCV for high control, or let Ultralytics do it
            # We'll let ultralytics plot the results to retain correct custom colors & fonts
            annotated_bgr = result.plot()
            annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
            
            # Save output to outputs folder
            output_filename = f"detected_{int(time.time())}_{file.name}"
            output_filepath = os.path.join(OUTPUT_DIR, output_filename)
            cv2.imwrite(output_filepath, annotated_bgr)
            
            # 5. UI Layout - Side-by-Side Comparison
            col1, col2 = st.columns(2)
            
            with col1:
                st.image(pil_img, caption="Original Uploaded Image", use_container_width=True)
                
            with col2:
                st.image(annotated_rgb, caption="YOLOv8 Damage Detections", use_container_width=True)
                
            # 6. Detection Stats Panel
            st.markdown("### 📊 Detection Summary & Assessment")
            
            sc1, sc2, sc3 = st.columns(3)
            with sc1:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-val" style="color: {'#10B981' if num_detections == 0 else '#EF4444'};">{num_detections}</div>
                    <div class="metric-label">Detected Damages</div>
                </div>
                """, unsafe_allow_html=True)
            with sc2:
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-val">{inference_time_ms} ms</div>
                    <div class="metric-label">Inference Latency</div>
                </div>
                """, unsafe_allow_html=True)
            with sc3:
                model_name_display = os.path.basename(model_path)
                st.markdown(f"""
                <div class="metric-card">
                    <div class="metric-val" style="font-size: 1.3rem; padding-top: 5px; padding-bottom: 5px;">{model_name_display}</div>
                    <div class="metric-label">Inference Model Engine</div>
                </div>
                """, unsafe_allow_html=True)
                
            # 7. List individual detections with details
            if num_detections > 0:
                st.markdown("#### 🔍 Detalized Damage Breakdown")
                
                # Table headers
                thead_col1, thead_col2, thead_col3, thead_col4 = st.columns([1, 1.5, 2, 2.5])
                thead_col1.markdown("**ID**")
                thead_col2.markdown("**Classification Class**")
                thead_col3.markdown("**Confidence Level**")
                thead_col4.markdown("**Bounding Box Coordinate [x1, y1, x2, y2]**")
                
                for idx, box in enumerate(boxes):
                    cls_id = int(box.cls[0])
                    class_name = model.names[cls_id]
                    confidence = float(box.conf[0])
                    coords = [round(float(c), 1) for c in box.xyxy[0]]
                    
                    row_col1, row_col2, row_col3, row_col4 = st.columns([1, 1.5, 2, 2.5])
                    row_col1.write(f"#{idx + 1}")
                    row_col2.write(f"🏷️ `{class_name}`")
                    row_col3.progress(confidence, text=f"**{confidence*100:.1f}%**")
                    row_col4.code(str(coords))
            else:
                st.success("✅ No vehicle damage detected based on current confidence settings!")
                
            # 8. Download processed image
            annotated_pil = Image.fromarray(annotated_rgb)
            
            # Prepare file bytes for streamlit download button
            from io import BytesIO
            buf = BytesIO()
            annotated_pil.save(buf, format="JPEG")
            byte_im = buf.getvalue()
            
            st.download_button(
                label=f"💾 Download Processed {file.name}",
                data=byte_im,
                file_name=f"detected_damage_{file.name}",
                mime="image/jpeg",
                key=f"dl_{file.name}_{i}"
            )
            
        except Exception as e:
            st.error(f"❌ Failed to process image '{file.name}': {str(e)}")
            st.info("Ensure the uploaded file is a valid, uncorrupted image.")

else:
    # Welcome & guide section when no image is uploaded
    st.markdown("---")
    col1, col2 = st.columns([2, 1])
    with col1:
        st.markdown("""
        ### 📥 Get Started
        Please upload one or more vehicle images in the box above to trigger the automated damage analysis.
        
        #### How it works:
        1. **Image Preprocessing**: The system loads the image and applies custom contrast and noise filters (optional sidebar controls) to optimize detection.
        2. **Neural Network Inference**: A state-of-the-art **YOLOv8** Convolutional Neural Network analyzes the image.
        3. **Feature Localization**: Damages are boxed and classified with highly accurate confidence statistics.
        4. **Interactive Report Generation**: Summary tables and comparison previews are rendered instantly with single-click download capabilities.
        """)
    with col2:
        st.image("https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&q=80&w=400", caption="Automotive Quality Control Assessment", use_container_width=True)
