# Changelog

## [0.2.29] - 2026-01-31

### Added
- DNS override configuration via `dns_overrides` option
- Allows adding custom `/etc/hosts` entries at addon startup
- Format: `"IP hostname"` (same as /etc/hosts format)
- Useful for resolving local hostnames, internal services, or testing
- Entries are marked and cleaned up on restart (idempotent)

### Example Configuration
```yaml
dns_overrides:
  - "192.168.1.100 mynas.local"
  - "10.0.0.50 printer.home"
```

## [0.2.28] - 2026-01-31

### Added
- Text-to-speech (TTS) support with Edge TTS provider
- New `tts_voice` config option for German voice selection
- Default voice: `de-DE-ConradNeural` (German male)
- Other options: `de-DE-KatjaNeural` (female), `de-AT-JonasNeural` (Austrian), `de-CH-LeniNeural` (Swiss)
- TTS auto-responds with voice when voice is configured

## [0.2.27] - 2026-01-31

### Fixed
- Clear MediaPath/MediaUrl after successful audio transcription
- Previous patch only filtered audio in extractFileBlocks, but MediaPath remained
- Claude's native audio support was still processing files via remaining MediaPath reference
- Now clears all media fields (MediaPath, MediaUrl, MediaType, etc.) after transcription
- Similar to how Telegram handles media cleanup to prevent native processing

## [0.2.26] - 2026-01-31

### Fixed
- Rewrite audio patch using Node.js for reliable code modification
- Previous sed-based patch had broken logic (&&/|| precedence issues)
- New patch adds unconditional early exit for audio files in attachment loop
- Audio files (.aac, .ogg, .opus, etc.) now skipped before reaching model context

## [0.2.24] - 2026-01-31

### Fixed
- Patch OpenClaw to filter out raw audio files from model context
- After transcription succeeds, audio binary was still passed to Claude Opus 4.5
- Claude's native audio support processed it (~30k tokens), causing rate limit errors
- Patch adds extension-based filtering to prevent audio files in model context
- See: https://github.com/openclaw/openclaw/issues/4197

## [0.2.23] - 2026-01-31

### Changed
- Upgrade to whisper-small model (~500MB) for best transcription accuracy
- RPi5 with 8GB RAM can handle it easily
- Significantly better German and multilingual recognition than tiny/base

## [0.2.22] - 2026-01-31

### Changed
- Upgrade from whisper-tiny to whisper-base model for better transcription accuracy
- tiny (~75MB) had poor quality, base (~150MB) provides much better accuracy
- Especially improves German and multilingual recognition

## [0.2.21] - 2026-01-31

### Fixed
- Fix transcribe-audio script: use for loop to find sherpa-onnx binary (glob expansion issue)
- Better JSON text extraction from sherpa-onnx output
- Add error handling for ffmpeg conversion
- Architecture-independent binary detection

## [0.2.20] - 2026-01-31

### Fixed
- Create transcribe-audio wrapper script that converts AAC→WAV before sherpa-onnx
- OpenClaw passes raw AAC files but sherpa-onnx only supports WAV
- Without conversion, OpenClaw falls back to Claude's native audio (30k+ tokens)
- Wrapper uses ffmpeg for conversion, then extracts transcription text

## [0.2.19] - 2026-01-31

### Changed
- Switch to multilingual whisper-tiny model (supports German, English, etc.)
- Previous .en model only supported English
- Model files: tiny-encoder.onnx, tiny-decoder.onnx, tiny-tokens.txt

## [0.2.18] - 2026-01-31

### Fixed
- Download whisper model as tar.bz2 archive (not individual files)
- Previous URLs returned 9-byte error pages instead of model files
- Use whisper-tiny.en model for fast transcription on ARM
- Model files: tiny.en-encoder.onnx, tiny.en-decoder.onnx, tiny.en-tokens.txt

## [0.2.17] - 2026-01-31

### Fixed
- Configure sherpa-onnx with explicit Whisper model arguments
- OpenClaw expects transducer model format by default, but we use Whisper
- Pass --whisper-encoder, --whisper-decoder, --tokens args explicitly

## [0.2.16] - 2026-01-31

### Fixed
- Install ffmpeg for audio format conversion (AAC → WAV)
- sherpa-onnx requires WAV input, Signal sends AAC voice notes
- Without ffmpeg, OpenClaw falls back to Claude's native audio (30k+ tokens)

## [0.2.15] - 2026-01-31

### Fixed
- Add tools.media.audio config to openclaw.json when voice_transcription is sherpa-onnx
- OpenClaw requires explicit audio config to enable transcription

## [0.2.14] - 2026-01-31

### Fixed
- Fix sherpa-onnx download: use correct release filenames (linux-x64-shared, linux-aarch64-shared-cpu)
- Install bzip2 for tar extraction

## [0.2.13] - 2026-01-31

### Added
- Voice message transcription support via sherpa-onnx
- Pre-installed Whisper small model (~500MB) for accurate offline transcription
- Automatic architecture detection (x86_64/aarch64) for sherpa-onnx binaries
- OpenClaw auto-detects sherpa-onnx-offline CLI for transcription

