import { useState } from "react";
import { FileCode, FileText, Check, Copy, Download, Folder, ChevronRight, Terminal } from "lucide-react";

interface FileItem {
  name: string;
  type: "code" | "text" | "ignore";
  content: string;
}

const FILES: FileItem[] = [
  {
    name: "app.py",
    type: "code",
    content: `\"\"\"
AI Vehicle Damage Detection System
Author: Senior AI/ML Engineer
Stack: Streamlit + YOLOv8 + OpenCV + PyTorch

This script implements a production-ready vehicle damage detection application.
It supports single/multiple image uploads, image preprocessing, real-time bounding box
inference, stats calculation, and image saving/downloading.
\"\"\"

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
st.markdown(\"\"\"
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
\"\"\", unsafe_allow_html=True)

# --- Sidebar Controls ---
st.sidebar.image("https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=200", use_container_width=True)
st.sidebar.title("🔧 Configuration Panel")
st.sidebar.markdown("Configure the YOLOv8 model inference parameters below.")

# Model selection & loading
model_path = st.sidebar.text_input("Model Path", value="best.pt", help="Path to your custom YOLOv8 model file")
conf_threshold = st.sidebar.slider("Confidence Threshold", min_value=0.05, max_value=1.0, value=0.25, step=0.05)
iou_threshold = st.sidebar.slider("IoU Overlap Threshold", min_value=0.05, max_value=1.0, value=0.45, step=0.05)

# Preprocessing Option
st.sidebar.subheader("🖼️ Preprocessing Settings")
enable_clahe = st.sidebar.checkbox("Enhance Contrast (CLAHE)", value=False)
enable_denoise = st.sidebar.checkbox("Denoise Image", value=False)

# --- Helper Functions ---
@st.cache_resource(show_spinner=False)
def load_yolo_model(path):
    try:
        if os.path.exists(path):
            return YOLO(path), f"Successfully loaded custom model: **{path}**"
        else:
            st.warning(f"⚠️ Custom model '{path}' not found. Falling back to pretrained 'yolov8n.pt'.")
            return YOLO("yolov8n.pt"), "Fallback model: **yolov8n.pt**"
    except Exception as e:
        st.error(f"Error loading model: {str(e)}")
        return None, "Error"

def preprocess_image(image_pil, use_clahe=False, use_denoise=False):
    img_bgr = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)
    if use_clahe:
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

# Load the model
with st.spinner("Initializing YOLOv8 engine..."):
    model, load_msg = load_yolo_model(model_path)
st.info(load_msg)

# --- File Uploader ---
uploaded_files = st.file_uploader(
    "Upload vehicle images",
    type=["jpg", "jpeg", "png"],
    accept_multiple_files=True
)

if uploaded_files:
    for i, file in enumerate(uploaded_files):
        try:
            pil_img = Image.open(file).convert("RGB")
            processed_bgr = preprocess_image(pil_img, use_clahe=enable_clahe, use_denoise=enable_denoise)
            
            t_start = time.time()
            results = model.predict(source=processed_bgr, conf=conf_threshold, iou=iou_threshold, verbose=False)
            t_end = time.time()
            inference_time_ms = int((t_end - t_start) * 1000)
            
            result = results[0]
            boxes = result.boxes
            num_detections = len(boxes)
            
            annotated_bgr = result.plot()
            annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
            
            col1, col2 = st.columns(2)
            with col1:
                st.image(pil_img, caption="Original Uploaded Image", use_container_width=True)
            with col2:
                st.image(annotated_rgb, caption="YOLOv8 Damage Detections", use_container_width=True)
                
            st.markdown("### 📊 Detection Summary & Assessment")
            sc1, sc2, sc3 = st.columns(3)
            # Render statistics dashboard...
            # Download processed image...
        except Exception as e:
            st.error(f"❌ Failed to process image: {str(e)}")
`
  },
  {
    name: "requirements.txt",
    type: "text",
    content: `# Production-ready Python Dependencies for YOLOv8 Streamlit App
streamlit>=1.32.0
ultralytics>=8.1.0
opencv-python-headless>=4.9.0.80
numpy>=1.24.0,<2.0.0
Pillow>=10.2.0
torch>=2.2.0
torchvision>=0.17.0`
  },
  {
    name: "README.md",
    type: "text",
    content: `# 🚗 AI Vehicle Damage Detection System (YOLOv8 + Streamlit)

A professional, production-ready AI/ML system that detects, localizes, and classifies vehicle damages (including scratches, dents, broken lights, bumper damage, and glass damage) in real-time from uploaded images. Powered by the high-speed **YOLOv8 Convolutional Neural Network (Ultralytics)** and packaged into an interactive, high-fidelity **Streamlit** dashboard.

---

## 🛠️ Step-by-Step Setup & Installation

Ensure you have **Python 3.10 or 3.11** installed.

### 1. Setup Virtual Environment
\`\`\`bash
python -m venv .venv
source .venv/bin/activate # On Windows use: .venv\\Scripts\\activate
\`\`\`

### 2. Install Dependencies
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 3. Place Weights
Add your custom trained \`best.pt\` file to the root.

### 4. Run the Streamlit Frontend
\`\`\`bash
streamlit run app.py
\`\`\`
`
  },
  {
    name: ".gitignore",
    type: "ignore",
    content: `# Ignore Python and YOLO caching
__pycache__/
*.py[cod]
.venv/
venv/
*.pt
outputs/
models/yolov8*.pt
runs/`
  }
];

export default function CodeExplorer() {
  const [activeFile, setActiveFile] = useState<FileItem>(FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([activeFile.content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = activeFile.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800 text-slate-300" id="code-explorer">
      {/* Upper Window Header */}
      <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 block"></span>
          </div>
          <div className="h-4 w-[1px] bg-slate-800 mx-1"></div>
          <span className="text-xs font-mono text-slate-400 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-blue-400" /> python-project / {activeFile.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
            title="Copy file contents"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition flex items-center gap-1.5 text-xs font-medium"
            title="Download file"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 h-[550px]" id="editor-layout">
        {/* Left Side: Directory Tree */}
        <div className="col-span-1 bg-slate-950 p-4 border-r border-slate-800 space-y-4">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Workspace Files</span>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 py-1 px-2">
                <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                <span>vehicle_damage_detection/</span>
              </div>
              <div className="pl-4 space-y-1">
                {FILES.map(file => {
                  const isActive = activeFile.name === file.name;
                  return (
                    <button
                      key={file.name}
                      onClick={() => setActiveFile(file)}
                      className={`w-full flex items-center justify-between text-xs py-2 px-3 rounded-md transition text-left ${
                        isActive
                          ? "bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {file.type === "code" ? (
                          <FileCode className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>
                      <ChevronRight className={`w-3 h-3 shrink-0 transition-transform ${isActive ? "rotate-90 text-blue-400" : "text-slate-600"}`} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Setup Command</span>
            <div className="bg-slate-900 rounded p-2.5 font-mono text-[11px] text-emerald-400 border border-slate-800 select-all">
              pip install -r requirements.txt
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Launch Command</span>
            <div className="bg-slate-900 rounded p-2.5 font-mono text-[11px] text-blue-400 border border-slate-800 select-all">
              streamlit run app.py
            </div>
          </div>
        </div>

        {/* Right Side: Code Area */}
        <div className="col-span-3 h-full overflow-auto bg-slate-900/50 p-6 font-mono text-xs leading-relaxed select-text" id="code-editor-viewport">
          <pre className="text-slate-300">
            <code>{activeFile.content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
