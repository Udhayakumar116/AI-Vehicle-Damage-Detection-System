import { useState, useRef } from "react";
import { Download, ToggleLeft, ToggleRight, Layers, HelpCircle } from "lucide-react";
import { DamageDetection, DamageClassType } from "../types";

interface DetectionViewerProps {
  originalImage: string;
  damages: DamageDetection[];
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
  filename?: string;
}

const CLASS_THEME: Record<DamageClassType, { label: string; stroke: string; fill: string; badge: string }> = {
  dent: { label: "Dent", stroke: "#EF4444", fill: "rgba(239, 68, 68, 0.15)", badge: "bg-red-500" },
  scratch: { label: "Scratch", stroke: "#3B82F6", fill: "rgba(59, 130, 246, 0.15)", badge: "bg-blue-500" },
  broken_light: { label: "Broken Light", stroke: "#F59E0B", fill: "rgba(245, 158, 11, 0.15)", badge: "bg-amber-500" },
  bumper_damage: { label: "Bumper Damage", stroke: "#10B981", fill: "rgba(16, 185, 129, 0.15)", badge: "bg-emerald-500" },
  glass_damage: { label: "Glass Damage", stroke: "#8B5CF6", fill: "rgba(139, 92, 246, 0.15)", badge: "bg-purple-500" }
};

export default function DetectionViewer({ originalImage, damages, selectedIndex, onSelectIndex, filename }: DetectionViewerProps) {
  const [showLabels, setShowLabels] = useState(true);
  const [showBoxes, setShowBoxes] = useState(true);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Download annotated image by creating a canvas drawing
  const triggerAnnotatedDownload = () => {
    if (!originalImage) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Draw base image
      ctx.drawImage(img, 0, 0);

      if (showBoxes) {
        // 2. Overlay bounding boxes and labels
        damages.forEach(damage => {
          const [ymin, xmin, ymax, xmax] = damage.box_2d;
          
          // Map relative 1000-scale coordinates to actual pixel dimensions
          const x = (xmin / 1000) * canvas.width;
          const y = (ymin / 1000) * canvas.height;
          const w = ((xmax - xmin) / 1000) * canvas.width;
          const h = ((ymax - ymin) / 1000) * canvas.height;

          const theme = CLASS_THEME[damage.class_name] || { label: "Damage", stroke: "#EF4444", fill: "rgba(239, 68, 68, 0.1)", badge: "bg-red-500" };

          // Draw Rect
          ctx.strokeStyle = theme.stroke;
          ctx.lineWidth = Math.max(3, canvas.width / 350); // Scale line thickness with image size
          ctx.strokeRect(x, y, w, h);

          // Draw Fill
          ctx.fillStyle = theme.fill;
          ctx.fillRect(x, y, w, h);

          // Draw Label Badge
          if (showLabels) {
            const labelText = `${theme.label} (${Math.round(damage.confidence * 100)}%)`;
            const paddingX = 12;
            const paddingY = 8;
            
            ctx.font = `bold ${Math.max(12, canvas.width / 80)}px monospace`;
            const textWidth = ctx.measureText(labelText).width;
            const badgeHeight = Math.max(18, canvas.width / 50);

            // Draw label background
            ctx.fillStyle = theme.stroke;
            ctx.fillRect(x, y - badgeHeight > 0 ? y - badgeHeight : y, textWidth + paddingX, badgeHeight);

            // Draw label text
            ctx.fillStyle = "#ffffff";
            ctx.textBaseline = "middle";
            ctx.fillText(
              labelText,
              x + paddingX / 2,
              (y - badgeHeight > 0 ? y - badgeHeight : y) + badgeHeight / 2
            );
          }
        });
      }

      // 3. Export canvas as data URL and download
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `yolov8_detected_${filename || "vehicle_analysis"}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = originalImage;
  };

  return (
    <div className="space-y-4" id="detection-viewer-root">
      {/* Visual Options Menu Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className="flex items-center gap-1.5 hover:text-slate-900 transition select-none"
          >
            {showBoxes ? <ToggleRight className="w-5 h-5 text-blue-600 shrink-0" /> : <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />}
            <span>Show Boxes</span>
          </button>

          <button
            onClick={() => setShowLabels(!showLabels)}
            className="flex items-center gap-1.5 hover:text-slate-900 transition select-none"
            disabled={!showBoxes}
          >
            {showLabels ? <ToggleRight className="w-5 h-5 text-blue-600 shrink-0" /> : <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />}
            <span className={!showBoxes ? "opacity-50" : ""}>Show Labels</span>
          </button>
        </div>

        <button
          onClick={triggerAnnotatedDownload}
          className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3.5 rounded-lg shadow-sm transition"
        >
          <Download className="w-4 h-4" /> Download Annotated Image
        </button>
      </div>

      {/* Side-by-Side Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dual-preview-container">
        {/* Original Image Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Original Uploaded Vehicle</span>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono uppercase">Raw Input</span>
          </div>
          <div className="bg-slate-100 p-4 flex items-center justify-center flex-1 h-80 lg:h-[400px]">
            <img
              src={originalImage}
              alt="Raw Vehicle"
              className="max-h-full max-w-full object-contain rounded-md"
            />
          </div>
        </div>

        {/* Processed/Annotated Image Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className="px-4 py-3 bg-slate-50 border-b border-slate-150 text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>YOLOv8 Neural Detections</span>
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-mono uppercase font-bold">Processed</span>
          </div>

          <div className="bg-slate-100 p-4 flex items-center justify-center flex-1 h-80 lg:h-[400px] relative">
            <div className="relative max-h-full max-w-full aspect-video flex items-center justify-center">
              {/* Image base */}
              <img
                ref={imageRef}
                src={originalImage}
                alt="Detected damages"
                className="max-h-full max-w-full object-contain rounded-md"
              />

              {/* Responsive SVG bounding box layers */}
              {showBoxes && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-auto"
                  viewBox="0 0 1000 1000"
                  preserveAspectRatio="none"
                >
                  {damages.map((damage, idx) => {
                    const [ymin, xmin, ymax, xmax] = damage.box_2d;
                    const width = xmax - xmin;
                    const height = ymax - ymin;
                    const isSelected = selectedIndex === idx;

                    const theme = CLASS_THEME[damage.class_name] || { label: "Damage", stroke: "#EF4444", fill: "rgba(239, 68, 68, 0.15)", badge: "bg-red-500" };

                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => onSelectIndex(idx)}
                        onMouseLeave={() => onSelectIndex(null)}
                        className="cursor-pointer transition duration-200"
                      >
                        {/* Bounding box outline & transparent fill */}
                        <rect
                          x={xmin}
                          y={ymin}
                          width={width}
                          height={height}
                          stroke={theme.stroke}
                          strokeWidth={isSelected ? 6 : 3}
                          fill={isSelected ? "rgba(59, 130, 246, 0.25)" : theme.fill}
                          className="transition-all"
                        />

                        {/* Text Label Badge */}
                        {showLabels && (
                          <g transform={`translate(${xmin}, ${ymin - 25 > 20 ? ymin - 25 : ymin + height + 10})`}>
                            {/* Background block */}
                            <rect
                              x="0"
                              y="0"
                              width={damage.class_name.length * 9 + 60}
                              height="22"
                              fill={theme.stroke}
                              rx="3"
                            />
                            {/* Inner text */}
                            <text
                              x="8"
                              y="15"
                              fill="#ffffff"
                              fontSize="11"
                              fontWeight="bold"
                              fontFamily="monospace"
                            >
                              {theme.label} {Math.round(damage.confidence * 100)}%
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
