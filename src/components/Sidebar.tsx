import React from "react";
import { Sliders, Cpu, Eye, Settings, ShieldAlert, Layers } from "lucide-react";
import { ModelConfig, DamageClassType } from "../types";

interface SidebarProps {
  config: ModelConfig;
  setConfig: React.Dispatch<React.SetStateAction<ModelConfig>>;
  systemStatus: {
    status: string;
    apiKeyConfigured: boolean;
    mode: string;
  } | null;
}

const CLASS_LABELS: Record<DamageClassType, { label: string; color: string }> = {
  dent: { label: "Dent (Panel)", color: "border-red-500 text-red-600 bg-red-50/50" },
  scratch: { label: "Scratch (Paint)", color: "border-blue-500 text-blue-600 bg-blue-50/50" },
  broken_light: { label: "Broken Light", color: "border-amber-500 text-amber-600 bg-amber-50/50" },
  bumper_damage: { label: "Bumper Damage", color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
  glass_damage: { label: "Glass Damage", color: "border-purple-500 text-purple-600 bg-purple-50/50" }
};

export default function Sidebar({ config, setConfig, systemStatus }: SidebarProps) {
  const toggleClass = (cls: DamageClassType) => {
    setConfig(prev => {
      const selected = prev.selectedClasses.includes(cls)
        ? prev.selectedClasses.filter(c => c !== cls)
        : [...prev.selectedClasses, cls];
      return { ...prev, selectedClasses: selected };
    });
  };

  return (
    <aside className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col shrink-0 h-auto lg:h-[calc(100vh-64px)] lg:overflow-y-auto" id="sidebar-panel">
      {/* Visual Header */}
      <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-800 text-lg tracking-tight">System Controls</span>
        </div>
        <p className="text-xs text-slate-500">Configure model weights, confidence scoring, and visual pre-filters.</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Model Configurations */}
        <div className="space-y-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-3.5 h-3.5" /> Model Configuration
          </label>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Detection Engine</label>
              <select
                value={config.modelType}
                onChange={e => setConfig(prev => ({ ...prev, modelType: e.target.value as "custom" | "standard" }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 outline-none focus:border-blue-500 focus:bg-white transition"
              >
                <option value="custom">YOLOv8 best.pt (Custom)</option>
                <option value="standard">YOLOv8n.pt (Pre-trained)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Model Weight Path</label>
              <input
                type="text"
                value={config.modelPath}
                onChange={e => setConfig(prev => ({ ...prev, modelPath: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-lg p-2.5 outline-none focus:border-blue-500 focus:bg-white transition font-mono"
              />
            </div>
          </div>
        </div>

        {/* Hyperparameters */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5" /> Hyperparameters
          </label>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>Confidence Threshold</span>
                <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{config.confidenceThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.00"
                step="0.05"
                value={config.confidenceThreshold}
                onChange={e => setConfig(prev => ({ ...prev, confidenceThreshold: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[10px] text-slate-400 mt-1">Filters out detections with scores below this margin.</p>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                <span>NMS IoU Threshold</span>
                <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{config.iouThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="1.00"
                step="0.05"
                value={config.iouThreshold}
                onChange={e => setConfig(prev => ({ ...prev, iouThreshold: parseFloat(e.target.value) }))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
              />
              <p className="text-[10px] text-slate-400 mt-1">Controls overlapping box suppression threshold (IoU).</p>
            </div>
          </div>
        </div>

        {/* Filter Damage Types */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" /> Target Damage Classes
          </label>

          <div className="space-y-2">
            {(Object.keys(CLASS_LABELS) as DamageClassType[]).map(cls => {
              const isChecked = config.selectedClasses.includes(cls);
              return (
                <label
                  key={cls}
                  className={`flex items-center gap-3 p-2 border rounded-lg cursor-pointer transition select-none ${
                    isChecked ? "border-blue-200 bg-blue-50/20" : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleClass(cls)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 accent-blue-600"
                  />
                  <span className="text-xs font-medium text-slate-700">{CLASS_LABELS[cls].label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* OpenCV Preprocessing */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> OpenCV Preprocessing
          </label>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-1 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-700">Contrast CLAHE</span>
                <p className="text-[10px] text-slate-400">Equalize lightness contrast</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableClahe}
                onChange={e => setConfig(prev => ({ ...prev, enableClahe: e.target.checked }))}
                className="w-9 h-5 bg-slate-200 checked:bg-blue-600 rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:left-4.5 before:transition-all"
              />
            </label>

            <label className="flex items-center justify-between p-1 cursor-pointer">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-slate-700">Non-Local Denoise</span>
                <p className="text-[10px] text-slate-400">Reduce digital image noise</p>
              </div>
              <input
                type="checkbox"
                checked={config.enableDenoise}
                onChange={e => setConfig(prev => ({ ...prev, enableDenoise: e.target.checked }))}
                className="w-9 h-5 bg-slate-200 checked:bg-blue-600 rounded-full cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:left-4.5 before:transition-all"
              />
            </label>
          </div>
        </div>

        {/* API Connection Banner */}
        <div className="pt-4 border-t border-slate-100">
          <div className={`p-4 rounded-xl border ${
            systemStatus?.apiKeyConfigured
              ? "border-emerald-200 bg-emerald-50/50 text-emerald-800"
              : "border-amber-200 bg-amber-50/50 text-amber-800"
          }`}>
            <div className="flex gap-2.5 items-start">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold leading-none mb-1">
                  {systemStatus?.apiKeyConfigured ? "Live Inference Enabled" : "Running in Demo Mode"}
                </h4>
                <p className="text-[10px] leading-relaxed opacity-90">
                  {systemStatus?.apiKeyConfigured
                    ? "Full-stack proxy is connected to Google Gemini 3.5 Flash for real-time visual analysis."
                    : "No Gemini API key found in secrets. Visual detections will use pre-trained simulated datasets."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
