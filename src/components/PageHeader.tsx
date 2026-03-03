import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, icon }: PageHeaderProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 mb-6"
    >
      <button
        onClick={() => navigate(-1)}
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      {icon}
      <h1 className="text-xl font-display font-bold text-foreground">{title}</h1>
    </motion.div>
  );
}
