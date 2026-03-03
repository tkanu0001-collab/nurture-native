import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { motion } from "framer-motion";
import { Leaf, Phone, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple local auth — stores in localStorage
    localStorage.setItem("agriguide-user", JSON.stringify({ phone }));
    navigate("/home");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl agri-gradient-bg mb-4 shadow-lg">
            <Leaf className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-black agri-gradient-text">{t("appName")}</h1>
          <p className="text-sm text-muted-foreground font-display mt-1 text-center">{t("tagline")}</p>
        </div>

        {/* Language */}
        <div className="flex justify-center mb-6">
          <LanguageSelector />
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="agri-label">{t("phone")}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="agri-input pl-11"
                placeholder="+91 98765 43210"
                required
              />
            </div>
          </div>
          <div>
            <label className="agri-label">{t("password")}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="agri-input pl-11 pr-11"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="agri-btn-primary w-full mt-2"
          >
            {t("login")}
          </motion.button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t("noAccount")}{" "}
          <button className="text-primary font-semibold">{t("signUp")}</button>
        </p>
      </motion.div>
    </div>
  );
}
