# Changelog

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
