
export interface AIChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface AIResponse {
  choices: AIChoice[];
}

interface AIErrorPayload {
  code?: string;
  error?: {
    code?: string;
    message?: string;
  } | string;
  userMessage?: string;
}

export class AIRequestError extends Error {
  status: number;
  code?: string;
  userMessage: string;

  constructor(message: string, options: { status: number; code?: string; userMessage: string }) {
    super(message);
    this.name = 'AIRequestError';
    this.status = options.status;
    this.code = options.code;
    this.userMessage = options.userMessage;
  }
}

function getServerErrorMessage(errorData: AIErrorPayload | null): string {
  if (!errorData) {
    return 'AI generation failed';
  }

  if (typeof errorData.error === 'string') {
    return errorData.error;
  }

  if (typeof errorData.error?.message === 'string') {
    return errorData.error.message;
  }

  return 'AI generation failed';
}

function getServerErrorCode(errorData: AIErrorPayload | null): string | undefined {
  if (!errorData) {
    return undefined;
  }

  if (typeof errorData.error === 'object' && typeof errorData.error?.code === 'string') {
    return errorData.error.code;
  }

  return errorData.code;
}

export function getAIErrorMessage(error: unknown, fallbackMessage = 'AI generation failed. Please try again later.'): string {
  if (error instanceof AIRequestError) {
    return error.userMessage || error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage;
  }

  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  return fallbackMessage;
}

export function isAIQuotaError(error: unknown): boolean {
  const message = error instanceof AIRequestError
    ? `${error.code || ''} ${error.message} ${error.userMessage}`
    : error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  // Only treat RESOURCE_EXHAUSTED as quota error (not temporary 429 rate limits)
  return message.includes('RESOURCE_EXHAUSTED') || message.includes('spending cap') || message.toLowerCase().includes('quota reached');
}

export async function generateAIResponse(prompt: string, jsonResponse: boolean = true, retryCount = 0): Promise<string> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second

  try {
    const response = await fetch('/api/ai/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ],
        response_format: jsonResponse ? { type: 'json_object' } : undefined,
      }),
    });

    if (!response.ok) {
      const rawError = await response.text();
      let errorData: AIErrorPayload | null = null;

      if (rawError) {
        try {
          errorData = JSON.parse(rawError) as AIErrorPayload;
        } catch {
          errorData = null;
        }
      }

      const errorMsg = getServerErrorMessage(errorData);
      
      // Retry on 429 (rate limit) with exponential backoff
      if (response.status === 429 && retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount); // 1s, 2s, 4s
        console.warn(`Rate limited. Retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateAIResponse(prompt, jsonResponse, retryCount + 1);
      }

      const userMessage = errorData?.userMessage || (response.status >= 500
        ? 'The AI service is temporarily unavailable. Please try again in a moment.'
        : errorMsg);

      throw new AIRequestError(errorMsg, {
        status: response.status,
        code: getServerErrorCode(errorData),
        userMessage,
      });
    }

    const data: any = await response.json();
    
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      const content = data.choices[0].message.content;
      if (jsonResponse) {
        // Try to extract JSON if it's wrapped in markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
        return jsonMatch[1].trim();
      }
      return content;
    }

    if (data.error) {
      throw new AIRequestError(
        data.error.message || JSON.stringify(data.error),
        {
          status: 502,
          code: data.error.code,
          userMessage: 'The AI provider returned an error. Please try again.',
        }
      );
    }

    console.error('Unexpected AI Response structure:', data);
    throw new AIRequestError('AI response structure invalid: missing choices', {
      status: 502,
      code: 'INVALID_AI_RESPONSE',
      userMessage: 'The AI provider returned an unexpected response. Please try again.',
    });
  } catch (error: any) {
    console.error('OpenRouter Client Error:', error);
    throw error;
  }
}
