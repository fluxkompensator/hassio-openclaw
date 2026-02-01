---
name: homeassistant-addon
description: Control Home Assistant devices. Token-optimized patterns only.
---

# Home Assistant Control

**CRITICAL: Token Efficiency**
- NEVER call `/api/states` - returns ALL entities, burns 100K+ tokens
- For device control → just call the service directly, don't query first
- Use Template API for searches (returns only entity IDs)

## Environment

```bash
$HA_URL    # http://supervisor/core
$HA_TOKEN  # Auto-configured auth token
```

## Control Devices (No Query Needed)

```bash
# Turn on - just do it, don't check state first
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
```

## Find Entities by Area (Token-Efficient)

```bash
# Get entity IDs in area (tiny response!)
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_entities(\"bathroom\") | select(\"match\", \"light.*\") | list }}"}' "$HA_URL/api/template"

# List all areas
curl -sX POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ areas() }}"}' "$HA_URL/api/template"
```

## Get ONE Entity State (When Needed)

```bash
# Single entity only - NEVER bulk fetch
curl -s -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states/sensor.temperature"
```

## Service Domains

| Domain | Services |
|--------|----------|
| light | turn_on, turn_off, toggle |
| switch | turn_on, turn_off, toggle |
| climate | set_temperature, set_hvac_mode |
| cover | open_cover, close_cover, set_cover_position |
| media_player | media_play_pause, volume_set |
| automation | trigger |
| script | turn_on |
| scene | turn_on |
