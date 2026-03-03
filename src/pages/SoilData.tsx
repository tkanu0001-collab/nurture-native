import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";
import SoilHealthChart from "@/components/SoilHealthChart";
import AppFooter from "@/components/AppFooter";
import { analyzeSoil, saveSoilRecord, SoilAnalysis, cropRequirements } from "@/lib/soilEngine";
import { motion, AnimatePresence } from "framer-motion";
import { FlaskConical, TrendingDown, Sprout, Droplets, AlertTriangle, Beaker } from "lucide-react";

export default function SoilDataPage() {
  const { t } = useLanguage();
  const [nitrogen, setNitrogen] = useState("");
  const [phosphorus, setPhosphorus] = useState("");
  const [potassium, setPotassium] = useState("");
  const [ph, setPh] = useState("");
  const [organicCarbon, setOrganicCarbon] = useState("");
  const [crop, setCrop] = useState("wheat");
  const [result, setResult] = useState<SoilAnalysis | null>(null);

  const crops = Object.keys(cropRequirements);

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      ph: parseFloat(ph),
      organicCarbon: organicCarbon ? parseFloat(organicCarbon) : undefined,
      crop,
    };
    const analysis = analyzeSoil(data);
    setResult(analysis);
    saveSoilRecord({
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      data,
      analysis,
    });
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <PageHeader title={t("enterSoilData")} icon={<FlaskConical className="h-6 w-6 text-primary" />} />

      <form onSubmit={handleAnalyze} className="space-y-4 mb-6">
        {/* Crop selection */}
        <div>
          <label className="agri-label">{t("cropType")}</label>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} className="agri-input">
            {crops.map((c) => (
              <option key={c} value={c}>{t(c)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="agri-label">{t("nitrogen")}</label>
            <input type="number" value={nitrogen} onChange={(e) => setNitrogen(e.target.value)} className="agri-input" placeholder="kg/ha" required />
          </div>
          <div>
            <label className="agri-label">{t("phosphorus")}</label>
            <input type="number" value={phosphorus} onChange={(e) => setPhosphorus(e.target.value)} className="agri-input" placeholder="kg/ha" required />
          </div>
          <div>
            <label className="agri-label">{t("potassium")}</label>
            <input type="number" value={potassium} onChange={(e) => setPotassium(e.target.value)} className="agri-input" placeholder="kg/ha" required />
          </div>
          <div>
            <label className="agri-label">{t("ph")}</label>
            <input type="number" step="0.1" value={ph} onChange={(e) => setPh(e.target.value)} className="agri-input" placeholder="0-14" required />
          </div>
        </div>

        <div>
          <label className="agri-label">{t("organicCarbon")} (optional)</label>
          <input type="number" step="0.01" value={organicCarbon} onChange={(e) => setOrganicCarbon(e.target.value)} className="agri-input" placeholder="%" />
        </div>

        <motion.button whileTap={{ scale: 0.97 }} type="submit" className="agri-btn-primary w-full">
          <Beaker className="h-5 w-5" />
          {t("analyze")}
        </motion.button>
      </form>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Health Score */}
            <div className="agri-card flex flex-col items-center">
              <SoilHealthChart score={result.healthScore} label={t("soilHealth")} />
              <span className={`mt-2 rounded-full px-3 py-1 text-xs font-bold uppercase ${
                result.healthLabel === "good" ? "bg-primary/10 text-primary" :
                result.healthLabel === "moderate" ? "bg-accent/20 text-accent-foreground" :
                "bg-destructive/10 text-destructive"
              }`}>
                {t(result.healthLabel)}
              </span>
            </div>

            {/* Deficiencies */}
            {result.deficiencies.length > 0 && (
              <div className="agri-card">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="h-5 w-5 text-accent" />
                  <h3 className="font-display font-bold">{t("deficiency")}</h3>
                </div>
                <div className="space-y-2">
                  {result.deficiencies.map((d) => (
                    <div key={d.nutrient} className="flex items-center justify-between rounded-lg bg-muted p-3">
                      <span className="font-display font-semibold text-sm">{d.nutrient}</span>
                      <div className="text-right text-xs">
                        <span className="text-destructive font-bold">{d.current}</span>
                        <span className="text-muted-foreground"> / {d.ideal} kg/ha</span>
                        <span className="ml-2 text-destructive font-bold">-{d.gap}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Yield Impact */}
            {result.yieldLoss > 0 && (
              <div className="agri-card border-destructive/30 bg-destructive/5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  <h3 className="font-display font-bold text-destructive">{t("yieldImpact")}</h3>
                </div>
                <p className="text-2xl font-display font-black text-destructive">-{result.yieldLoss}%</p>
              </div>
            )}

            {/* Fertilizer Plan */}
            {result.fertilizerPlan.length > 0 && (
              <div className="agri-card">
                <div className="flex items-center gap-2 mb-3">
                  <Sprout className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-bold">{t("fertilizerPlan")}</h3>
                </div>
                <div className="space-y-2">
                  {result.fertilizerPlan.map((f) => (
                    <div key={f.name} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                      <span className="font-display font-semibold text-sm">{f.name}</span>
                      <span className="text-sm font-bold text-primary">{f.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AppFooter />
    </div>
  );
}
