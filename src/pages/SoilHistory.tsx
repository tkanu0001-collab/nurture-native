import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";
import AppFooter from "@/components/AppFooter";
import SoilHealthChart from "@/components/SoilHealthChart";
import { getSoilHistory, getSoilTrend } from "@/lib/soilEngine";
import { motion } from "framer-motion";
import { History, TrendingUp, Minus, TrendingDown } from "lucide-react";

export default function SoilHistoryPage() {
  const { t } = useLanguage();
  const records = getSoilHistory();
  const trend = getSoilTrend();

  const trendIcon = trend === "improving" ? <TrendingUp className="h-5 w-5 text-primary" /> :
    trend === "degrading" ? <TrendingDown className="h-5 w-5 text-destructive" /> :
    <Minus className="h-5 w-5 text-accent" />;

  const trendColor = trend === "improving" ? "text-primary" : trend === "degrading" ? "text-destructive" : "text-accent-foreground";

  return (
    <div className="min-h-screen bg-background p-4">
      <PageHeader title={t("soilHistory")} icon={<History className="h-6 w-6 text-agri-sky" />} />

      {/* Trend */}
      <div className="agri-card flex items-center gap-4 mb-6">
        {trendIcon}
        <div>
          <p className="text-xs text-muted-foreground font-display font-semibold">{t("soilStability")}</p>
          <p className={`text-lg font-display font-black ${trendColor}`}>{t(trend)}</p>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center text-muted-foreground py-20 font-display">
          No records yet. Analyze your soil first!
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="agri-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground font-display">
                  {new Date(r.date).toLocaleDateString()}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-display font-bold text-secondary-foreground capitalize">
                  {r.data.crop}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <SoilHealthChart score={r.analysis.healthScore} label="" size={70} />
                <div className="flex-1 grid grid-cols-2 gap-1 text-xs">
                  <span className="text-muted-foreground">N: <b className="text-foreground">{r.data.nitrogen}</b></span>
                  <span className="text-muted-foreground">P: <b className="text-foreground">{r.data.phosphorus}</b></span>
                  <span className="text-muted-foreground">K: <b className="text-foreground">{r.data.potassium}</b></span>
                  <span className="text-muted-foreground">pH: <b className="text-foreground">{r.data.ph}</b></span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AppFooter />
    </div>
  );
}
