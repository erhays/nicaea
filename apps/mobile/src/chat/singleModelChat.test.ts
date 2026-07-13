import test from 'node:test';
import assert from 'node:assert/strict';
import { createSingleModelChatController } from './singleModelChat';

async function* makeChunks(chunks: string[]) {
  for (const chunk of chunks) {
    yield chunk;
  }
}

test('creates a user message and streams an assistant reply', async () => {
  const controller = createSingleModelChatController({
    modelName: 'gpt-4.1-mini',
    transport: async (_prompt: string) => makeChunks(['Hello', ' world']),
  });

  let snapshots: ReturnType<typeof controller.getSnapshot>[] = [];
  controller.subscribe((state) => {
    snapshots.push(state);
  });

  await controller.submitPrompt('What is Nicaea?');

  const latest = controller.getSnapshot();
  assert.equal(latest.messages.length, 2);
  assert.equal(latest.messages[0].role, 'user');
  assert.equal(latest.messages[0].content, 'What is Nicaea?');
  assert.equal(latest.messages[1].role, 'assistant');
  assert.equal(latest.messages[1].content, 'Hello world');
  assert.equal(latest.status, 'complete');
});
