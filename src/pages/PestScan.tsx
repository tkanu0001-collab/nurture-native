import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";
import AppFooter from "@/components/AppFooter";
import { motion } from "framer-motion";
import { Bug, Upload, Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

export default function PestScanPage() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.onerror = () => toast({ title: t("uploadError"), variant: "destructive" });
    reader.readAsDataURL(file);
    setResult(null);
  };

  const handleScan = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("agri-ai", {
        body: { type: "pest-scan", image: preview, lang },
      });
      if (error) throw error;
      setResult(data?.result || "No result returned.");
    } catch (err: any) {
      toast({ title: t("errorOccurred"), description: err.message, variant: "destructive" });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <PageHeader title={t("pestDiseaseScan")} icon={<Bug className="h-6 w-6 text-destructive" />} />

      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      {!preview ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="agri-card flex flex-col items-center gap-4 py-12"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <Camera className="h-10 w-10 text-destructive" />
          </div>
          <p className="text-muted-foreground font-display text-center text-sm">
            {t("takePhoto")}
          </p>
          <button onClick={() => fileRef.current?.click()} className="agri-btn-primary">
            <Upload className="h-5 w-5" />
            {t("uploadImage")}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <div className="agri-card p-2">
            <img src={preview} alt="Plant" className="w-full rounded-xl object-cover max-h-64" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setPreview(null); setResult(null); }} className="flex-1 agri-btn bg-secondary text-secondary-foreground">
              {t("retake")}
            </button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleScan}
              disabled={loading}
              className="flex-1 agri-btn-primary"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bug className="h-5 w-5" />}
              {t("scanNow")}
            </motion.button>
          </div>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="agri-card prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground"
            >
              <ReactMarkdown>{result}</ReactMarkdown>
            </motion.div>
          )}
        </div>
      )}

      <AppFooter />
    </div>
  );
}
