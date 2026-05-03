import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateIdea() {
  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ parts: [{ text: "Generate a unique, innovative, and market-ready project idea. The idea should be detailed and include a title, a short catchy description, a category, and comprehensive details like tech stack, key features, and resources needed." }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING },
          tagline: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          techStack: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          features: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          resources: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          estimatedComplexity: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
          estimatedDuration: { type: Type.STRING },
          price: { type: Type.NUMBER, description: "A price in INR between 49 and 199 based on complexity and innovation." }
        },
        required: ["id", "title", "tagline", "description", "category", "techStack", "features", "resources", "price"]
      }
    }
  });

  const idea = JSON.parse(result.text || "{}");
  return {
    ...idea,
    status: "public",
    votes: 0,
    createdAt: new Date().toISOString()
  };
}
