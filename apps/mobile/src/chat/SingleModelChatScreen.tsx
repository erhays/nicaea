import React, { useEffect, useMemo, useState } from 'react';
import { Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createSingleModelChatController, type ChatSnapshot } from './singleModelChat';

async function* fakeStream(text: string) {
  const chunks = text.split('');
  for (const chunk of chunks) {
    yield chunk;
  }
}

export function SingleModelChatScreen() {
  const [snapshot, setSnapshot] = useState<ChatSnapshot>({
    status: 'idle',
    messages: [],
  });
  const [draft, setDraft] = useState('');

  const controller = useMemo(
    () =>
      createSingleModelChatController({
        modelName: 'gpt-4.1-mini',
        transport: async (_prompt) => fakeStream('This is a placeholder assistant reply from the business logic layer.'),
      }),
    []
  );

  useEffect(() => {
    return controller.subscribe(setSnapshot);
  }, [controller]);

  const handleSend = async () => {
    if (!draft.trim()) {
      return;
    }

    await controller.submitPrompt(draft.trim());
    setDraft('');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>Single-model chat</Text>
        <Text style={styles.subtitle}>Business logic first: prompt, stream, and response.</Text>
      </View>

      <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
        {snapshot.messages.map((message, index) => {
          const isUser = message.role === 'user';
          return (
            <View
              key={`${message.role}-${index}`}
              style={{
                ...styles.bubble,
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                backgroundColor: isUser ? '#2563eb' : '#ffffff',
              }}
            >
              <Text style={isUser ? styles.bubbleTextUser : styles.bubbleText}>{message.content}</Text>
            </View>
          );
        })}
        {snapshot.status === 'streaming' && <Text style={styles.status}>Streaming…</Text>}
        {snapshot.status === 'error' && <Text style={styles.error}>{snapshot.error}</Text>}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask the model"
          multiline
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    color: '#5b6472',
  },
  messages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    gap: 8,
    paddingBottom: 12,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  bubbleText: {
    color: '#111827',
  },
  bubbleTextUser: {
    color: '#ffffff',
  },
  status: {
    color: '#4b5563',
    fontStyle: 'italic',
  },
  error: {
    color: '#b91c1c',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f9fafb',
  },
});
