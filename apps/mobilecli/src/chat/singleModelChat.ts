export type MessageRole = 'user' | 'assistant';

export type ChatMessage = {
  role: MessageRole;
  content: string;
};

export type ChatStatus = 'idle' | 'streaming' | 'complete' | 'error';

export type ChatSnapshot = {
  status: ChatStatus;
  messages: ChatMessage[];
  error?: string;
};

export type ChatTransport = (prompt: string) => Promise<AsyncIterable<string>>;

export type SingleModelChatController = {
  submitPrompt: (prompt: string) => Promise<void>;
  getSnapshot: () => ChatSnapshot;
  subscribe: (listener: (state: ChatSnapshot) => void) => () => void;
};

export function createSingleModelChatController(options: {
  modelName: string;
  transport: ChatTransport;
}): SingleModelChatController {
  let state: ChatSnapshot = {
    status: 'idle',
    messages: [],
  };

  const listeners = new Set<(value: ChatSnapshot) => void>();

  const emit = () => {
    for (const listener of listeners) {
      listener(state);
    }
  };

  const submitPrompt = async (prompt: string) => {
    state = {
      status: 'streaming',
      messages: [...state.messages, { role: 'user', content: prompt }],
    };
    emit();

    try {
      const chunks = await options.transport(prompt);
      let content = '';

      for await (const chunk of chunks) {
        content += chunk;
      }

      state = {
        status: 'complete',
        messages: [
          ...state.messages,
          { role: 'assistant', content },
        ],
      };
    } catch (error) {
      state = {
        status: 'error',
        messages: state.messages,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    emit();
  };

  return {
    submitPrompt,
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
