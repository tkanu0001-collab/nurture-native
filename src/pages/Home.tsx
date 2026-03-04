import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import AppFooter from "@/components/AppFooter";
import { motion } from "framer-motion";
import {
  Leaf, Upload, FileInput, Bug, History, CloudSun, Mic, LogOut,
} from "lucide-react";

const menuItems = [
  { key: "uploadSoilReport", icon: Upload, path: "/soil-health-card", color: "bg-primary/10 text-primary" },
  { key: "enterSoilData", icon: FileInput, path: "/soil-data", color: "bg-agri-earth-light text-agri-earth" },
  { key: "pestDiseaseScan", icon: Bug, path: "/pest-scan", color: "bg-destructive/10 text-destructive" },
  { key: "soilHistory", icon: History, path: "/soil-history", color: "bg-agri-sky-light text-agri-sky" },
  { key: "weather", icon: CloudSun, path: "/weather", color: "bg-accent/10 text-accent-foreground" },
  { key: "voiceAssistant", icon: Mic, path: "/voice", color: "bg-secondary text-secondary-foreground" },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem("agriguide-user");
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="agri-gradient-bg px-4 pb-8 pt-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-7 w-7 text-primary-foreground" />
            <h1 className="text-xl font-display font-black text-primary-foreground">{t("appName")}</h1>
          </div>
          <button onClick={handleLogout} className="text-primary-foreground/80 hover:text-primary-foreground">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
        <p className="text-primary-foreground/80 text-sm font-display">{t("tagline")}</p>
        <div className="mt-4">
          <LanguageSelector />
        </div>
      </div>

      {/* Menu Grid */}
      <div className="flex-1 px-4 py-6">
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(item.path)}
              className="agri-card flex flex-col items-center gap-3 py-6 text-center"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${item.color}`}>
                <item.icon className="h-7 w-7" />
              </div>
              <span className="text-sm font-display font-bold text-foreground leading-tight">
                {t(item.key)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <AppFooter />
    </div>
  );
}
