---
name: homeassistant-addon
description: Control Home Assistant from within an addon. Direct API access via curl and Supervisor API. No SSH needed - full local access to HA services, entities, automations, and templates.
---

# Home Assistant Addon Integration

You are running as a Home Assistant addon with full local API access. Use the pre-configured environment variables for all API calls.

## Environment Variables

```bash
$HA_URL    # http://supervisor/core (local API endpoint)
$HA_TOKEN  # Authentication token (auto-configured)
```

## Quick Reference

### Get Entity State
```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states/light.living_room"
```

### Call Service (turn on/off/toggle)
```bash
# Turn on
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.living_room"}' "$HA_URL/api/services/light/turn_on"

# Turn off
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "switch.coffee_maker"}' "$HA_URL/api/services/switch/turn_off"

# Toggle
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.bedroom"}' "$HA_URL/api/services/light/toggle"

# With brightness
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "light.living_room", "brightness_pct": 50}' "$HA_URL/api/services/light/turn_on"
```

### Template API (Powerful Queries)

The Template API lets you use Jinja2 for complex queries:

```bash
# Get entities in an area
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_entities(\"bathroom\") }}"}' "$HA_URL/api/template"

# List all areas
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ areas() }}"}' "$HA_URL/api/template"

# Get area name from entity
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_name(\"light.living_room\") }}"}' "$HA_URL/api/template"

# Count lights on in area
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{{ area_entities(\"living_room\") | select(\"match\", \"light.*\") | select(\"is_state\", \"on\") | list | count }}"}' "$HA_URL/api/template"

# Get friendly names of entities
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"template": "{% for e in area_entities(\"kitchen\") %}{{ state_attr(e, \"friendly_name\") }}: {{ states(e) }}\n{% endfor %}"}' "$HA_URL/api/template"
```

### Trigger Automation
```bash
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "automation.good_morning"}' "$HA_URL/api/services/automation/trigger"
```

### Run Script
```bash
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "script.movie_time"}' "$HA_URL/api/services/script/turn_on"
```

### Climate Control
```bash
# Set temperature
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "climate.thermostat", "temperature": 22}' "$HA_URL/api/services/climate/set_temperature"

# Set HVAC mode
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "climate.thermostat", "hvac_mode": "heat"}' "$HA_URL/api/services/climate/set_hvac_mode"
```

### Cover/Blind Control
```bash
# Open
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "cover.living_room_blinds"}' "$HA_URL/api/services/cover/open_cover"

# Close
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "cover.living_room_blinds"}' "$HA_URL/api/services/cover/close_cover"

# Set position (0=closed, 100=open)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "cover.living_room_blinds", "position": 50}' "$HA_URL/api/services/cover/set_cover_position"
```

### Media Player
```bash
# Play/Pause
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "media_player.living_room"}' "$HA_URL/api/services/media_player/media_play_pause"

# Set volume (0.0 to 1.0)
curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
  -d '{"entity_id": "media_player.living_room", "volume_level": 0.5}' "$HA_URL/api/services/media_player/volume_set"
```

### List All Entities (use sparingly - large response)
```bash
curl -s -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states" | jq '.[].entity_id'
```

### Search Entities by Domain
```bash
# All lights
curl -s -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states" | jq '[.[] | select(.entity_id | startswith("light."))]'

# All switches that are on
curl -s -H "Authorization: Bearer $HA_TOKEN" "$HA_URL/api/states" | jq '[.[] | select(.entity_id | startswith("switch.")) | select(.state == "on")]'
```

## Common Service Domains

| Domain | Services |
|--------|----------|
| `light` | turn_on, turn_off, toggle |
| `switch` | turn_on, turn_off, toggle |
| `climate` | set_temperature, set_hvac_mode, turn_on, turn_off |
| `cover` | open_cover, close_cover, stop_cover, set_cover_position |
| `media_player` | media_play, media_pause, media_stop, volume_set, volume_up, volume_down |
| `automation` | trigger, turn_on, turn_off, reload |
| `script` | turn_on, reload |
| `scene` | turn_on |
| `fan` | turn_on, turn_off, set_percentage |
| `vacuum` | start, stop, return_to_base, locate |
| `lock` | lock, unlock |

## Best Practices for Voice Control

1. **Search by area first** - Users say "bathroom light" not "light.bathroom_ceiling"
   ```bash
   curl -s -X POST -H "Authorization: Bearer $HA_TOKEN" -H "Content-Type: application/json" \
     -d '{"template": "{{ area_entities(\"bathroom\") | select(\"match\", \"light.*\") | list }}"}' "$HA_URL/api/template"
   ```

2. **Use friendly names** - Match user language to entity friendly_name attribute

3. **Confirm actions** - After calling a service, briefly confirm: "Turned on the bathroom light"

4. **Handle ambiguity** - If multiple matches, ask: "Did you mean the ceiling light or the mirror light?"

5. **Check state before acting** - For toggles, get current state first to give accurate feedback

## Error Handling

- **401 Unauthorized**: Token issue - check $HA_TOKEN is set
- **404 Not Found**: Entity doesn't exist - search for similar names
- **400 Bad Request**: Check service parameters in HA documentation

## Useful Template Functions

| Function | Description |
|----------|-------------|
| `states('entity_id')` | Get state value |
| `state_attr('entity_id', 'attr')` | Get attribute |
| `is_state('entity_id', 'value')` | Check if state equals value |
| `area_entities('area_name')` | List entities in area |
| `area_name('entity_id')` | Get area of entity |
| `areas()` | List all areas |
| `device_entities('device_id')` | List entities of device |
| `integration_entities('integration')` | List entities by integration |
