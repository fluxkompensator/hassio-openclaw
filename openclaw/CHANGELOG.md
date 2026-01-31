# Changelog

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
