import { useEffect, useState, useRef } from "react";
import { Terminal, ShieldAlert } from "lucide-react";

interface TerminalConsoleProps {
  onComplete: () => void;
  config: {
    modelType: string;
    modelPath: string;
    confidenceThreshold: number;
    iouThreshold: number;
    enableClahe: boolean;
    enableDenoise: boolean;
  };
}

export default function TerminalConsole({ onComplete, config }: TerminalConsoleProps) {
  const [logs, setLogs] = useState<string[]>([]);
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  const rawLogs = [
    `[YOLO-CORE] Initializing PyTorch CUDA device context... Found NVIDIA RTX 4090 GPU (1/1 active).`,
    `[YOLO-CORE] Loading neural layers from weight path: "${config.modelPath}"...`,
    `[YOLO-CORE] Structure: YOLOv8 backbone (Darknet53) with CSP-PAN block, 268 layer parameters.`,
    `[YOLO-CORE] Weights loaded successfully. Allocating VRAM caches...`,
    `[OPENCV] Initializing image capture buffer matrix.`,
    config.enableClahe ? `[OPENCV] [CLAHE] Applying Contrast Limited Adaptive Histogram Equalization (clip_limit=2.0)...` : `[OPENCV] Skipping contrast adjustment (CLAHE disabled in config).`,
    config.enableDenoise ? `[OPENCV] [DENOISE] Applying fast non-local means image denoising filters...` : `[OPENCV] Skipping noise suppression (Denoise disabled in config).`,
    `[YOLO-CORE] Model forward pass triggered (batch_size=1, resolution=640x640).`,
    `[YOLO-CORE] Performing coordinate bounding box regression & category classification layers...`,
    `[YOLO-CORE] [NMS] Running Non-Maximum Suppression (confidence_thresh=${config.confidenceThreshold}, iou_overlap_thresh=${config.iouThreshold})...`,
    `[YOLO-CORE] Feature map extraction complete. Generating detection matrices.`
  ];

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < rawLogs.length) {
        setLogs(prev => [...prev, rawLogs[index]]);
        index++;
      } else {
        clearInterval(interval);
        // Yield some tiny breathing room before completing
        const timer = setTimeout(() => {
          onComplete();
        }, 800);
        return () => clearTimeout(timer);
      }
    }, 180);

    return () => clearInterval(interval);
  }, [config]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 font-mono text-xs text-slate-300 max-w-3xl mx-auto w-full my-6">
      {/* Window Controls */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/60 block"></span>
          <span className="w-3 h-3 rounded-full bg-yellow-500/60 block"></span>
          <span className="w-3 h-3 rounded-full bg-green-500/60 block"></span>
          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider ml-2">Console Shell</span>
        </div>
        <div className="flex items-center gap-1 text-blue-400 font-bold tracking-tight text-[10px] uppercase">
          <Terminal className="w-3.5 h-3.5" />
          YOLOv8 Inference Logger
        </div>
      </div>

      {/* Terminal Viewport */}
      <div className="p-5 h-64 overflow-y-auto space-y-2 select-text" id="terminal-viewport">
        {logs.map((log, idx) => {
          let textStyle = "text-slate-400";
          if (log.includes("[YOLO-CORE]")) textStyle = "text-blue-400";
          if (log.includes("[OPENCV]")) textStyle = "text-purple-400";
          if (log.includes("success") || log.includes("NVIDIA")) textStyle = "text-emerald-400";

          return (
            <div key={idx} className="flex gap-2 leading-relaxed">
              <span className="text-slate-600 select-none">$&gt;</span>
              <span className={textStyle}>{log}</span>
            </div>
          );
        })}
        {logs.length === rawLogs.length && (
          <div className="flex gap-2 pt-2 animate-pulse text-emerald-400 font-semibold">
            <span className="text-slate-600 select-none">$&gt;</span>
            <span>SUCCESS: Inference log output compiled. Rendering reports...</span>
          </div>
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Footer Status Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 flex justify-between items-center text-[10px] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span>CUDA Engine: ACTIVE</span>
        </div>
        <span>Weights: {config.modelPath}</span>
      </div>
    </div>
  );
}
