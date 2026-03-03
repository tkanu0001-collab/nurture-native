import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { type, messages, image, location, lang } = await req.json();

    const langName = lang === "hi" ? "Hindi" : lang === "pa" ? "Punjabi" : "English";

    let aiMessages: { role: string; content: any }[] = [];

    if (type === "pest-scan") {
      aiMessages = [
        {
          role: "system",
          content: `You are an expert agricultural plant pathologist. Analyze the plant image and respond in ${langName}. Provide:
## Disease Name
## Confidence Level (%)
## Symptoms Observed
## Treatment
- Chemical treatment with dosage
## Organic Alternative
## Prevention Tips
Be specific and practical for Indian farmers.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this plant image for diseases or pests:" },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ];
    } else if (type === "weather") {
      aiMessages = [
        {
          role: "system",
          content: `You are an agricultural weather advisor for Indian farmers. Respond in ${langName}. Provide a 5-day weather forecast for the given location with:
## Current Weather (estimated)
- Temperature, Humidity, Wind
## 5-Day Forecast
## Agricultural Advisory
- Best days for sowing/harvesting
- Irrigation recommendations
- Pest risk based on weather
## Crop-Specific Tips
Be practical and helpful. Use approximate data based on typical weather patterns for the region and season (current month: ${new Date().toLocaleString("en", { month: "long" })}).`,
        },
        { role: "user", content: `Weather forecast for: ${location}` },
      ];
    } else if (type === "chat") {
      aiMessages = [
        {
          role: "system",
          content: `You are AgriGuide AI, an expert agricultural assistant for Indian farmers. Respond in ${langName}. You help with:
- Soil health and fertilizer recommendations
- Crop selection and management
- Pest and disease identification
- Weather-based farming advice
- Organic farming techniques
- Government schemes for farmers
- Market prices and selling strategies
Be concise, practical, and use simple language that farmers can understand. Use bullet points and emojis for clarity.`,
        },
        ...messages,
      ];
    } else {
      throw new Error("Invalid request type");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "No response generated.";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("agri-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
