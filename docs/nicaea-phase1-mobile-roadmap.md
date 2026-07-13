# Nicaea — Phase 1 Roadmap: Mobile (React Native)

## Overview

Nicaea currently exists as a web app that connects to OpenRouter and lets a user assemble a "council" of AI models, each responding independently to a prompt, with a "chairman" model synthesizing the best final answer. Phase 1 ports this experience to mobile using a single React Native codebase targeting both Android and iOS. Phase 2, deferred, extends to desktop (Windows and likely macOS/Linux).

The core product logic — council orchestration, chairman synthesis — doesn't change on mobile. What changes is the UI shell, key/credential storage, network handling on a mobile connection, and how results are persisted and displayed on a smaller screen.

## Goals for Phase 1

The mobile app should let a user configure an OpenRouter API key, pick a council of models, submit a prompt, watch each council member's response stream in, and see the chairman's synthesized answer — all with performance and security appropriate for a phone. It does not need to replicate every web feature on day one; the goal is a working, secure, and reasonably polished MVP on Android and iOS from one codebase.

## Tech Stack

- **Framework**: React Native (bare or Expo — see "Expo vs. bare" below)
- **Language**: TypeScript throughout, for parity with a typical React web codebase and to keep API/response types consistent
- **Navigation**: React Navigation (stack + tab navigator — e.g., Chat/Council tab, History tab, Settings tab)
- **State management**: Zustand or Redux Toolkit for council/session state; React Query (TanStack Query) for OpenRouter request lifecycle (loading, streaming, error, retry)
- **Networking**: `fetch` with streaming support, or `eventsource` polyfill if OpenRouter responses are consumed as SSE — needs verification since RN's fetch streaming support differs from browser fetch (see Risks)
- **Secure storage**: `react-native-keychain` (iOS Keychain / Android Keystore) for the OpenRouter API key — never AsyncStorage or plain state for credentials
- **Local persistence**: SQLite (`expo-sqlite` or `react-native-sqlite-storage`) or a lightweight option like WatermelonDB if conversation history needs to scale; MMKV for fast key-value settings

### Expo vs. bare React Native

Expo (managed or with dev client) is the faster path to a working app and handles a lot of the native build tooling automatically. The tradeoff is native module flexibility — `react-native-keychain` and most SQLite libraries work fine under Expo's dev client / EAS build today, so Expo is the recommended starting point unless a specific native requirement surfaces that forces ejecting.

## App Architecture

**Screens**: Council Setup (pick models, assign roles, set chairman), Chat/Session (prompt input, streaming council responses, chairman synthesis), History (past sessions), Settings (API key, default council presets, theme).

**Data flow**: user submits a prompt → app fans out parallel requests to OpenRouter for each council member → responses stream back independently and render as they arrive → once all council responses are in (or a timeout/partial-response policy kicks in), a final request goes to the chairman model with the aggregated council output → chairman's synthesized response renders and the full session (prompts, council responses, chairman output) is persisted locally.

**Concurrency**: mobile networks are less reliable than desktop broadband, so the fan-out to council members should handle partial failures gracefully — if one model times out or errors, the chairman synthesis should still proceed with the responses that succeeded, and the UI should mark the failed member clearly rather than blocking the whole session.

## OpenRouter Integration

The app talks to OpenRouter's chat completions API directly from the client for Phase 1, using the user's own API key stored in Keychain/Keystore — this mirrors how the web app likely works and avoids standing up a backend before it's needed. Streaming responses (SSE-style) from OpenRouter need to be verified against React Native's networking stack; if native `fetch` streaming proves unreliable across both platforms, `react-native-sse` or a WebSocket-based proxy are fallback options.

A backend becomes worth considering later if the app needs to hide the API key from the client (e.g., a freemium model where Nicaea holds the key rather than the user), needs server-side rate limiting, or wants to sync history across devices. None of that is required for Phase 1.

## Security Considerations

The OpenRouter API key is the main sensitive asset. It should be stored only in the platform secure enclave (Keychain on iOS, Keystore-backed encrypted storage on Android) via `react-native-keychain`, never in AsyncStorage, Redux state persisted to disk, or logs. Certificate pinning is likely unnecessary for an MVP but worth a note for later hardening. Conversation history stored locally should also be treated as potentially sensitive depending on what users discuss with the council — consider whether it needs encryption at rest.

## Milestones

1. **Project scaffold**: Expo project initialized, TypeScript, navigation shell, Keychain integration for API key entry/storage.
2. **Single-model chat**: prove out streaming request/response against OpenRouter with one model before adding council complexity.
3. **Council fan-out**: parallel requests to multiple models, per-member streaming UI, partial-failure handling.
4. **Chairman synthesis**: aggregate council responses, send to chairman model, render final answer.
5. **History and persistence**: local SQLite storage of sessions, History screen.
6. **Settings and presets**: API key management UI, saved council configurations.
7. **Polish and platform QA**: test on physical Android and iOS devices, handle platform-specific edge cases (keyboard behavior, safe areas, background/foreground state during a streaming request).

## Open Questions

A few decisions are worth pinning down before or during scaffolding: whether Phase 1 targets Expo managed workflow or bare RN from the start, what the partial-failure policy is when a council member times out, whether history sync across devices is a Phase 1 requirement or explicitly deferred, and whether there's an existing web app codebase/API layer that should be shared or ported rather than rebuilt.

## Phase 2 Preview (Desktop)

Once mobile is stable, desktop (starting with Windows) is a separate decision point: React Native for Windows (code-sharing with the mobile RN codebase) versus Electron or Tauri wrapping a web build (more code-sharing with the existing Nicaea web app, if one exists). That choice depends heavily on how much of Phase 1's UI and logic is reusable versus how much the web app's existing code can be leveraged — worth revisiting once Phase 1 ships.
