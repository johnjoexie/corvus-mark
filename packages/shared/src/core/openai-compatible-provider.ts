import type { AiRequestEnvelope, AiResponseEnvelope } from '../schema/ai-envelope'
import { parseAiResponse } from '../schema/ai-envelope'
import { guardOutbound } from '../schema/privacy'
import type { LlmProviderPort } from '../ports'

export interface OpenAiCompatibleProviderOptions {
  baseUrl: string
  model: string
  apiKey: string
  fetch?: typeof fetch
}

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>
}

export const deepSeekPreset = {
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
} as const

export class OpenAiCompatibleProvider implements LlmProviderPort {
  private readonly fetchFn: typeof fetch

  constructor(private readonly options: OpenAiCompatibleProviderOptions) {
    this.fetchFn = options.fetch ?? fetch
  }

  async classifyBookmarks(envelope: AiRequestEnvelope): Promise<AiResponseEnvelope> {
    guardOutbound(envelope)

    const response = await this.fetchFn(`${this.options.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.options.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Return only JSON matching the AiResponseEnvelope schema. Never output URLs or secrets.',
          },
          { role: 'user', content: JSON.stringify(envelope) },
        ],
        max_tokens: envelope.budget.maxOutputTokens,
      }),
    })

    if (!response.ok) {
      throw new Error(`provider_error:${response.status}`)
    }

    const json = (await response.json()) as ChatCompletionResponse
    const content = json.choices?.[0]?.message?.content
    if (!content) throw new Error('provider_error:empty_content')
    return parseAiResponse(JSON.parse(content))
  }
}