### Notes
- Transcription happens locally, no API calls needed
- Supports multiple languages automatically
- Voice messages sent via Signal are now transcribed and processed by Claude

## [0.2.10] - 2026-01-31

### Fixed
- Remove invalid configPath key from Signal channel config
- OpenClaw uses SIGNAL_CLI_CONFIG_DIR env var instead

## [0.2.9] - 2026-01-31

### Fixed
- Add missing Signal channel config: account, cliPath, configPath
- Set dmPolicy to "open" for easier testing (no pairing code required)
- OpenClaw needs these fields to connect to signal-cli

## [0.2.8] - 2026-01-31

### Fixed
- signal-cli daemon now detects registered account from accounts.json
- Waits for account to be linked before starting daemon
- Previously tried to use config phone number which didn't match linked account

## [0.2.7] - 2026-01-31

### Fixed
- Add signal-cli daemon service - was not running to receive messages
- signal-cli now starts in daemon mode with Unix socket at /tmp/signal-cli.sock
- OpenClaw gateway now depends on signal-cli being started first

## [0.2.6] - 2026-01-31

### Fixed
- Copy signal-cli from bbernhard/signal-cli-rest-api multi-arch image
- This image includes pre-built ARM64 native libsignal libraries
- signal-cli releases don't include ARM64 native builds
- Install Java 21 from Adoptium/Temurin (Debian Bookworm lacks openjdk-21)

## [0.2.3] - 2026-01-31

### Fixed
- Run `openclaw doctor --fix` on startup to enable Signal channel
- OpenClaw requires doctor --fix to apply channel configuration changes

## [0.2.2] - 2026-01-31

### Fixed
- Add detailed error output from signal-cli when link fails
- Add debug endpoint at `/api/debug` to diagnose signal-cli issues

## [0.2.1] - 2026-01-31

### Fixed
- Remove unrecognized keys from Signal channel config (dataPath, phone, transcription)
- Pass Signal settings via environment variables instead

## [0.2.0] - 2026-01-31

### Added
- Signal voice message support for mobile access with E2E encryption
- signal-cli integration for Signal communication
- **Signal Setup Web UI** at port 18790 - link Signal account with QR code from browser
- Voice transcription options (sherpa-onnx, whisper, none)
- Signal registration helper script (`/opt/signal-setup.sh`)
- New config options: `signal_enabled`, `signal_phone`, `voice_transcription`

### Setup
1. Enable Signal in addon config and set your phone number
2. Open `http://homeassistant.local:18790` in browser
3. Click "Generate QR Code" and scan with Signal app
4. Send voice messages to OpenClaw via Signal

## [0.1.13] - 2026-01-31

### Fixed
- Remove invalid config keys `workspace` and `logLevel` from openclaw.json

## [0.1.12] - 2026-01-31

### Fixed
- Write config to correct path: `/data/openclaw/.openclaw/openclaw.json`
- OpenClaw expects config in `.openclaw` subdirectory, not root data dir

## [0.1.11] - 2026-01-31

### Fixed
- Use correct auth-profiles.json format with version and profiles structure
- Format: `{"version": 1, "profiles": {"anthropic:manual": {"type": "token", ...}}}`

## [0.1.10] - 2026-01-31

### Fixed
- Use correct config format: API key in env section, model in agents.defaults
- Export ANTHROPIC_API_KEY as environment variable

## [0.1.9] - 2026-01-31

### Fixed
- Create auth-profiles.json with Anthropic API key in correct location
- OpenClaw stores API keys separately from main config

## [0.1.8] - 2026-01-31

### Changed
- Enable host_network mode for WebSocket compatibility
- Expose port 18789 directly (access at http://homeassistant.local:18789)
- Ingress kept for sidebar link, but direct access recommended for web UI

## [0.1.7] - 2026-01-31

### Fixed
- Add trustedProxies for HA ingress proxy
- Enable controlUi with allowInsecureAuth for reverse proxy
- Log gateway token for debugging

## [0.1.6] - 2026-01-31

### Fixed
- Generate gateway auth token and pass via --token flag
- Update CHANGELOG for visibility in HA UI

## [0.1.5] - 2026-01-31

### Fixed
- Add gateway auth token for LAN binding security

## [0.1.4] - 2026-01-31

### Fixed
- Add --allow-unconfigured and gateway.mode=local

## [0.1.3] - 2026-01-31

### Fixed
- Use --bind lan instead of --host for gateway

## [0.1.2] - 2026-01-31

### Fixed
- Add git for npm dependencies

## [0.1.1] - 2026-01-31

### Fixed
- Switch to Debian base image for native module compatibility
- Remove unnecessary Bashio install (included in base)

## [0.1.0] - 2026-01-31

### Added
- Initial release
- OpenClaw gateway integration
- Home Assistant device control skill
- Ingress web UI support
- Multi-architecture support (aarch64, amd64)
- Voice integration documentation
