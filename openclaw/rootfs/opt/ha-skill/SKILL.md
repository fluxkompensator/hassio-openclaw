---
name: homeassistant-addon
description: Control and manage Home Assistant — devices, areas, entities, automations, integrations. Full Supervisor access.
---

# Home Assistant Control & Management

**CRITICAL: Token Efficiency**
- NEVER call `/api/states` — returns ALL entities, burns 100K+ tokens
- NEVER call `device_registry/list` or `entity_registry/list` without reason — large responses
- For device control → just call the service directly, don't query first
- Use Template API for searches (returns only entity IDs, tiny response)
- Single entity queries only when needed: `/api/states/light.specific_one`

## Environment

```bash
$HA_URL    # http://supervisor/core (Supervisor REST proxy)
$HA_TOKEN  # Auto-configured Supervisor auth token (full admin access)
```

All endpoints below use this auth header:
```bash
-H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json"
```

---

## Device Control (No Query Needed)

```bash
# Turn on — just do it, don't check state first
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.bathroom"}' "$HA_URL/api/services/light/turn_on"

# Turn off
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "switch.coffee"}' "$HA_URL/api/services/switch/turn_off"

# Toggle
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.bedroom"}' "$HA_URL/api/services/light/toggle"

# With brightness (0-100%)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.living_room", "brightness_pct": 50}' "$HA_URL/api/services/light/turn_on"

# Light color (RGB)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.living_room", "rgb_color": [255, 0, 0]}' "$HA_URL/api/services/light/turn_on"

# Color temperature (mireds, lower = cooler)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.living_room", "color_temp": 300}' "$HA_URL/api/services/light/turn_on"
```

## Service Domains

| Domain | Services |
|--------|----------|
| light | turn_on, turn_off, toggle (+ brightness_pct, rgb_color, color_temp) |
| switch | turn_on, turn_off, toggle |
| climate | set_temperature, set_hvac_mode, set_fan_mode, set_preset_mode |
| cover | open_cover, close_cover, stop_cover, set_cover_position |
| fan | turn_on, turn_off, toggle, set_percentage, set_preset_mode |
| media_player | media_play, media_pause, media_play_pause, media_stop, volume_set, volume_up, volume_down, select_source |
| lock | lock, unlock |
| vacuum | start, stop, return_to_base, locate |
| automation | trigger, turn_on, turn_off, toggle, reload |
| script | turn_on, turn_off, toggle, reload |
| scene | turn_on, reload |
| input_boolean | turn_on, turn_off, toggle |
| input_number | set_value, reload |
| input_select | select_option, select_next, select_previous, reload |
| input_text | set_value, reload |
| notify | (per integration, e.g. notify.mobile_app_phone) |
| tts | speak (entity_id of media_player, message) |

---

## Find Entities (Token-Efficient Templates)

Use the Template API — returns only what you ask for, tiny responses.

```bash
# Entities in an area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_entities(\"bathroom\") }}"}' "$HA_URL/api/template"

# Lights in an area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_entities(\"bathroom\") | select(\"match\", \"light.*\") | list }}"}' "$HA_URL/api/template"

# Devices in an area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_devices(\"kitchen\") }}"}' "$HA_URL/api/template"

# List all areas
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ areas() }}"}' "$HA_URL/api/template"

# Area name from area ID
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_name(\"kitchen\") }}"}' "$HA_URL/api/template"

# Area ID from entity
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_id(\"light.kitchen_ceiling\") }}"}' "$HA_URL/api/template"

# Device ID from entity
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ device_id(\"light.kitchen_ceiling\") }}"}' "$HA_URL/api/template"

# Device name
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ device_attr(\"DEVICE_ID\", \"name\") }}"}' "$HA_URL/api/template"

# All entities of a device
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ device_entities(\"DEVICE_ID\") }}"}' "$HA_URL/api/template"

# Integration of a device
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ device_attr(\"DEVICE_ID\", \"identifiers\") }}"}' "$HA_URL/api/template"

# Count entities by domain
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ states.light | list | count }} lights, {{ states.switch | list | count }} switches"}' "$HA_URL/api/template"

# Find entities by name pattern (fuzzy search)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ states | selectattr(\"name\", \"search\", \"kitchen\", ignorecase=true) | map(attribute=\"entity_id\") | list }}"}' "$HA_URL/api/template"

# Entity state + attributes (single entity, token-efficient alternative to /api/states/X)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ states(\"light.kitchen\") }} — {{ state_attr(\"light.kitchen\", \"friendly_name\") }}"}' "$HA_URL/api/template"
```

## Get ONE Entity State (When Needed)

```bash
# Single entity only — NEVER bulk fetch
curl -s -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states/sensor.temperature"
```

---

## Area Management

```bash
# List all areas (with IDs and names)
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/area_registry/list"

# Create a new area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Kitchen"}' "$HA_URL/api/config/area_registry/create"

# Create area with floor and icon
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Kitchen", "floor_id": "ground_floor", "icon": "mdi:silverware-fork-knife"}' \
  "$HA_URL/api/config/area_registry/create"

# Rename or update an area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"area_id": "kitchen", "name": "Main Kitchen"}' "$HA_URL/api/config/area_registry/update"

# Delete an area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"area_id": "old_room"}' "$HA_URL/api/config/area_registry/delete"
```

