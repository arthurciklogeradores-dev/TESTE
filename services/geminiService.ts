
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function solveWithAI(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `O usuário quer ajuda com frações. Pergunta: "${prompt}". Explique o cálculo e dê o resultado final como fração simplificada.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING, description: "Passo a passo da explicação em português." },
            numerator: { type: Type.NUMBER, description: "Numerador do resultado final." },
            denominator: { type: Type.NUMBER, description: "Denominador do resultado final." },
            expression: { type: Type.STRING, description: "A expressão matemática formatada." }
          },
          required: ["explanation", "numerator", "denominator", "expression"]
        }
      }
    });

    const json = JSON.parse(response.text || "{}");
    return json;
  } catch (error) {
    console.error("AI Error:", error);
    throw error;
  }
}
