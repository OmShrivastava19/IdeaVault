import type { VercelRequest, VercelResponse } from "@vercel/node";

function isValidAIMessage(message: unknown): message is { role: string; content: string } {
  if (!message || typeof message !== "object") {
    return false;
  }

  const candidate = message as { role?: unknown; content?: unknown };
  return typeof candidate.role === "string" && typeof candidate.content === "string" && candidate.content.trim().length > 0;
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

  try {
    const requestBody: Record<string, unknown> = {
      model: "openrouter/free",
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    const textResponse = await response.text();
    let data;
    try {
      data = JSON.parse(textResponse);
    } catch (e) {
      console.error("OpenRouter Non-JSON Response:", textResponse);
      return res.status(502).json({
        code: "OPENROUTER_INVALID_RESPONSE",
        error: "Invalid JSON response from OpenRouter.",
        userMessage: "The AI provider returned an unexpected response. Please try again in a moment.",
        details: textResponse.substring(0, 200)
      });
    }
    
    if (!response.ok) {
      console.error("OpenRouter API Error Response:", data);
      return res.status(response.status).json({
        code: data?.error?.code || data?.code || "OPENROUTER_REQUEST_FAILED",
        error: data?.error?.message || data?.error || "OpenRouter request failed.",
        userMessage: response.status === 401
          ? "The AI provider rejected the configured API key. Update OPENROUTER_API_KEY."
          : response.status === 429
            ? "The AI provider rate limit has been reached. Please try again later."
            : "The AI provider could not complete the request. Please try again.",
        providerError: data,
      });
    }

    if (data.error) {
      console.error("OpenRouter Data Error:", data.error);
      return res.status(502).json({
        code: data?.error?.code || "OPENROUTER_DATA_ERROR",
        error: data?.error?.message || "OpenRouter returned an error payload.",
        userMessage: "The AI provider returned an error. Please try again.",
        providerError: data,
      });
    }

    return res.json(data);
  } catch (error) {
    console.error("OpenRouter Proxy Error:", error);
    return res.status(500).json({
      code: "OPENROUTER_PROXY_ERROR",
      error: "AI generation failed at the server proxy.",
      userMessage: "The AI request could not reach the provider. Please check the server logs and try again.",
    });
  }
};