## Floor Management

```bash
# List floors
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/floor_registry/list"

# Create floor
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Ground Floor", "level": 0}' "$HA_URL/api/config/floor_registry/create"
```

## Label Management

```bash
# List labels
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/label_registry/list"

# Create label
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Critical", "color": "#ff0000", "icon": "mdi:alert"}' "$HA_URL/api/config/label_registry/create"
```

---

## Device Registry

```bash
# List ALL devices (large response — use only when needed)
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/device_registry/list"

# Assign device to area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"device_id": "DEVICE_ID_HERE", "area_id": "kitchen"}' \
  "$HA_URL/api/config/device_registry/update"

# Rename a device
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"device_id": "DEVICE_ID_HERE", "name_by_user": "Kitchen Ceiling Light"}' \
  "$HA_URL/api/config/device_registry/update"

# Disable a device
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"device_id": "DEVICE_ID_HERE", "disabled_by": "user"}' \
  "$HA_URL/api/config/device_registry/update"

# Re-enable a device
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"device_id": "DEVICE_ID_HERE", "disabled_by": null}' \
  "$HA_URL/api/config/device_registry/update"

# Add labels to device
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"device_id": "DEVICE_ID_HERE", "labels": ["critical", "bedroom"]}' \
  "$HA_URL/api/config/device_registry/update"
```

## Entity Registry

```bash
# List ALL entities (large response — use template API to find specific ones first)
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/entity_registry/list"

# Rename an entity (friendly name)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.node5_level", "name": "Kitchen Ceiling"}' \
  "$HA_URL/api/config/entity_registry/update"

# Change entity ID
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.node5_level", "new_entity_id": "light.kitchen_ceiling"}' \
  "$HA_URL/api/config/entity_registry/update"

# Disable an entity
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "sensor.unwanted", "disabled_by": "user"}' \
  "$HA_URL/api/config/entity_registry/update"

# Hide an entity (from UI but still functional)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "sensor.noisy", "hidden_by": "user"}' \
  "$HA_URL/api/config/entity_registry/update"

# Set entity icon
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen_ceiling", "icon": "mdi:ceiling-light"}' \
  "$HA_URL/api/config/entity_registry/update"

# Assign entity to area (overrides device area)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen_ceiling", "area_id": "kitchen"}' \
  "$HA_URL/api/config/entity_registry/update"

# Get single entity registry entry
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/entity_registry/get/light.kitchen_ceiling"
```

---

## Integration / Config Entry Management

```bash
# List all integrations (config entries)
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/config_entries/entry"

# Filter by domain (e.g. only Z-Wave)
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/config_entries/entry?domain=zwave_js"

# Reload an integration
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/config_entries/entry/ENTRY_ID/reload"

# Disable an integration
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"disabled_by": "user"}' "$HA_URL/api/config/config_entries/entry/ENTRY_ID/disable"
```

---

## Automation Management

```bash
# List all automations (IDs and basic info)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{% for a in states.automation %}{{ a.entity_id }}: {{ a.name }}\n{% endfor %}"}' \
  "$HA_URL/api/template"

# Get automation config by ID
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/automation/config/AUTOMATION_ID"

# Create a new automation
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{
    "alias": "Turn off kitchen lights at midnight",
    "description": "",
    "mode": "single",
    "triggers": [{"trigger": "time", "at": "00:00:00"}],
    "conditions": [],
    "actions": [{"action": "light.turn_off", "target": {"area_id": "kitchen"}}]
  }' "$HA_URL/api/config/automation/config/NEW_UNIQUE_ID"

# Update existing automation (PUT replaces entire config)
curl -sX PUT -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{ ... full automation config ... }' \
  "$HA_URL/api/config/automation/config/AUTOMATION_ID"

# Trigger an automation manually
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.turn_off_kitchen_lights"}' "$HA_URL/api/services/automation/trigger"

# Enable/disable automation
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.turn_off_kitchen_lights"}' "$HA_URL/api/services/automation/turn_off"

# Reload automations from YAML
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/services/automation/reload"
```

## Script Management

```bash
# List scripts
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{% for s in states.script %}{{ s.entity_id }}: {{ s.name }}\n{% endfor %}"}' \
  "$HA_URL/api/template"

# Run a script
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "script.good_night"}' "$HA_URL/api/services/script/turn_on"

# Run a script with variables
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "script.set_room_scene", "variables": {"room": "bedroom", "brightness": 40}}' \
  "$HA_URL/api/services/script/turn_on"
```

## Scene Management

```bash
# List scenes
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{% for s in states.scene %}{{ s.entity_id }}: {{ s.name }}\n{% endfor %}"}' \
  "$HA_URL/api/template"

# Activate a scene
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "scene.movie_night"}' "$HA_URL/api/services/scene/turn_on"
```

---

## Z-Wave Device Management (via zwave_js services)

