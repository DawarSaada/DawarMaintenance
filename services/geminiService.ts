import { GoogleGenAI, Type } from "@google/genai";

let ai: any = null;

const getAi = () => {
  if (!ai) {
    const apiKey = process.env.API_KEY || '';
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export interface MaintenanceInsights {
  analysis: string;
  tips: string[];
}

export const getAiMaintenanceInsights = async (title: string, description: string): Promise<MaintenanceInsights | null> => {
  try {
    const aiInstance = getAi();
    const response = await aiInstance.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Maintenance Issue Title: ${title}\nDescription: ${description}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: {
              type: Type.STRING,
              description: "A one-sentence summary (max 12 words) of the core problem and risk.",
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Two short, technical action steps to fix the issue (max 10 words each).",
            },
          },
          required: ["analysis", "tips"],
        },
        systemInstruction: "You are an expert technical maintenance assistant for Dawar Saada. Analyze the issue and provide structured insights.",
      }
    });

    const result = JSON.parse(response.text);
    return result as MaintenanceInsights;
  } catch (error) {
    console.error("AI Insights fetch failed:", error);
    return null;
  }
};