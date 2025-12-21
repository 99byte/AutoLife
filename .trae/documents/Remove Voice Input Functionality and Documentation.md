I will remove all voice input functionality, documentation, and dependencies from the project as requested.

### 1. Codebase Cleanup (Deletions)
- Delete `src/autolife/voice_agent/` directory (includes ASR, TTS, Wake Word, Audio Recorder).
- Delete `src/autolife/api/routes/voice.py`.
- Delete `autolife-web/src/components/VoiceControl.tsx`.
- Delete `autolife-web/src/hooks/useAudioRecorder.ts`.
- Delete voice-related tests: `tests/test_asr.py`, `tests/test_tts.py`, `tests/test_audio_recorder.py`.
- Delete `docs/voice-testing-report.md`.

### 2. Backend Refactoring
- **Agent**: Move and rename `src/autolife/voice_agent/agent.py` to `src/autolife/agent.py`.
  - Rename class `VoiceAgent` to `AutoLifeAgent`.
  - Remove all ASR, TTS, and voice-handling logic.
  - Simplify to only support text commands via `PhoneAgent`.
- **CLI**: Update `src/autolife/cli.py` to remove `--listen`, `--audio` flags and related logic.
- **API**: Update `src/autolife/api/main.py` to remove the voice router.
- **Dependencies**: Update `src/autolife/api/dependencies.py` to use the new `AutoLifeAgent`.

### 3. Frontend Refactoring
- **Store**: Rename `autolife-web/src/store/voiceStore.ts` to `autolife-web/src/store/appStore.ts`.
  - Remove recording status, VAD status, and interaction mode (voice/text) state.
  - Keep conversation and task execution state.
- **Chat Interface**: Update `autolife-web/src/components/ChatPanel.tsx`.
  - Remove "Voice/Text" toggle and recording buttons.
  - Remove `useAudioRecorder` usage.
- **App Component**: Update `autolife-web/src/App.tsx` to change the title from "AutoLife 语音助手" to "AutoLife Assistant".
- **API Service**: Update `autolife-web/src/services/api.ts` to remove voice-related endpoints.

### 4. Configuration & Documentation
- **Dependencies**: Remove `sounddevice`, `soundfile`, `openai-whisper`, `pvporcupine` from `pyproject.toml`.
- **Documentation**:
  - Rewrite `README.md` to focus on AutoGLM/PhoneAgent capabilities.
  - Update `CLAUDE.md` and `PROJECT_STRUCTURE.md` to remove voice architecture references.
  - Update `docs/ROADMAP.md` to remove voice-related milestones.