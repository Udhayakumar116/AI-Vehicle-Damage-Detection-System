export type SeverityType = "minor" | "moderate" | "severe";
export type DamageClassType = "scratch" | "dent" | "broken_light" | "bumper_damage" | "glass_damage";

export interface DamageDetection {
  class_name: DamageClassType;
  confidence: number;
  severity: SeverityType;
  description: string;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] relative to 0-1000
}

export interface DetectionResult {
  damage_count: number;
  inference_time_ms: number;
  damages: DamageDetection[];
  is_mocked?: boolean;
  apiKeyConfigured?: boolean;
}

export interface ModelConfig {
  modelType: "custom" | "standard";
  modelPath: string;
  confidenceThreshold: number;
  iouThreshold: number;
  selectedClasses: DamageClassType[];
  enableClahe: boolean;
  enableDenoise: boolean;
}

export interface DemoVehicle {
  id: string;
  name: string;
  description: string;
  filename: string;
  url: string;
  damagesCount: number;
}
