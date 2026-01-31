# OpenClaw Home Assistant Addon Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a Home Assistant addon that runs OpenClaw.ai with ingress web UI, voice integration, and bidirectional device control.

**Architecture:** S6-overlay based addon using Node 22 Alpine base image. OpenClaw gateway runs as main service, with a custom HA skill for device control. Configuration managed via Bashio and addon options.

**Tech Stack:** Docker, s6-overlay, Node.js 22, Bashio, OpenClaw, Home Assistant Supervisor API

---

### Task 1: Create Addon Metadata (config.yaml)

**Files:**
- Create: `config.yaml`

**Step 1: Write config.yaml**

```yaml
name: "OpenClaw"
description: "OpenClaw.ai personal AI assistant with Home Assistant integration"
version: "0.1.0"
slug: "openclaw"
url: "https://github.com/openclaw/openclaw"
arch:
  - aarch64
  - amd64
init: false
homeassistant_api: true
hassio_api: true
ingress: true
ingress_port: 18789
ingress_stream: true
panel_icon: "mdi:robot"
panel_title: "OpenClaw"
map:
  - share:rw
  - data:rw
options:
  anthropic_api_key: ""
  ha_access_token: ""
  log_level: "info"
  workspace_path: "/share/openclaw"
schema:
  anthropic_api_key: password
  ha_access_token: password?
  log_level: list(debug|info|warn|error)
  workspace_path: str
environment:
  OPENCLAW_CONFIG_DIR: /data/openclaw
  OPENCLAW_WORKSPACE_DIR: /share/openclaw
```

**Step 2: Commit**

```bash
git add config.yaml
git commit -m "feat: add addon config.yaml with metadata and options"
```

---

### Task 2: Create Build Configuration (build.yaml)

**Files:**
- Create: `build.yaml`

**Step 1: Write build.yaml**

```yaml
build_from:
  aarch64: ghcr.io/home-assistant/aarch64-base:3.19
  amd64: ghcr.io/home-assistant/amd64-base:3.19
args:
  NODEJS_VERSION: 22
labels:
  org.opencontainers.image.title: "OpenClaw"
  org.opencontainers.image.description: "OpenClaw.ai personal AI assistant"
  org.opencontainers.image.source: "https://github.com/openclaw/openclaw"
  org.opencontainers.image.licenses: "MIT"
```

**Step 2: Commit**

```bash
git add build.yaml
git commit -m "feat: add build.yaml with multi-arch support"
```

---

### Task 3: Create Dockerfile

**Files:**
- Create: `Dockerfile`

**Step 1: Write Dockerfile**

```dockerfile
ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js 22 and npm
RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    bash

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Install Bashio for addon scripting
ARG BASHIO_VERSION="0.16.2"
RUN curl -L -s "https://github.com/hassio-addons/bashio/archive/v${BASHIO_VERSION}.tar.gz" \
    | tar -xzf - -C /tmp \
    && mv /tmp/bashio-${BASHIO_VERSION}/lib /usr/lib/bashio \
    && ln -s /usr/lib/bashio/bashio /usr/bin/bashio \
    && rm -rf /tmp/bashio-${BASHIO_VERSION}

# Copy root filesystem
COPY rootfs /

# Create directories
RUN mkdir -p /data/openclaw /share/openclaw

# Set working directory
WORKDIR /data/openclaw

# Labels
LABEL \
    io.hass.name="OpenClaw" \
    io.hass.description="OpenClaw.ai personal AI assistant" \
    io.hass.type="addon" \
    io.hass.version="0.1.0"
```

**Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: add Dockerfile with Node 22 and OpenClaw"
```

---

### Task 4: Create S6 Init Script

**Files:**
- Create: `rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/type`
- Create: `rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/up`
- Create: `rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/run`
- Create: `rootfs/etc/s6-overlay/s6-rc.d/user/contents.d/init-openclaw`

**Step 1: Create directory structure**

```bash
mkdir -p rootfs/etc/s6-overlay/s6-rc.d/init-openclaw
mkdir -p rootfs/etc/s6-overlay/s6-rc.d/user/contents.d
```

**Step 2: Write type file (oneshot service)**

`rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/type`:
```
oneshot
```

**Step 3: Write up file (execution order)**

`rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/up`:
```
/etc/s6-overlay/s6-rc.d/init-openclaw/run
```

**Step 4: Write init run script**

`rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/run`:
```bash
#!/command/with-contenv bashio
# shellcheck shell=bash
# ==============================================================================
# Initialize OpenClaw configuration
# ==============================================================================

bashio::log.info "Initializing OpenClaw addon..."

# Create config directories
mkdir -p /data/openclaw
mkdir -p "$(bashio::config 'workspace_path')"

# Get configuration values
ANTHROPIC_API_KEY=$(bashio::config 'anthropic_api_key')
HA_ACCESS_TOKEN=$(bashio::config 'ha_access_token')
LOG_LEVEL=$(bashio::config 'log_level')
WORKSPACE_PATH=$(bashio::config 'workspace_path')

# Determine Home Assistant access method
if bashio::config.has_value 'ha_access_token'; then
    bashio::log.info "Using provided Home Assistant access token"
    HA_TOKEN="${HA_ACCESS_TOKEN}"
    HA_URL="http://supervisor/core"
else
    bashio::log.info "Using Supervisor API token"
    HA_TOKEN="${SUPERVISOR_TOKEN}"
    HA_URL="http://supervisor/core"
fi

# Create OpenClaw config directory
OPENCLAW_HOME="/data/openclaw"
mkdir -p "${OPENCLAW_HOME}"

# Generate OpenClaw configuration
cat > "${OPENCLAW_HOME}/openclaw.json" << EOF
{
  "model": {
    "provider": "anthropic",
    "apiKey": "${ANTHROPIC_API_KEY}"
  },
  "gateway": {
    "port": 18789,
    "host": "0.0.0.0"
  },
  "workspace": "${WORKSPACE_PATH}",
  "logLevel": "${LOG_LEVEL}"
}
EOF

# Export environment variables for the main service
{
    echo "HA_TOKEN=${HA_TOKEN}"
    echo "HA_URL=${HA_URL}"
    echo "OPENCLAW_CONFIG_DIR=${OPENCLAW_HOME}"
    echo "OPENCLAW_WORKSPACE_DIR=${WORKSPACE_PATH}"
    echo "HOME=${OPENCLAW_HOME}"
} > /var/run/s6/container_environment/openclaw-env

bashio::log.info "OpenClaw initialization complete"
```

**Step 5: Create user contents marker**

`rootfs/etc/s6-overlay/s6-rc.d/user/contents.d/init-openclaw`:
```
(empty file)
```

**Step 6: Make run script executable and commit**

```bash
chmod +x rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/run
touch rootfs/etc/s6-overlay/s6-rc.d/user/contents.d/init-openclaw
git add rootfs/
git commit -m "feat: add s6 init script for OpenClaw configuration"
```

---

### Task 5: Create S6 Main Service

**Files:**
- Create: `rootfs/etc/s6-overlay/s6-rc.d/openclaw/type`
- Create: `rootfs/etc/s6-overlay/s6-rc.d/openclaw/run`
- Create: `rootfs/etc/s6-overlay/s6-rc.d/openclaw/finish`
- Create: `rootfs/etc/s6-overlay/s6-rc.d/openclaw/dependencies.d/init-openclaw`
- Create: `rootfs/etc/s6-overlay/s6-rc.d/user/contents.d/openclaw`

**Step 1: Create directory structure**

```bash
mkdir -p rootfs/etc/s6-overlay/s6-rc.d/openclaw/dependencies.d
```

**Step 2: Write type file (longrun service)**

`rootfs/etc/s6-overlay/s6-rc.d/openclaw/type`:
```
longrun
```

**Step 3: Write main run script**

`rootfs/etc/s6-overlay/s6-rc.d/openclaw/run`:
```bash
#!/command/with-contenv bashio
# shellcheck shell=bash
# ==============================================================================
# Start OpenClaw gateway
# ==============================================================================

