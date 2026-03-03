// Soil Intelligence Engine (SIE)

export interface SoilData {
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  organicCarbon?: number;
  crop: string;
}

export interface CropRequirement {
  nitrogen: [number, number];
  phosphorus: [number, number];
  potassium: [number, number];
  ph: [number, number];
}

export const cropRequirements: Record<string, CropRequirement> = {
  wheat:     { nitrogen: [120, 150], phosphorus: [60, 80], potassium: [40, 60], ph: [6.0, 7.5] },
  rice:      { nitrogen: [100, 140], phosphorus: [50, 70], potassium: [50, 70], ph: [5.5, 6.5] },
  maize:     { nitrogen: [120, 160], phosphorus: [60, 80], potassium: [40, 60], ph: [5.8, 7.0] },
  cotton:    { nitrogen: [80, 120], phosphorus: [40, 60], potassium: [40, 60], ph: [6.0, 7.5] },
  sugarcane: { nitrogen: [150, 200], phosphorus: [80, 100], potassium: [60, 80], ph: [6.0, 7.5] },
  mustard:   { nitrogen: [80, 100], phosphorus: [40, 50], potassium: [30, 40], ph: [6.0, 7.0] },
};

export interface SoilAnalysis {
  healthScore: number;
  healthLabel: "good" | "moderate" | "poor";
  deficiencies: { nutrient: string; current: number; ideal: number; gap: number }[];
  yieldLoss: number;
  fertilizerPlan: { name: string; quantity: string }[];
}

function nutrientScore(val: number, min: number, max: number): number {
  const mid = (min + max) / 2;
  if (val >= min && val <= max) return 100;
  if (val < min) return Math.max(0, (val / min) * 100);
  return Math.max(0, 100 - ((val - max) / max) * 100);
}

function phScore(val: number, min: number, max: number): number {
  if (val >= min && val <= max) return 100;
  const dist = val < min ? min - val : val - max;
  return Math.max(0, 100 - dist * 30);
}

export function analyzeSoil(data: SoilData): SoilAnalysis {
  const req = cropRequirements[data.crop] || cropRequirements.wheat;

  const nScore = nutrientScore(data.nitrogen, req.nitrogen[0], req.nitrogen[1]);
  const pScore = nutrientScore(data.phosphorus, req.phosphorus[0], req.phosphorus[1]);
  const kScore = nutrientScore(data.potassium, req.potassium[0], req.potassium[1]);
  const pHsc = phScore(data.ph, req.ph[0], req.ph[1]);

  const healthScore = Math.round(nScore * 0.3 + pScore * 0.25 + kScore * 0.25 + pHsc * 0.2);
  const healthLabel = healthScore >= 75 ? "good" : healthScore >= 50 ? "moderate" : "poor";

  const deficiencies: SoilAnalysis["deficiencies"] = [];
  const idealN = (req.nitrogen[0] + req.nitrogen[1]) / 2;
  const idealP = (req.phosphorus[0] + req.phosphorus[1]) / 2;
  const idealK = (req.potassium[0] + req.potassium[1]) / 2;

  if (data.nitrogen < req.nitrogen[0]) {
    deficiencies.push({ nutrient: "Nitrogen", current: data.nitrogen, ideal: idealN, gap: Math.round(((idealN - data.nitrogen) / idealN) * 100) });
  }
  if (data.phosphorus < req.phosphorus[0]) {
    deficiencies.push({ nutrient: "Phosphorus", current: data.phosphorus, ideal: idealP, gap: Math.round(((idealP - data.phosphorus) / idealP) * 100) });
  }
  if (data.potassium < req.potassium[0]) {
    deficiencies.push({ nutrient: "Potassium", current: data.potassium, ideal: idealK, gap: Math.round(((idealK - data.potassium) / idealK) * 100) });
  }

  const avgGap = deficiencies.length > 0 ? deficiencies.reduce((s, d) => s + d.gap, 0) / deficiencies.length : 0;
  const yieldLoss = Math.min(60, Math.round(avgGap * 0.7));

  const fertilizerPlan: SoilAnalysis["fertilizerPlan"] = [];
  const nDef = Math.max(0, idealN - data.nitrogen);
  const pDef = Math.max(0, idealP - data.phosphorus);
  const kDef = Math.max(0, idealK - data.potassium);

  if (nDef > 0) fertilizerPlan.push({ name: "Urea (46% N)", quantity: `${Math.round(nDef / 0.46)} kg/acre` });
  if (pDef > 0) fertilizerPlan.push({ name: "DAP (46% P₂O₅)", quantity: `${Math.round(pDef / 0.46)} kg/acre` });
  if (kDef > 0) fertilizerPlan.push({ name: "MOP (60% K₂O)", quantity: `${Math.round(kDef / 0.60)} kg/acre` });
  if (data.ph < req.ph[0]) fertilizerPlan.push({ name: "Lime", quantity: `${Math.round((req.ph[0] - data.ph) * 200)} kg/acre` });
  if (data.ph > req.ph[1]) fertilizerPlan.push({ name: "Gypsum", quantity: `${Math.round((data.ph - req.ph[1]) * 250)} kg/acre` });

  return { healthScore, healthLabel, deficiencies, yieldLoss, fertilizerPlan };
}

// Soil history management via localStorage
export interface SoilRecord {
  id: string;
  date: string;
  data: SoilData;
  analysis: SoilAnalysis;
}

export function saveSoilRecord(record: SoilRecord) {
  const records = getSoilHistory();
  records.unshift(record);
  localStorage.setItem("agriguide-soil-history", JSON.stringify(records.slice(0, 20)));
}

export function getSoilHistory(): SoilRecord[] {
  try {
    return JSON.parse(localStorage.getItem("agriguide-soil-history") || "[]");
  } catch { return []; }
}

export function getSoilTrend(): "improving" | "stable" | "degrading" {
  const records = getSoilHistory();
  if (records.length < 2) return "stable";
  const recent = records.slice(0, 3).map(r => r.analysis.healthScore);
  const older = records.slice(3, 6).map(r => r.analysis.healthScore);
  if (older.length === 0) return "stable";
  const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
  const avgOlder = older.reduce((a, b) => a + b, 0) / older.length;
  if (avgRecent - avgOlder > 5) return "improving";
  if (avgOlder - avgRecent > 5) return "degrading";
  return "stable";
}
