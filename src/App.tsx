import React, { useState, useEffect, useRef } from "react";
import {
  Car,
  UploadCloud,
  Trash2,
  Play,
  FileCode,
  Sparkles,
  Info,
  Layers,
  Check,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Settings,
  AlertTriangle,
  Github
} from "lucide-react";
import { ModelConfig, DetectionResult, DemoVehicle } from "./types";
import Sidebar from "./components/Sidebar";
import DetectionViewer from "./components/DetectionViewer";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import TerminalConsole from "./components/TerminalConsole";
import CodeExplorer from "./components/CodeExplorer";

const DEMO_VEHICLES: DemoVehicle[] = [
  {
    id: "demo1",
    name: "Sample 1: Side Impact Damage",
    description: "Deep panel deformation and scratches on the driver's side front and rear door.",
    filename: "demo_car_1.jpg",
    url: "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=1200",
    damagesCount: 2
  },
  {
    id: "demo2",
    name: "Sample 2: Frontal Collision",
    description: "Shattered right headlight housing and dislocated front bumper cover.",
    filename: "demo_car_2.jpg",
    url: "https://images.unsplash.com/photo-1532581291347-9c39cf10a73c?auto=format&fit=crop&q=80&w=1200",
    damagesCount: 3
  },
  {
    id: "demo3",
    name: "Sample 3: Windshield Chip",
    description: "Heavy star-burst impact crack on the front windshield glass safety laminate.",
    filename: "demo_car_3.jpg",
    url: "https://images.unsplash.com/photo-1515964213264-b567d3651f28?auto=format&fit=crop&q=80&w=1200",
    damagesCount: 1
  }
];