bashio::log.info "Starting OpenClaw gateway..."

# Source environment variables
if [[ -f /var/run/s6/container_environment/openclaw-env ]]; then
    # shellcheck disable=SC1091
    source /var/run/s6/container_environment/openclaw-env
fi

# Set HOME for OpenClaw
export HOME="${OPENCLAW_CONFIG_DIR:-/data/openclaw}"
export NODE_ENV="production"

# Change to workspace directory
cd "${OPENCLAW_WORKSPACE_DIR:-/share/openclaw}" || exit 1

# Start OpenClaw gateway
exec openclaw gateway --port 18789 --host 0.0.0.0
```

**Step 4: Write finish script (cleanup)**

`rootfs/etc/s6-overlay/s6-rc.d/openclaw/finish`:
```bash
#!/command/with-contenv bashio
# shellcheck shell=bash
# ==============================================================================
# Cleanup on OpenClaw shutdown
# ==============================================================================

bashio::log.info "OpenClaw gateway stopped"

# Exit code handling
if [[ "${1}" -ne 0 ]] && [[ "${1}" -ne 256 ]]; then
    bashio::log.warning "OpenClaw gateway crashed with exit code ${1}"
fi
```

**Step 5: Create dependency marker**

`rootfs/etc/s6-overlay/s6-rc.d/openclaw/dependencies.d/init-openclaw`:
```
(empty file)
```

**Step 6: Create user contents marker**

`rootfs/etc/s6-overlay/s6-rc.d/user/contents.d/openclaw`:
```
(empty file)
```

**Step 7: Make scripts executable and commit**

```bash
chmod +x rootfs/etc/s6-overlay/s6-rc.d/openclaw/run
chmod +x rootfs/etc/s6-overlay/s6-rc.d/openclaw/finish
touch rootfs/etc/s6-overlay/s6-rc.d/openclaw/dependencies.d/init-openclaw
touch rootfs/etc/s6-overlay/s6-rc.d/user/contents.d/openclaw
git add rootfs/
git commit -m "feat: add s6 main service for OpenClaw gateway"
```

---

### Task 6: Create Home Assistant Skill for OpenClaw

**Files:**
- Create: `rootfs/opt/openclaw-ha-skill/package.json`
- Create: `rootfs/opt/openclaw-ha-skill/index.mjs`

**Step 1: Create directory**

```bash
mkdir -p rootfs/opt/openclaw-ha-skill
```

**Step 2: Write package.json**

`rootfs/opt/openclaw-ha-skill/package.json`:
```json
{
  "name": "openclaw-ha-skill",
  "version": "0.1.0",
  "description": "OpenClaw skill for Home Assistant integration",
  "type": "module",
  "main": "index.mjs",
  "dependencies": {}
}
```

**Step 3: Write the HA skill**

`rootfs/opt/openclaw-ha-skill/index.mjs`:
```javascript
/**
 * OpenClaw Home Assistant Skill
 * Provides device control and state querying capabilities
 */

const HA_URL = process.env.HA_URL || 'http://supervisor/core';
const HA_TOKEN = process.env.HA_TOKEN || process.env.SUPERVISOR_TOKEN;

