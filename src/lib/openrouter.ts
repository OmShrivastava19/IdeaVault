
export interface AIChoice {
  message: {
    role: string;
    content: string;
  };
}

export interface AIResponse {
  choices: AIChoice[];
}

export async function generateAIResponse(prompt: string, jsonResponse: boolean = true): Promise<string> {
  try {
    const response = await fetch('/api/ai/completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || errorData.error || 'AI generation failed';
      throw new Error(errorMsg);
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
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    console.error('Unexpected AI Response structure:', data);
    throw new Error('AI response structure invalid: missing choices');
  } catch (error: any) {
    console.error('OpenRouter Client Error:', error);
    throw error;
  }
}
