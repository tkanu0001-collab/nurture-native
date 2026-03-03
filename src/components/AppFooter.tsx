import { useLanguage } from "@/contexts/LanguageContext";
import { Leaf } from "lucide-react";

export default function AppFooter() {
  const { t } = useLanguage();
  return (
    <footer className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground font-display">
      <Leaf className="h-3.5 w-3.5 text-primary" />
      <span>{t("poweredBy")}</span>
    </footer>
  );
}
