import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import PageHeader from "@/components/PageHeader";
import AppFooter from "@/components/AppFooter";
import { motion } from "framer-motion";
import { Mic, MicOff, Send, Loader2, Bot, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function VoicePage() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: t("errorOccurred"), description: "Speech recognition not supported. Please use Chrome.", variant: "destructive" });
      return;
    }
    const recognition = new SpeechRecognition();
    const langMap: Record<string, string> = { hi: "hi-IN", pa: "pa-IN", en: "en-IN" };
    recognition.lang = langMap[lang] || "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setListening(false);
        if (transcript.trim()) {
          setTimeout(() => sendMessage(transcript.trim()), 300);
        }
      }
    };
    recognition.onerror = (e: any) => {
      console.error("Speech error:", e.error);
      setListening(false);
    };
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    const userMsg: Message = { role: "user", content: msg };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("agri-ai", {
        body: {
          type: "chat",
          messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
          lang,
        },
      });
      if (error) throw error;
      setMessages([...newMsgs, { role: "assistant", content: data?.result || "No response." }]);
    } catch (err: any) {
      toast({ title: t("errorOccurred"), description: err.message, variant: "destructive" });
      setMessages([...newMsgs, { role: "assistant", content: t("errorOccurred") }]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="p-4 pb-0">
        <PageHeader title={t("voiceAssistant")} icon={<Mic className="h-6 w-6 text-primary" />} />
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-20 font-display text-sm">
            {t("askFarmer")}
          </div>
        )}
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-4 w-4 text-primary" />
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "agri-card rounded-bl-md"
            }`}>
              {m.role === "assistant" ? (
                <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : m.content}
            </div>
            {m.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <User className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm font-display">{t("thinking")}</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={listening ? stopListening : startListening}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
              listening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-secondary text-secondary-foreground"
            }`}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="agri-input flex-1"
            placeholder={t("askFarmer")}
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </motion.button>
        </div>
        {listening && (
          <p className="text-center text-xs text-destructive font-display mt-2 animate-pulse">
            🎙️ {t("listening")}
          </p>
        )}
      </div>

      <AppFooter />
    </div>
  );
}
