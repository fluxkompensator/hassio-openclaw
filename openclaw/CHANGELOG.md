# Changelog

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
