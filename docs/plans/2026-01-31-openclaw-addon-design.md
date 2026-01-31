# OpenClaw Home Assistant Addon Design

## Overview

A Home Assistant addon that runs OpenClaw.ai with full bidirectional integration - voice commands via HA's conversation pipeline and proactive device control.

## Requirements

- **Platform**: Raspberry Pi 5 with official Home Assistant image
- **LLM Provider**: Anthropic Claude (API key)
- **Interaction**: Web UI via ingress + voice integration
- **HA Access**: Supervisor API (default) with optional token override

## Addon Structure

```
openclaw/
├── config.yaml          # Addon metadata, options, permissions
├── Dockerfile           # Container build (Node 22, ARM64 support)
├── run.sh              # Startup script with Bashio
├── rootfs/
│   └── etc/
│       └── s6-overlay/
│           └── s6-rc.d/
│               ├── openclaw/
│               │   ├── run          # Main service
│               │   └── finish       # Cleanup
│               └── init/
│                   └── run          # Initialization
└── DOCS.md             # User documentation
```

## Configuration Options

```yaml
options:
  anthropic_api_key: ""           # Required - Claude API key
  ha_access_token: ""             # Optional - override Supervisor API
  log_level: "info"               # debug, info, warn, error
  workspace_path: "/share/openclaw"  # Persistent workspace location

schema:
  anthropic_api_key: "password"   # Masked in UI
  ha_access_token: "password?"    # Optional, masked
  log_level: "list(debug|info|warn|error)"
  workspace_path: "str"
```

### Home Assistant Access Logic

1. If `ha_access_token` is provided → use it with HA REST API
2. Otherwise → use Supervisor API token (auto-injected via `$SUPERVISOR_TOKEN`)

### Persistent Storage

- Config: `/data/openclaw/` (addon-specific, survives updates)
- Workspace: `/share/openclaw/` (accessible to other addons if needed)

## Home Assistant Integration

### Device Control (OpenClaw → HA)

Custom OpenClaw skill that wraps Home Assistant's API:

```
rootfs/
└── opt/
    └── openclaw-ha-skill/
        ├── package.json
        └── index.ts        # HA control skill
```

Provides abilities to:
- List devices/entities (`GET /api/states`)
- Control devices (`POST /api/services/{domain}/{service}`)
- Query state ("Is the living room light on?")
- Run automations/scripts

### Voice Integration (HA → OpenClaw)

REST command + intent script approach (documented for users):

```yaml
# configuration.yaml
rest_command:
  openclaw_query:
    url: "http://localhost:18789/api/chat"
    method: POST
    content_type: "application/json"
    payload: '{"message": "{{ message }}"}'

intent_script:
  OpenClawIntent:
    speech:
      text: "{{ states('sensor.openclaw_response') }}"
    action:
      - service: rest_command.openclaw_query
        data:
          message: "{{ query }}"
```

## Dockerfile

```dockerfile
ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js 22 (required by OpenClaw)
RUN apk add --no-cache nodejs npm

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Copy rootfs (s6 scripts, HA skill)
COPY rootfs /

# Persistent data locations
VOLUME ["/data", "/share"]

# Gateway + bridge ports (ingress handles external access)
EXPOSE 18789 18790
```

**Base image**: `ghcr.io/home-assistant/aarch64-base:3.19` (Alpine-based)

## Startup Flow (s6-overlay)

### Init Script
1. Create config dirs if missing
2. Generate `~/.openclaw/openclaw.json` from addon options
3. Inject Anthropic API key
4. Configure HA connection (Supervisor token or user-provided token)

### Run Script
1. Start `openclaw gateway` in foreground
2. s6 monitors and restarts on crash

## Architecture Support

| Architecture | Support |
|--------------|---------|
| `aarch64` | Primary (RPi 5) |
| `amd64` | Secondary |

## Future Considerations

- Chat app channels (WhatsApp, Telegram, Discord) - configurable later
- HACS integration for easier conversation agent setup
- Local model support (Ollama)

## Sources

- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [OpenClaw Documentation](https://docs.openclaw.ai/start/getting-started)
- [HA Addon Building Guide](https://github.com/alexbelgium/hassio-addons/wiki/Building-an-addon)
