import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";
import AppFooter from "@/components/AppFooter";
import { motion } from "framer-motion";
import { CloudSun, Thermometer, Droplets, Wind, CloudRain, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

export default function WeatherPage() {
  const { t, lang } = useLanguage();
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<string | null>(null);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) return;
    setLoading(true);
    setForecast(null);
    try {
      const { data, error } = await supabase.functions.invoke("agri-ai", {
        body: { type: "weather", location, lang },
      });
      if (error) throw error;
      setForecast(data?.result || "No forecast available.");
    } catch (err: any) {
      setForecast("Error: " + (err.message || "Failed to get forecast"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <PageHeader title={t("weather")} icon={<CloudSun className="h-6 w-6 text-agri-sky" />} />

      <form onSubmit={handleFetch} className="space-y-4 mb-6">
        <div>
          <label className="agri-label">{lang === "hi" ? "स्थान / जिला" : lang === "pa" ? "ਸਥਾਨ / ਜ਼ਿਲ੍ਹਾ" : "Location / District"}</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="agri-input"
            placeholder={lang === "hi" ? "जैसे: लुधियाना, पंजाब" : lang === "pa" ? "ਜਿਵੇਂ: ਲੁਧਿਆਣਾ, ਪੰਜਾਬ" : "e.g. Ludhiana, Punjab"}
            required
          />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading} className="agri-btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CloudSun className="h-5 w-5" />}
          {loading ? (lang === "hi" ? "लोड हो रहा है..." : lang === "pa" ? "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ..." : "Loading...") : t("weather")}
        </motion.button>
      </form>

      {forecast && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="agri-card prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground"
        >
          <ReactMarkdown>{forecast}</ReactMarkdown>
        </motion.div>
      )}

      <AppFooter />
    </div>
  );
}
