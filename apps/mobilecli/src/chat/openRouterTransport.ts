import { AsyncQueue } from './asyncQueue';
import type { ChatTransport } from './singleModelChat';

const OPENROUTER_CHAT_COMPLETIONS_URL = 'https://openrouter.ai/api/v1/chat/completions';

export function createOpenRouterTransport(apiKey: string, model: string): ChatTransport {
  return async (prompt: string) => {
    const queue = new AsyncQueue<string>();
    let buffer = '';
    let processedLength = 0;

    const xhr = new XMLHttpRequest();
    xhr.open('POST', OPENROUTER_CHAT_COMPLETIONS_URL);
    xhr.setRequestHeader('Authorization', `Bearer ${apiKey}`);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = () => {
      const newText = xhr.responseText.slice(processedLength);
      processedLength = xhr.responseText.length;
      buffer += newText;

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) {
          continue;
        }

        const data = trimmed.slice('data:'.length).trim();
        if (data === '[DONE]') {
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            queue.push(delta);
          }
        } catch {
          // Malformed SSE payload for this line; skip it and keep streaming.
        }
      }
    };

    xhr.onerror = () => {
      queue.fail(new Error('OpenRouter request failed'));
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        queue.fail(new Error(`OpenRouter error ${xhr.status}: ${xhr.responseText}`));
      } else {
        queue.finish();
      }
    };

    xhr.send(
      JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      }),
    );

    return queue;
  };
}
