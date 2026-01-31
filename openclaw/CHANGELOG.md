# Changelog

## [0.2.5] - 2026-01-31

### Fixed
- Install Java 21 from Adoptium/Temurin for signal-cli 0.13.4 compatibility
- Debian Bookworm doesn't have openjdk-21, so use Adoptium repository
- signal-cli 0.13.4 requires Java 21+ (class file version 65.0)
- Download architecture-specific signal-cli build (aarch64 vs x86_64)
- Generic build lacks native libsignal libraries for ARM

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