export default function App() {
  const [config, setConfig] = useState<ModelConfig>({
    modelType: "custom",
    modelPath: "best.pt",
    confidenceThreshold: 0.25,
    iouThreshold: 0.45,
    selectedClasses: ["scratch", "dent", "broken_light", "bumper_damage", "glass_damage"],
    enableClahe: false,
    enableDenoise: false
  });

  const [activeTab, setActiveTab] = useState<"sandbox" | "codebase" | "architecture">("sandbox");
  const [selectedDemo, setSelectedDemo] = useState<DemoVehicle | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Inference progress state managers
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logsComplete, setLogsComplete] = useState(false);
  
  const [detectionResult, setDetectionResult] = useState<DetectionResult | null>(null);
  const [systemStatus, setSystemStatus] = useState<{ status: string; apiKeyConfigured: boolean; mode: string } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch API status on mount
  useEffect(() => {
    fetch("/api/status")
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => {
        console.error("Failed to connect to backend api status endpoint", err);
        setSystemStatus({ status: "offline", apiKeyConfigured: false, mode: "demo" });
      });
  }, []);

  // Handle Drag & Drop uploading
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Unsupported file format. Please upload a valid JPEG, JPG or PNG vehicle image.");
      return;
    }
    setError(null);
    setSelectedDemo(null);
    setDetectionResult(null);
    setLogsComplete(false);
    setShowLogs(false);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setUploadedImage(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectDemoVehicle = (demo: DemoVehicle) => {
    setError(null);
    setUploadedImage(null);
    setFileName(demo.filename);
    setSelectedDemo(demo);
    setDetectionResult(null);
    setLogsComplete(false);
    setShowLogs(false);
  };

  const resetScanner = () => {
    setUploadedImage(null);
    setFileName(null);
    setSelectedDemo(null);
    setDetectionResult(null);
    setLogsComplete(false);
    setShowLogs(false);
    setSelectedIndex(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Launch Detection workflow (triggers console, then API call)
  const runDetection = () => {
    const activeImage = uploadedImage || selectedDemo?.url;
    if (!activeImage) {
      setError("Please select a sample car or upload a custom vehicle photo to scan.");
      return;
    }

    setIsProcessing(true);
    setShowLogs(true);
    setLogsComplete(false);
    setDetectionResult(null);
    setError(null);
  };

  // Triggered when TerminalConsole typing is done
  const handleLogsFinished = async () => {
    const activeImage = uploadedImage || selectedDemo?.url;
    if (!activeImage) return;

    try {
      const payload = {
        image: activeImage,
        filename: fileName,
        isDemo: !!selectedDemo,
        confidenceThreshold: config.confidenceThreshold,
        selectedClasses: config.selectedClasses
      };

      const response = await fetch("/api/detect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.error || "Failed to parse damage. Verify connection state.");
      }

      const data: DetectionResult = await response.json();
      setDetectionResult(data);
      setLogsComplete(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Visual analysis timed out. Check your container server logs.");
      setShowLogs(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActiveImageSource = () => {
    return uploadedImage || selectedDemo?.url || "";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800" id="applet-viewport">
      {/* Upper Navigation Header */}
      <header className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm" id="main-header">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 text-base md:text-lg tracking-tight leading-none">
              AI Vehicle Damage Detector
            </h1>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">
              YOLOv8 deep neural network computer vision pipeline
            </p>
          </div>
        </div>

        {/* Central Menu Tabs */}
        <nav className="hidden md:flex gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold" id="tabs-navigation">
          <button
            onClick={() => setActiveTab("sandbox")}
            className={`px-4 py-2 rounded-lg transition select-none ${
              activeTab === "sandbox" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            💻 Interactive Sandbox
          </button>
          <button
            onClick={() => setActiveTab("codebase")}
            className={`px-4 py-2 rounded-lg transition select-none ${
              activeTab === "codebase" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            📦 Python YOLOv8 App Code
          </button>
          <button
            onClick={() => setActiveTab("architecture")}
            className={`px-4 py-2 rounded-lg transition select-none ${
              activeTab === "architecture" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            🔬 Neural Network Guide
          </button>
        </nav>

        {/* GitHub / Demo Badge */}
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            systemStatus?.apiKeyConfigured
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${systemStatus?.apiKeyConfigured ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`}></span>
            {systemStatus?.apiKeyConfigured ? "Live API Connected" : "Demo Cache Running"}
          </span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        {/* Sidebar settings (Only on sandbox tab) */}
        {activeTab === "sandbox" && (
          <Sidebar config={config} setConfig={setConfig} systemStatus={systemStatus} />
        )}

        {/* Center Canvas Area */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6" id="main-viewport">
          {/* Mobile responsive tab buttons */}
          <div className="md:hidden flex gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab("sandbox")}
              className={`flex-1 py-1.5 text-center rounded transition ${
                activeTab === "sandbox" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              Sandbox
            </button>
            <button
              onClick={() => setActiveTab("codebase")}
              className={`flex-1 py-1.5 text-center rounded transition ${
                activeTab === "codebase" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              Python App
            </button>
            <button
              onClick={() => setActiveTab("architecture")}
              className={`flex-1 py-1.5 text-center rounded transition ${
                activeTab === "architecture" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              }`}
            >
              NN Guide
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex gap-3 items-start shadow-sm animate-fade-in" id="error-box">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div>
                <h4 className="font-bold text-sm">System Conflict Encountered</h4>
                <p className="text-xs text-red-600/90 mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {/* --- TAB 1: SANDBOX INTERFACE --- */}
          {activeTab === "sandbox" && (
            <div className="space-y-8" id="sandbox-tab-root">
              {/* Display Welcome & Selector if no image is loaded */}
              {!uploadedImage && !selectedDemo && (
                <div className="space-y-8" id="sandbox-intro">
                  {/* Banner Intro */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 max-w-xl">
                      <div className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 font-bold uppercase tracking-widest text-[10px] px-2.5 py-1 rounded-full border border-blue-500/30">
                        <Sparkles className="w-3.5 h-3.5" /> High Precision Computer Vision
                      </div>
                      <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight">YOLOv8 Car Damage Assessment Platform</h2>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Assess scuffs, deep panel dents, fractured lights, bumper misalignments, and glass cracks in milliseconds. Tweak NMS confidence models dynamically in the control panel.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-5 rounded-xl transition shadow-md shrink-0 select-none cursor-pointer"
                      >
                        Upload Vehicle Image
                      </button>
                    </div>
                  </div>

                  {/* Sample Gallery Selector */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                      <h3 className="font-extrabold text-slate-800 text-sm">Or Select a Sample Vehicle Dataset</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="sample-gallery-grid">
                      {DEMO_VEHICLES.map((demo) => {
                        const isActive = selectedDemo?.id === demo.id;
                        return (
                          <div
                            key={demo.id}
                            onClick={() => selectDemoVehicle(demo)}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition flex flex-col group"
                          >
                            <div className="h-40 overflow-hidden relative bg-slate-100">
                              <img
                                src={demo.url}
                                alt={demo.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              />
                              <div className="absolute top-2.5 right-2.5 bg-slate-900/80 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                                {demo.damagesCount} Damages
                              </div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-bold text-slate-800 text-xs tracking-tight group-hover:text-blue-600 transition">{demo.name}</h4>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">{demo.description}</p>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold pt-3 mt-auto">
                                <span>Load this dataset</span>
                                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Drag-and-drop file upload container */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                      isDragging ? "border-blue-500 bg-blue-50/20" : "border-slate-300 bg-white hover:bg-slate-50/50"
                    }`}
                    id="uploader-container"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UploadCloud className="w-6 h-6 shrink-0" />
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Drag and Drop Vehicle Photo</h4>
                    <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, or JPEG up to 10MB size</p>
                  </div>
                </div>
              )}

              {/* Display workspace scanner details once image is loaded */}
              {(uploadedImage || selectedDemo) && (
                <div className="space-y-6" id="sandbox-active-scanner">
                  {/* File status control bar */}
                  <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Car className="w-5 h-5 shrink-0" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Target Vehicle</span>
                        <h4 className="font-bold text-slate-800 text-xs truncate max-w-xs md:max-w-md">
                          {fileName || "uploaded_vehicle_image.jpg"}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={resetScanner}
                        disabled={isProcessing}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Clear photo"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>

                      {!logsComplete && !isProcessing && (
                        <button
                          onClick={runDetection}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 shrink-0" /> Run AI Damage Detection
                        </button>
                      )}

                      {logsComplete && (
                        <button
                          onClick={resetScanner}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 px-4 rounded-xl transition"
                        >
                          Scan New Photo
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 1. Processing terminal log */}
                  {showLogs && !logsComplete && (
                    <TerminalConsole config={config} onComplete={handleLogsFinished} />
                  )}

                  {/* 2. Side-by-side detection preview once complete */}
                  {logsComplete && detectionResult && (
                    <DetectionViewer
                      originalImage={getActiveImageSource()}
                      damages={detectionResult.damages}
                      selectedIndex={selectedIndex}
                      onSelectIndex={setSelectedIndex}
                      filename={fileName || "vehicle"}
                    />
                  )}

                  {/* 3. Analytics summaries once complete */}
                  {logsComplete && detectionResult && (
                    <AnalyticsDashboard
                      result={detectionResult}
                      selectedIndex={selectedIndex}
                      onSelectIndex={setSelectedIndex}
                    />
                  )}

                  {/* Default Preview if scan hasn't run yet */}
                  {!showLogs && !logsComplete && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm" id="pre-run-prompt">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <Info className="w-6 h-6 shrink-0" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-sm">Neural Weights Loaded & Ready</h4>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        The AI engine has completed context allocation. Click the **"Run AI Damage Detection"** button above to feed the vehicle photo through YOLOv8.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* --- TAB 2: CODEBASE VIEWER --- */}
          {activeTab === "codebase" && (
            <div className="space-y-6" id="codebase-tab-root">
              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Production Python YOLOv8 + Streamlit Files</h2>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Export the complete physical source directory structure below to run on your local workstation, virtual machines, or stream cloud.
                </p>
              </div>
              <CodeExplorer />
            </div>
          )}

          {/* --- TAB 3: YOLO ARCHITECTURE EXPLAINED --- */}
          {activeTab === "architecture" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 select-text" id="architecture-tab-root">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 font-bold uppercase tracking-wider text-[9px] px-2.5 py-1 rounded border border-purple-200">
                  <BookOpen className="w-3 h-3" /> Technical Architecture
                </div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">How YOLOv8 Car Damage Localization Works</h2>
                <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
                  YOLOv8 (You Only Look Once version 8) is a modern deep convolutional neural network featuring state-of-the-art anchor-free object detection capabilities. Below is an overview of how images are preprocessed and parsed.
                </p>
              </div>

              {/* Visual Flow diagram */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4" id="nn-workflow">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 relative">
                  <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 w-7 h-7 rounded-full flex items-center justify-center border border-blue-200">01</div>
                  <h4 className="font-bold text-slate-800 text-xs pt-1">OpenCV Preprocessing</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Image is loaded and normalized. If CLAHE (Adaptive Equalization) is enabled, localized pixel contrast is enhanced to isolate scratches in dark regions.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 relative">
                  <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 w-7 h-7 rounded-full flex items-center justify-center border border-blue-200">02</div>
                  <h4 className="font-bold text-slate-800 text-xs pt-1">CNN Feature Extraction</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The backbone network downsamples the image while retaining spatial layers. A neck module aggregates multi-scale receptive fields.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 relative">
                  <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 w-7 h-7 rounded-full flex items-center justify-center border border-blue-200">03</div>
                  <h4 className="font-bold text-slate-800 text-xs pt-1">Anchor-Free Head</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instead of anchor boxes, YOLOv8 directly predicts the center coordinates and scaling factors of the bounding boxes, speeding up forward inference.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 relative">
                  <div className="text-xs font-mono font-bold text-blue-600 bg-blue-50 w-7 h-7 rounded-full flex items-center justify-center border border-blue-200">04</div>
                  <h4 className="font-bold text-slate-800 text-xs pt-1">NMS Suppression</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Filters out highly overlapping boxes pointing to the same localized defect using intersection-over-union calculation thresholds.
                  </p>
                </div>
              </div>

              {/* Deep Technical Table */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="font-extrabold text-slate-800 text-sm">Classification Metrics Dictionary</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-200">
                        <th className="py-3 px-5">Target Class</th>
                        <th className="py-3 px-5">Key Feature Signatures</th>
                        <th className="py-3 px-5">Common Detection Obstacles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600">
                      <tr>
                        <td className="py-3 px-5 font-bold text-slate-800">dent</td>
                        <td className="py-3 px-5">Shadow curvature changes, specular light reflection distortions on flat door/hood sheet metal.</td>
                        <td className="py-3 px-5">Difficult to distinguish under heavily diffused, overcast lighting.</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-bold text-slate-800">scratch</td>
                        <td className="py-3 px-5">Narrow, linear high-frequency white/silver streaks contrasting with dark automotive paint base layers.</td>
                        <td className="py-3 px-5">Can be easily confused with light glares, branch reflections, or dust particles.</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-bold text-slate-800">broken_light</td>
                        <td className="py-3 px-5">Cracks in polycarbonate lens housings, internal bulb exposures, discolored inner reflectors.</td>
                        <td className="py-3 px-5">Difficult to log when lights are turned on or reflecting direct sunlight.</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-5 font-bold text-slate-800">glass_damage</td>
                        <td className="py-3 px-5">Radial fracture spokes (spiderweb cracks), localized pits with halo rings.</td>
                        <td className="py-3 px-5">Requires fine-tuning due to absolute glass transparency and glare factors.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Sticky Bottom Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 border-t border-slate-800 text-center text-xs flex flex-col sm:flex-row items-center justify-between gap-4" id="main-footer">
        <p className="font-mono">© 2026 AI Vehicle Damage Detector System — Production Ready v8.1</p>
        <div className="flex gap-4">
          <a href="#codebase-tab" onClick={() => setActiveTab("codebase")} className="hover:text-white transition font-semibold">Get Python Files</a>
          <span className="text-slate-700">|</span>
          <a href="#nn-tab" onClick={() => setActiveTab("architecture")} className="hover:text-white transition font-semibold">Model Specs</a>
        </div>
      </footer>
    </div>
  );
}
