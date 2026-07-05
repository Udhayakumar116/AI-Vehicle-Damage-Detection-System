import { Gauge, Clock, ShieldAlert, Cpu, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { DetectionResult, DamageDetection, DamageClassType, SeverityType } from "../types";

interface AnalyticsDashboardProps {
  result: DetectionResult;
  selectedIndex: number | null;
  onSelectIndex: (index: number | null) => void;
}

const SEVERITY_COLORS: Record<SeverityType, { text: string; bg: string; border: string }> = {
  minor: { text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  moderate: { text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  severe: { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" }
};

const CLASS_LABELS: Record<DamageClassType, string> = {
  dent: "Dent / Panel Deformation",
  scratch: "Paint Scratch / Scuff Mark",
  broken_light: "Broken Light Lens / Shell",
  bumper_damage: "Bumper Impact Damage",
  glass_damage: "Windshield Glass Crack"
};

const REPAIR_ACTIONS: Record<DamageClassType, string> = {
  scratch: "Surface polishing with rubbing compound. Apply localized paint touch-up and clear-coat seal.",
  dent: "Requires Paintless Dent Repair (PDR) suction pulls or metal massaging from behind the panel.",
  broken_light: "Full replacement of light cover assembly shell. Disconnect harness, swap, and recalibrate.",
  bumper_damage: "Unclip bumper, realign brackets, weld structural plastic cracks, prime and complete full repaint.",
  glass_damage: "Inject high-density polymer resin to seal minor stars, or perform full windshield replacement."
};

const LABOR_ESTIMATES: Record<DamageClassType, string> = {
  scratch: "1.5 - 2 Hours ($120 - $250)",
  dent: "2 - 4 Hours ($180 - $400)",
  broken_light: "1 Hour ($150 - $350)",
  bumper_damage: "3 - 5 Hours ($300 - $750)",
  glass_damage: "2 Hours ($200 - $600)"
};

export default function AnalyticsDashboard({ result, selectedIndex, onSelectIndex }: AnalyticsDashboardProps) {
  const { damages, inference_time_ms } = result;

  // Calculate highest severity
  let overallSeverity: SeverityType = "minor";
  if (damages.some(d => d.severity === "severe")) {
    overallSeverity = "severe";
  } else if (damages.some(d => d.severity === "moderate")) {
    overallSeverity = "moderate";
  }

  return (
    <div className="space-y-6" id="analytics-dashboard-root">
      {/* 4-Column Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="stats-grid">
        {/* Card 1: Detected Count */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className={`p-3.5 rounded-xl ${damages.length > 0 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
            <Gauge className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Detections</span>
            <span className="text-2xl font-extrabold text-slate-800 leading-none">
              {damages.length}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              {damages.length === 0 ? "No damage found" : "Requires inspection"}
            </span>
          </div>
        </div>

        {/* Card 2: Inference Time */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <Clock className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latency</span>
            <span className="text-2xl font-extrabold text-slate-800 leading-none">
              {inference_time_ms} ms
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Neural forward pass</span>
          </div>
        </div>

        {/* Card 3: Overall Severity */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className={`p-3.5 rounded-xl ${
            overallSeverity === "severe" ? "bg-red-50 text-red-600" :
            overallSeverity === "moderate" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
          }`}>
            <ShieldAlert className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Overall Severity</span>
            <span className={`text-xl font-black capitalize leading-none ${
              overallSeverity === "severe" ? "text-red-600" :
              overallSeverity === "moderate" ? "text-amber-600" : "text-emerald-600"
            }`}>
              {overallSeverity}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Structural threat rating</span>
          </div>
        </div>

        {/* Card 4: Model Engine */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-purple-50 text-purple-600">
            <Cpu className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Network Engine</span>
            <span className="text-sm font-bold text-slate-800 block truncate leading-none">
              YOLOv8 best.pt
            </span>
            <span className="text-[10px] text-slate-500 block mt-1">Ultralytics PyTorch CNN</span>
          </div>
        </div>
      </div>

      {/* Main Analysis table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="analysis-table-container">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-sm">Visual Damage Breakdown & Remediation Action Plan</h3>
          <div className="flex gap-2 text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 shrink-0" /> Hover rows to highlight boxes</span>
          </div>
        </div>

        {damages.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">No Damaged Areas Detected!</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              YOLOv8 has scanned this vehicle and found zero areas of concern matching the active configuration.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto select-none">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-5">ID</th>
                  <th className="py-3 px-5">Classification</th>
                  <th className="py-3 px-5">Confidence</th>
                  <th className="py-3 px-5">Severity</th>
                  <th className="py-3 px-5">Description</th>
                  <th className="py-3 px-5">Technical Repair Action</th>
                  <th className="py-3 px-5 text-right">Est. Labor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {damages.map((damage, idx) => {
                  const isSelected = selectedIndex === idx;
                  const severityTheme = SEVERITY_COLORS[damage.severity] || SEVERITY_COLORS.minor;

                  return (
                    <tr
                      key={idx}
                      onMouseEnter={() => onSelectIndex(idx)}
                      onMouseLeave={() => onSelectIndex(null)}
                      className={`transition-colors duration-150 hover:bg-slate-50 cursor-pointer ${
                        isSelected ? "bg-blue-50/40 border-l-4 border-l-blue-500 font-medium" : ""
                      }`}
                    >
                      <td className="py-3.5 px-5 font-mono text-slate-400">
                        #{idx + 1}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-700">
                        {CLASS_LABELS[damage.class_name] || damage.class_name}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${damage.confidence * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-slate-600 font-bold">
                            {(damage.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${severityTheme.bg} ${severityTheme.text} ${severityTheme.border}`}>
                          {damage.severity}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-[200px] truncate" title={damage.description}>
                        {damage.description}
                      </td>
                      <td className="py-3.5 px-5 text-slate-600 max-w-[240px]">
                        {REPAIR_ACTIONS[damage.class_name] || "Generic repair instructions."}
                      </td>
                      <td className="py-3.5 px-5 text-right text-slate-500 font-mono">
                        {LABOR_ESTIMATES[damage.class_name] || "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standardized Cost Estimation Info Box */}
      {damages.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5 flex items-start gap-4">
          <div className="p-2.5 bg-blue-600 text-white rounded-lg">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800 text-sm">Automated Insurance Claim Intake Ready</h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              This damage assessment log has been formatted into a standardized visual asset matrix. The YOLOv8 localized coordinate offsets can be automatically dispatched to downstream repair estimators, saving hours in claim intake cycles.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold pt-1.5 cursor-pointer hover:text-blue-700 transition">
              <span>View full repair estimation methodology</span>
              <ChevronRight className="w-4 h-4 shrink-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
