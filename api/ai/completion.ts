import type { VercelRequest, VercelResponse } from "@vercel/node";

// Free models prioritized by availability and performance
const FREE_MODELS = [
  "openrouter/free",
  "meta-llama/llama-2-7b-chat:free",
  "mistralai/mistral-7b-instruct:free",
  "nousresearch/nous-hermes-2-mixtral-8x7b-sft:free",
];

function isValidAIMessage(message: unknown): message is { role: string; content: string } {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as { role?: unknown; content?: unknown };
  return typeof candidate.role === "string" && typeof candidate.content === "string" && candidate.content.trim().length > 0;
}

async function tryModel(
  model: string,
  messages: Array<{ role: string; content: string }>,
  response_format: any,
  apiKey: string
): Promise<{ success: boolean; data?: any; error?: any; status?: number }> {
  try {
    const requestBody: Record<string, unknown> = {
      model,
      messages,
    };

    if (response_format) {
      requestBody.response_format = response_format;
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://ideavault.ai",
        "X-Title": "IdeaVault",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const textResponse = await response.text();
    let data;

    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      return { success: false, error: "Invalid JSON response", status: 502 };
    }

    if (!response.ok) {
      // 429 = rate limit, try next model
      // 401 = auth error, don't retry
      if (response.status === 401) {
        return { success: false, error: "Authentication failed", status: 401 };
      }
      return { success: false, error: data, status: response.status };
    }

    if (data.error) {
      return { success: false, error: data.error };
    }

    if (data.choices && data.choices.length > 0) {
      return { success: true, data };
    }

    return { success: false, error: "Invalid response structure" };
  } catch (error) {
    return { success: false, error };
  }
}

export default async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { messages, response_format } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY?.trim() || "";

  if (!apiKey) {
    return res.status(500).json({
      code: "OPENROUTER_API_KEY_MISSING",
      error: "OpenRouter API key is not configured on the server.",
      userMessage: "AI generation is not configured yet. Ask the developer to set OPENROUTER_API_KEY.",
    });
  }

  if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isValidAIMessage)) {
    return res.status(400).json({
      code: "INVALID_AI_REQUEST",
      error: "Invalid AI request body. Expected a non-empty messages array with role/content strings.",
      userMessage: "The AI request could not be prepared. Please refresh and try again.",
    });
  }

  let lastError: any = null;
  let lastStatus = 500;

  // Try each model in fallback order
  for (const model of FREE_MODELS) {
    console.log(`Attempting AI generation with model: ${model}`);
    const result = await tryModel(model, messages, response_format, apiKey);

    if (result.success && result.data) {
      console.log(`Success with model: ${model}`);
      return res.json(result.data);
    }

    lastError = result.error;
    lastStatus = result.status || 500;

    // Don't retry on auth errors
    if (lastStatus === 401) {
      break;
    }

    // Small delay before trying next model
    if (model !== FREE_MODELS[FREE_MODELS.length - 1]) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // All models failed
  console.error("All free models exhausted. Last error:", lastError);

  if (lastStatus === 401) {
    return res.status(401).json({
      code: "OPENROUTER_AUTH_FAILED",
      error: "Authentication failed",
      userMessage: "The AI provider rejected the configured API key. Update OPENROUTER_API_KEY.",
    });
  }

  if (lastStatus === 429) {
    return res.status(429).json({
      code: "OPENROUTER_RATE_LIMITED",
      error: "All free models are currently rate limited",
      userMessage: "The AI service is temporarily overwhelmed. Please wait a few minutes and try again.",
    });
  }

  return res.status(502).json({
    code: "OPENROUTER_ALL_FAILED",
    error: "All free model attempts failed",
    userMessage: "The AI service is unavailable. Please try again in a moment.",
    details: typeof lastError === "string" ? lastError : lastError?.message || "Unknown error",
  });
};
