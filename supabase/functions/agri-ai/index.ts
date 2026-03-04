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

    const { type, messages, image, location, lang, soilData, question } = await req.json();

    const langName = lang === "hi" ? "Hindi" : lang === "pa" ? "Punjabi" : "English";

    let aiMessages: { role: string; content: any }[] = [];
    let useToolCalling = false;
    let tools: any[] | undefined;
    let toolChoice: any | undefined;

    if (type === "soil-card-extract") {
      useToolCalling = true;
      tools = [{
        type: "function",
        function: {
          name: "extract_soil_params",
          description: "Extract soil health parameters from a soil test report image/document",
          parameters: {
            type: "object",
            properties: {
              params: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Parameter name" },
                    value: { type: "string", description: "Extracted value with unit" },
                    idealRange: { type: "string", description: "Ideal range for agriculture e.g. 240-480" },
                    status: { type: "string", enum: ["low", "medium", "high"], description: "Whether value is low, medium/normal, or high" }
                  },
                  required: ["name", "value", "idealRange", "status"],
                  additionalProperties: false
                }
              }
            },
            required: ["params"],
            additionalProperties: false
          }
        }
      }];
      toolChoice = { type: "function", function: { name: "extract_soil_params" } };
      aiMessages = [
        {
          role: "system",
          content: `You are an expert soil scientist. Extract ALL soil health parameters from the uploaded soil test report. Include Nitrogen, Phosphorus, Potassium, pH, Organic Carbon, Electrical Conductivity, and any micronutrients (Zn, Fe, Mn, Cu) if visible. Also identify soil type if mentioned. Respond with parameter names in ${langName}. Use standard agricultural ideal ranges for Indian soils.`,
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all soil parameters from this soil health card:" },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ];
    } else if (type === "soil-recommendations") {
      aiMessages = [
        {
          role: "system",
          content: `You are an expert agricultural soil advisor for Indian farmers. Respond in ${langName}. Based on the soil data provided, give comprehensive recommendations:
## Suitable Crops
List 5-8 crops that would grow well in this soil.
## Fertilizer Recommendation
Specific fertilizers with quantities per acre.
## Soil Improvement Suggestions
Practical steps to improve soil health.
## Nutrient Deficiency Solutions
Address any deficiencies found.
## Organic Alternatives
Suggest organic methods for soil improvement.
Be specific, practical, and use simple farmer-friendly language.`,
        },
        { role: "user", content: `My soil test results:\n${soilData}` },
      ];
    } else if (type === "soil-ask") {
      aiMessages = [
        {
          role: "system",
          content: `You are AgriGuide AI, an expert soil health advisor for Indian farmers. Respond in ${langName}. The farmer has the following soil data:\n${soilData}\n\nAnswer their question based on this soil data. Be specific, practical, and use simple language. Provide actionable advice.`,
        },
        { role: "user", content: question },
      ];
    } else if (type === "pest-scan") {
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

    const body: any = {
      model: "google/gemini-3-flash-preview",
      messages: aiMessages,
    };
    if (useToolCalling && tools) {
      body.tools = tools;
      body.tool_choice = toolChoice;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

    // Handle tool calling response for soil-card-extract
    if (useToolCalling) {
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        const parsed = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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
