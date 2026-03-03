import { useLanguage } from "@/contexts/LanguageContext";
import { Language } from "@/lib/i18n";
import { motion } from "framer-motion";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिन्दी", flag: "🇮🇳" },
  { code: "pa", label: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
];

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex gap-2">
      {languages.map((l) => (
        <motion.button
          key={l.code}
          whileTap={{ scale: 0.95 }}
          onClick={() => setLang(l.code)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-display font-semibold transition-colors ${
            lang === l.code
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-primary/10"
          }`}
        >
          <span>{l.flag}</span>
          <span>{l.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
