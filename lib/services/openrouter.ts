/**
 * OpenRouter API wrapper for Claude models.
 * Compatible with the Anthropic SDK interface for minimal code changes.
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface CompletionParams {
  model: string;
  messages: Message[];
  max_tokens: number;
  temperature?: number;
}

interface CompletionResponse {
  content: Array<{ type: string; text: string }>;
  stop_reason: string;
}

export async function callClaude(params: CompletionParams): Promise<CompletionResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY environment variable');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://emerging-tech-nation.com',
      'X-Title': 'Emerging Tech Nation',
    },
    body: JSON.stringify({
      model: params.model,
      messages: params.messages,
      max_tokens: params.max_tokens,
      temperature: params.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid OpenRouter response: missing content');
  }

  return {
    content: [
      {
        type: 'text',
        text: data.choices[0].message.content,
      },
    ],
    stop_reason: 'end_turn',
  };
}