First, find the Z-Wave config entry ID:
```bash
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" \
  "$HA_URL/api/config/config_entries/entry?domain=zwave_js"
```

### Z-Wave Services (REST)

```bash
# Refresh a node's values
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen_ceiling"}' "$HA_URL/api/services/zwave_js/refresh_value"

# Set a Z-Wave config parameter
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen_ceiling", "parameter": 1, "value": 50}' \
  "$HA_URL/api/services/zwave_js/set_config_parameter"

# Ping a node
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen_ceiling"}' "$HA_URL/api/services/zwave_js/ping"

# Heal network
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.kitchen_ceiling"}' "$HA_URL/api/services/zwave_js/heal_node"
```

### After Z-Wave Inclusion (device appears automatically)

Z-Wave device inclusion/exclusion is done through the HA UI or Z-Wave JS add-on directly. Once a device appears, use these APIs to configure it:

```bash
# 1. Find new Z-Wave devices (recently added)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ states | selectattr(\"entity_id\", \"search\", \"zwave\") | map(attribute=\"entity_id\") | list }}"}' \
  "$HA_URL/api/template"

# 2. Get device ID from entity
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ device_id(\"light.node5_level\") }}"}' "$HA_URL/api/template"

# 3. Rename the device
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"device_id": "DEVICE_ID", "name_by_user": "Kitchen Ceiling Light"}' \
  "$HA_URL/api/config/device_registry/update"

# 4. Assign to area
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"device_id": "DEVICE_ID", "area_id": "kitchen"}' \
  "$HA_URL/api/config/device_registry/update"

# 5. Rename the entity
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.node5_level", "name": "Kitchen Ceiling", "new_entity_id": "light.kitchen_ceiling"}' \
  "$HA_URL/api/config/entity_registry/update"

# 6. Disable unwanted entities (e.g. diagnostic sensors)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "sensor.node5_route_changed", "disabled_by": "user"}' \
  "$HA_URL/api/config/entity_registry/update"
```

---

## Supervisor API (Addon & System Management)

We run as an addon with full Supervisor access.

```bash
# HA Core info
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/core/info"

# Supervisor info
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/supervisor/info"

# Host info (OS, hostname, disk, etc.)
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/host/info"

# List all addons
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/addons"

# Addon info
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/addons/ADDON_SLUG/info"

# Restart an addon
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/addons/ADDON_SLUG/restart"

# Restart HA Core
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/core/restart"

# Check HA config validity
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/core/check"

# Network info
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/network/info"

# Available updates
curl -sX GET -H "Authorization: Bearer $HA_TOKEN" "http://supervisor/resolution/info"
```

---

## Helper Entity Management (Input Helpers)

```bash
# Create input_boolean
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Guest Mode", "icon": "mdi:account-group"}' \
  "$HA_URL/api/config/input_boolean"

# Create input_number
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Default Brightness", "min": 0, "max": 100, "step": 5, "mode": "slider", "unit_of_measurement": "%"}' \
  "$HA_URL/api/config/input_number"

# Create input_select (dropdown)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "House Mode", "options": ["Home", "Away", "Night", "Guest"]}' \
  "$HA_URL/api/config/input_select"

# Create input_text
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Status Message", "min": 0, "max": 255}' \
  "$HA_URL/api/config/input_text"

# Create timer
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Oven Timer", "duration": "00:30:00", "icon": "mdi:timer"}' \
  "$HA_URL/api/config/timer"

# Create counter
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"name": "Door Opens Today", "initial": 0, "step": 1}' \
  "$HA_URL/api/config/counter"
```

---

## Common Multi-Step Workflows

### Add & Configure a New Device (Post-Inclusion)

```
1. Find new unnamed entities → Template API (search for "node" or generic names)
2. Get device_id from entity → {{ device_id("light.node5_level") }}
3. Create area if needed → area_registry/create
4. Rename device → device_registry/update (name_by_user)
5. Assign device to area → device_registry/update (area_id)
6. Rename entity (friendly name) → entity_registry/update (name)
7. Change entity ID → entity_registry/update (new_entity_id)
8. Disable unwanted diagnostic entities → entity_registry/update (disabled_by)
9. Verify → Template API to confirm area assignment
```

### Create a Room with Devices

```
1. Create floor if needed → floor_registry/create
2. Create area → area_registry/create (with floor_id)
3. Find devices to assign → Template API / device_registry/list
4. Assign each device → device_registry/update (area_id)
5. Verify → {{ area_entities("new_room") }}
```

### Build an Automation

```
1. Identify trigger entities → Template API
2. Identify action entities → Template API
3. Create automation → /api/config/automation/config/NEW_ID
4. Verify → /api/services/automation/trigger
```

---

## Tips

- **Entity ID convention**: `domain.area_device` (e.g. `light.kitchen_ceiling`)
- **Area IDs** are lowercase slugified names (e.g. "Kitchen" → "kitchen", "Living Room" → "living_room")
- **To search for devices by name**: use Template API `selectattr("name", "search", "keyword")`
- **Always confirm** after multi-step operations by querying the result
- **Reload after YAML changes**: `/api/services/{domain}/reload`