async function haFetch(endpoint, options = {}) {
  const url = `${HA_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${HA_TOKEN}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HA API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get all entity states
 */
export async function getStates() {
  return haFetch('/api/states');
}

/**
 * Get state of a specific entity
 */
export async function getState(entityId) {
  return haFetch(`/api/states/${entityId}`);
}

/**
 * Call a Home Assistant service
 */
export async function callService(domain, service, data = {}) {
  return haFetch(`/api/services/${domain}/${service}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Turn on an entity
 */
export async function turnOn(entityId) {
  const domain = entityId.split('.')[0];
  return callService(domain, 'turn_on', { entity_id: entityId });
}

/**
 * Turn off an entity
 */
export async function turnOff(entityId) {
  const domain = entityId.split('.')[0];
  return callService(domain, 'turn_off', { entity_id: entityId });
}

/**
 * Toggle an entity
 */
export async function toggle(entityId) {
  const domain = entityId.split('.')[0];
  return callService(domain, 'toggle', { entity_id: entityId });
}

/**
 * Set light brightness
 */
export async function setLightBrightness(entityId, brightness) {
  return callService('light', 'turn_on', {
    entity_id: entityId,
    brightness: Math.round(brightness * 2.55), // Convert 0-100 to 0-255
  });
}

/**
 * Set climate temperature
 */
export async function setTemperature(entityId, temperature) {
  return callService('climate', 'set_temperature', {
    entity_id: entityId,
    temperature,
  });
}

/**
 * Run an automation
 */
export async function triggerAutomation(entityId) {
  return callService('automation', 'trigger', { entity_id: entityId });
}

/**
 * Run a script
 */
export async function runScript(entityId) {
  return callService('script', 'turn_on', { entity_id: entityId });
}

/**
 * Get friendly device list
 */
export async function listDevices() {
  const states = await getStates();
  return states
    .filter(s => !s.entity_id.startsWith('persistent_notification.'))
    .map(s => ({
      entity_id: s.entity_id,
      name: s.attributes.friendly_name || s.entity_id,
      state: s.state,
      domain: s.entity_id.split('.')[0],
    }));
}

/**
 * Search for entities by name
 */
export async function findEntities(query) {
  const devices = await listDevices();
  const lowerQuery = query.toLowerCase();
  return devices.filter(d =>
    d.name.toLowerCase().includes(lowerQuery) ||
    d.entity_id.toLowerCase().includes(lowerQuery)
  );
}

// Export skill definition for OpenClaw
export default {
  name: 'homeassistant',
  description: 'Control Home Assistant devices and automations',
  tools: [
    {
      name: 'ha_get_states',
      description: 'Get all entity states from Home Assistant',
      handler: getStates,
    },
    {
      name: 'ha_get_state',
      description: 'Get state of a specific entity',
      parameters: { entityId: 'string' },
      handler: getState,
    },
    {
      name: 'ha_turn_on',
      description: 'Turn on a device (light, switch, etc.)',
      parameters: { entityId: 'string' },
      handler: turnOn,
    },
    {
      name: 'ha_turn_off',
      description: 'Turn off a device',
      parameters: { entityId: 'string' },
      handler: turnOff,
    },
    {
      name: 'ha_toggle',
      description: 'Toggle a device on/off',
      parameters: { entityId: 'string' },
      handler: toggle,
    },
    {
      name: 'ha_set_brightness',
      description: 'Set light brightness (0-100)',
      parameters: { entityId: 'string', brightness: 'number' },
      handler: setLightBrightness,
    },
    {
      name: 'ha_set_temperature',
      description: 'Set thermostat temperature',
      parameters: { entityId: 'string', temperature: 'number' },
      handler: setTemperature,
    },
    {
      name: 'ha_trigger_automation',
      description: 'Trigger an automation',
      parameters: { entityId: 'string' },
      handler: triggerAutomation,
    },
    {
      name: 'ha_run_script',
      description: 'Run a Home Assistant script',
      parameters: { entityId: 'string' },
      handler: runScript,
    },
    {
      name: 'ha_list_devices',
      description: 'List all devices with friendly names',
      handler: listDevices,
    },
    {
      name: 'ha_find_entities',
      description: 'Search for entities by name',
      parameters: { query: 'string' },
      handler: findEntities,
    },
  ],
};
```

**Step 4: Commit**

```bash
git add rootfs/opt/openclaw-ha-skill/
git commit -m "feat: add Home Assistant skill for OpenClaw"
```

---

### Task 7: Update Init to Install HA Skill

**Files:**
- Modify: `rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/run`

**Step 1: Update init script to install and configure the HA skill**

Add after the openclaw.json generation, before the final log message:

```bash
# Install HA skill to OpenClaw
SKILL_DIR="${OPENCLAW_HOME}/skills/homeassistant"
mkdir -p "${SKILL_DIR}"
cp -r /opt/openclaw-ha-skill/* "${SKILL_DIR}/"

bashio::log.info "Home Assistant skill installed"
```

**Step 2: Commit**

```bash
git add rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/run
git commit -m "feat: auto-install HA skill during init"
```

---

### Task 8: Create User Documentation (DOCS.md)

**Files:**
- Create: `DOCS.md`

**Step 1: Write documentation**

```markdown
# OpenClaw Home Assistant Addon

Run [OpenClaw.ai](https://openclaw.ai/) as a Home Assistant addon with full device control and voice integration.

## Features

- **Web UI Access**: Access OpenClaw through the Home Assistant sidebar
- **Device Control**: OpenClaw can control all your Home Assistant devices
- **Voice Integration**: Connect to Home Assistant's conversation pipeline

## Configuration

### Required Settings

| Option | Description |
|--------|-------------|
| `anthropic_api_key` | Your Anthropic API key for Claude |

### Optional Settings

| Option | Default | Description |
|--------|---------|-------------|
| `ha_access_token` | (Supervisor) | Override with a long-lived access token |
| `log_level` | `info` | Log verbosity: debug, info, warn, error |
| `workspace_path` | `/share/openclaw` | Persistent workspace location |

## Getting Your Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to API Keys
4. Create a new key and copy it
5. Paste it into the addon configuration

## Voice Integration Setup

To use OpenClaw as a conversation agent in Home Assistant:

### Step 1: Add REST Command

Add to your `configuration.yaml`:

```yaml
rest_command:
  openclaw_chat:
    url: "http://localhost:18789/api/chat"
    method: POST
    content_type: "application/json"
    payload: '{"message": "{{ message }}"}'
    timeout: 60
```

### Step 2: Create an Intent Script

```yaml
intent_script:
  OpenClawQuery:
    speech:
      text: "{{ response }}"
    action:
      - service: rest_command.openclaw_chat
        data:
          message: "{{ query }}"
        response_variable: response
```

### Step 3: Restart Home Assistant

After adding the configuration, restart Home Assistant to apply changes.

## Home Assistant Control

OpenClaw can control your Home Assistant devices using natural language:

- "Turn on the living room lights"
- "Set the bedroom temperature to 72 degrees"
- "Is the front door locked?"
- "Run the goodnight automation"

The addon automatically has access to all your devices through the Supervisor API.

## Troubleshooting

### Addon won't start

1. Check the addon logs for errors
2. Verify your Anthropic API key is correct
3. Ensure the key has sufficient credits

### Can't control devices

1. Verify `homeassistant_api` is enabled in addon config
2. Check if using a custom token that it has proper permissions
3. Look for API errors in the addon logs

### Voice commands not working

1. Confirm the REST command is configured correctly
2. Test the REST command manually via Developer Tools > Services
3. Check that OpenClaw gateway is responding on port 18789

## Support

- [OpenClaw Documentation](https://docs.openclaw.ai/)
- [OpenClaw GitHub](https://github.com/openclaw/openclaw)
- [Home Assistant Community](https://community.home-assistant.io/)
```

**Step 2: Commit**

```bash
git add DOCS.md
git commit -m "docs: add user documentation for addon setup"
```

---

### Task 9: Create README and Repository Metadata

**Files:**
- Create: `README.md`
- Create: `CHANGELOG.md`
- Create: `.gitignore`

**Step 1: Write README.md**

```markdown
# OpenClaw Home Assistant Addon

[![Open your Home Assistant instance and show the add add-on repository dialog](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fhassio-addon-openclaw)

Run [OpenClaw.ai](https://openclaw.ai/) as a Home Assistant addon.

## About

OpenClaw is a personal AI assistant that can control your Home Assistant devices using natural language.

## Installation

1. Add this repository to your Home Assistant addon store
2. Install the OpenClaw addon
3. Configure your Anthropic API key
4. Start the addon
5. Access OpenClaw from the sidebar

## Features

- Web UI via ingress (sidebar access)
- Full Home Assistant device control
- Voice integration support
- Persistent configuration and workspace

## Documentation

See [DOCS.md](DOCS.md) for detailed setup instructions.

## License

MIT
```

**Step 2: Write CHANGELOG.md**

```markdown
# Changelog

## [0.1.0] - 2026-01-31

### Added
- Initial release
- OpenClaw gateway integration
- Home Assistant device control skill
- Ingress web UI support
- Multi-architecture support (aarch64, amd64)
- Voice integration documentation
```

**Step 3: Write .gitignore**

```
# Node
node_modules/
npm-debug.log

# Build artifacts
*.log
.DS_Store

# IDE
.idea/
.vscode/
*.swp
*.swo

# Local testing
.env
*.local
```

**Step 4: Commit**

```bash
git add README.md CHANGELOG.md .gitignore
git commit -m "docs: add README, CHANGELOG, and .gitignore"
```

---

### Task 10: Create Icon and Logo

**Files:**
- Create: `icon.png` (512x512)
- Create: `logo.png` (512x512)

**Step 1: Create placeholder icon**

For initial development, create a simple SVG that can be converted:

```bash
# Create a simple placeholder (you'll want to replace with actual logo)
# For now, we'll note this needs a proper icon
echo "TODO: Add icon.png (512x512) - OpenClaw lobster logo" > icon.txt
echo "TODO: Add logo.png (512x512) - OpenClaw lobster logo" >> icon.txt
```

**Step 2: Commit placeholder note**

```bash
git add icon.txt
git commit -m "chore: add placeholder for addon icons"
```

**Note:** Download the actual OpenClaw logo from their branding/assets and resize to 512x512 PNG format.

---

### Task 11: Final Verification and Tag

**Step 1: Verify file structure**

```bash
tree -a --noreport
```

Expected output:
```
.
├── .git
├── .gitignore
├── build.yaml
├── CHANGELOG.md
├── config.yaml
├── Dockerfile
├── DOCS.md
├── docs
│   └── plans
│       ├── 2026-01-31-openclaw-addon-design.md
│       └── 2026-01-31-openclaw-addon-implementation.md
├── icon.txt
├── README.md
└── rootfs
    ├── etc
    │   └── s6-overlay
    │       └── s6-rc.d
    │           ├── init-openclaw
    │           │   ├── run
    │           │   ├── type
    │           │   └── up
    │           ├── openclaw
    │           │   ├── dependencies.d
    │           │   │   └── init-openclaw
    │           │   ├── finish
    │           │   ├── run
    │           │   └── type
    │           └── user
    │               └── contents.d
    │                   ├── init-openclaw
    │                   └── openclaw
    └── opt
        └── openclaw-ha-skill
            ├── index.mjs
            └── package.json
```

**Step 2: Create version tag**

```bash
git tag -a v0.1.0 -m "Initial release of OpenClaw addon"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Addon metadata | `config.yaml` |
| 2 | Build configuration | `build.yaml` |
| 3 | Container definition | `Dockerfile` |
| 4 | S6 init script | `rootfs/etc/s6-overlay/s6-rc.d/init-openclaw/*` |
| 5 | S6 main service | `rootfs/etc/s6-overlay/s6-rc.d/openclaw/*` |
| 6 | HA control skill | `rootfs/opt/openclaw-ha-skill/*` |
| 7 | Skill installation | Update init script |
| 8 | User documentation | `DOCS.md` |
| 9 | Repository metadata | `README.md`, `CHANGELOG.md`, `.gitignore` |
| 10 | Addon icons | `icon.png`, `logo.png` |
| 11 | Final verification | Structure check, version tag |
