import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";
import AppFooter from "@/components/AppFooter";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";
import {
  Upload, FileText, Loader2, Sprout, MessageSquare, Send,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp,
} from "lucide-react";

interface SoilParam {
  name: string;
  value: string;
  idealRange: string;
  status: "low" | "medium" | "high";
}

export default function SoilHealthCard() {
  const { t, lang: language } = useLanguage();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [soilParams, setSoilParams] = useState<SoilParam[]>([]);
  const [recommendations, setRecommendations] = useState("");
  const [loadingRec, setLoadingRec] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [showAskSection, setShowAskSection] = useState(false);

  // Manual entry fields
  const [manualN, setManualN] = useState("");
  const [manualP, setManualP] = useState("");
  const [manualK, setManualK] = useState("");
  const [manualPh, setManualPh] = useState("");
  const [manualOC, setManualOC] = useState("");
  const [manualEC, setManualEC] = useState("");
  const [manualZn, setManualZn] = useState("");
  const [manualFe, setManualFe] = useState("");
  const [manualMn, setManualMn] = useState("");
  const [manualCu, setManualCu] = useState("");
  const [manualSoilType, setManualSoilType] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtracting(true);
    setSoilParams([]);
    setRecommendations("");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("agri-ai", {
        body: { type: "soil-card-extract", image: base64, lang: language },
      });
      if (error) throw error;
      if (data?.params) {
        setSoilParams(data.params);
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: t("uploadError"), description: err.message, variant: "destructive" });
    } finally {
      setExtracting(false);
    }
  };

  const handleManualSubmit = () => {
    const params: SoilParam[] = [];
    const addParam = (name: string, val: string, ideal: string) => {
      if (!val) return;
      const v = parseFloat(val);
      const [lo, hi] = ideal.split("-").map(Number);
      const status: SoilParam["status"] = v < lo ? "low" : v > hi ? "high" : "medium";
      params.push({ name, value: val, idealRange: ideal, status });
    };
    addParam(t("nitrogen"), manualN, "240-480");
    addParam(t("phosphorus"), manualP, "25-50");
    addParam(t("potassium"), manualK, "200-300");
    addParam(t("ph"), manualPh, "6.0-7.5");
    addParam(t("organicCarbon"), manualOC, "0.5-0.75");
    addParam(t("electricalConductivity"), manualEC, "0-1.0");
    addParam(t("zinc"), manualZn, "0.6-2.0");
    addParam(t("iron"), manualFe, "4.5-10.0");
    addParam(t("manganese"), manualMn, "2.0-5.0");
    addParam(t("copper"), manualCu, "0.2-1.0");
    if (manualSoilType) params.push({ name: t("soilType"), value: manualSoilType, idealRange: "-", status: "medium" });
    
    if (params.length === 0) {
      toast({ title: t("errorOccurred"), description: "Please enter at least one soil parameter.", variant: "destructive" });
      return;
    }
    
    setSoilParams(params);
    setShowManual(false);
  };

  const getRecommendations = async () => {
    if (soilParams.length === 0) return;
    setLoadingRec(true);
    try {
      const soilSummary = soilParams.map((p) => `${p.name}: ${p.value} (Ideal: ${p.idealRange}, Status: ${p.status})`).join("\n");
      const { data, error } = await supabase.functions.invoke("agri-ai", {
        body: { type: "soil-recommendations", soilData: soilSummary, lang: language },
      });
      if (error) throw error;
      setRecommendations(data?.result || "");
    } catch (err: any) {
      toast({ title: t("errorOccurred"), description: err.message, variant: "destructive" });
    }
    setLoadingRec(false);
  };

  const askAI = async () => {
    if (!askQuestion.trim() || soilParams.length === 0) return;
    setAskLoading(true);
    try {
      const soilSummary = soilParams.map((p) => `${p.name}: ${p.value} (Ideal: ${p.idealRange}, Status: ${p.status})`).join("\n");
      const { data, error } = await supabase.functions.invoke("agri-ai", {
        body: {
          type: "soil-ask",
          soilData: soilSummary,
          question: askQuestion,
          lang: language,
        },
      });
      if (error) throw error;
      setAskAnswer(data?.result || "");
    } catch (err: any) {
      toast({ title: t("errorOccurred"), description: err.message, variant: "destructive" });
    }
    setAskLoading(false);
  };

  const statusIcon = (s: SoilParam["status"]) => {
    if (s === "low") return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (s === "high") return <AlertTriangle className="h-4 w-4 text-accent-foreground" />;
    return <CheckCircle className="h-4 w-4 text-primary" />;
  };

  const statusColor = (s: SoilParam["status"]) => {
    if (s === "low") return "bg-destructive/10 text-destructive";
    if (s === "high") return "bg-accent/20 text-accent-foreground";
    return "bg-primary/10 text-primary";
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <PageHeader title={t("soilHealthCardAnalysis")} icon={<FileText className="h-6 w-6 text-primary" />} />

      {/* Upload Section */}
      <div className="agri-card mb-4">
        <h3 className="font-display font-bold text-foreground mb-2">{t("uploadSoilCard")}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t("uploadSoilCardDesc")}</p>
        <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFileUpload} />
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => fileInputRef.current?.click()}
          className="agri-btn-primary w-full flex items-center justify-center gap-2"
          disabled={extracting}
        >
          {extracting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          {extracting ? t("extracting") : t("uploadSoilCard")}
        </motion.button>

        {/* Toggle manual entry */}
        <button
          onClick={() => setShowManual(!showManual)}
          className="mt-3 flex items-center gap-1 text-sm text-primary font-display font-semibold"
        >
          {showManual ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {t("manualEntry")}
        </button>

        <AnimatePresence>
          {showManual && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div><label className="agri-label">{t("nitrogen")}</label><input type="number" value={manualN} onChange={(e) => setManualN(e.target.value)} className="agri-input" placeholder="kg/ha" /></div>
                <div><label className="agri-label">{t("phosphorus")}</label><input type="number" value={manualP} onChange={(e) => setManualP(e.target.value)} className="agri-input" placeholder="kg/ha" /></div>
                <div><label className="agri-label">{t("potassium")}</label><input type="number" value={manualK} onChange={(e) => setManualK(e.target.value)} className="agri-input" placeholder="kg/ha" /></div>
                <div><label className="agri-label">{t("ph")}</label><input type="number" step="0.1" value={manualPh} onChange={(e) => setManualPh(e.target.value)} className="agri-input" placeholder="0-14" /></div>
                <div><label className="agri-label">{t("organicCarbon")}</label><input type="number" step="0.01" value={manualOC} onChange={(e) => setManualOC(e.target.value)} className="agri-input" placeholder="%" /></div>
                <div><label className="agri-label">{t("electricalConductivity")}</label><input type="number" step="0.01" value={manualEC} onChange={(e) => setManualEC(e.target.value)} className="agri-input" placeholder="dS/m" /></div>
                <div><label className="agri-label">{t("zinc")}</label><input type="number" step="0.01" value={manualZn} onChange={(e) => setManualZn(e.target.value)} className="agri-input" placeholder="ppm" /></div>
                <div><label className="agri-label">{t("iron")}</label><input type="number" step="0.01" value={manualFe} onChange={(e) => setManualFe(e.target.value)} className="agri-input" placeholder="ppm" /></div>
                <div><label className="agri-label">{t("manganese")}</label><input type="number" step="0.01" value={manualMn} onChange={(e) => setManualMn(e.target.value)} className="agri-input" placeholder="ppm" /></div>
                <div><label className="agri-label">{t("copper")}</label><input type="number" step="0.01" value={manualCu} onChange={(e) => setManualCu(e.target.value)} className="agri-input" placeholder="ppm" /></div>
              </div>
              <div className="mt-3">
                <label className="agri-label">{t("soilType")}</label>
                <input type="text" value={manualSoilType} onChange={(e) => setManualSoilType(e.target.value)} className="agri-input" placeholder="e.g. Clay, Loam, Sandy" />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleManualSubmit} className="agri-btn-primary w-full mt-3">
                {t("analyze")}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Extracted Data Table */}
      <AnimatePresence>
        {soilParams.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="agri-card">
              <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                {t("extractedData")}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 font-display font-bold text-muted-foreground">{t("parameter")}</th>
                      <th className="text-center py-2 font-display font-bold text-muted-foreground">{t("value")}</th>
                      <th className="text-center py-2 font-display font-bold text-muted-foreground">{t("idealRange")}</th>
                      <th className="text-center py-2 font-display font-bold text-muted-foreground">{t("status")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soilParams.map((p, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="py-2 font-display font-semibold">{p.name}</td>
                        <td className="py-2 text-center font-bold">{p.value}</td>
                        <td className="py-2 text-center text-muted-foreground">{p.idealRange}</td>
                        <td className="py-2 text-center">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${statusColor(p.status)}`}>
                            {statusIcon(p.status)}
                            {t(p.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Get Recommendations */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={getRecommendations}
                disabled={loadingRec}
                className="agri-btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                {loadingRec ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sprout className="h-5 w-5" />}
                {loadingRec ? t("analyzing") : t("getRecommendations")}
              </motion.button>
            </div>

            {/* Recommendations */}
            {recommendations && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="agri-card">
                <h3 className="font-display font-bold mb-3 flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-primary" />
                  {t("recommendations")}
                </h3>
                <div className="prose prose-sm max-w-none text-foreground">
                  <ReactMarkdown>{recommendations}</ReactMarkdown>
                </div>
              </motion.div>
            )}

            {/* Ask AI Section */}
            <div className="agri-card">
              <button onClick={() => setShowAskSection(!showAskSection)} className="w-full flex items-center justify-between">
                <h3 className="font-display font-bold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {t("askAISoil")}
                </h3>
                {showAskSection ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>
              <AnimatePresence>
                {showAskSection && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={askQuestion}
                        onChange={(e) => setAskQuestion(e.target.value)}
                        placeholder={t("askAISoilPlaceholder")}
                        className="agri-input flex-1"
                        onKeyDown={(e) => e.key === "Enter" && askAI()}
                      />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={askAI} disabled={askLoading} className="agri-btn-primary px-4">
                        {askLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </motion.button>
                    </div>
                    {askAnswer && (
                      <div className="mt-3 rounded-xl bg-muted p-4 prose prose-sm max-w-none text-foreground">
                        <ReactMarkdown>{askAnswer}</ReactMarkdown>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AppFooter />
    </div>
  );
}
