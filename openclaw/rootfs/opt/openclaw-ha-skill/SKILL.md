---
name: homeassistant
description: Control Home Assistant devices, lights, switches, climate, and automations.
metadata: { "openclaw": { "emoji": "🏠" } }
---

# Home Assistant

Control your smart home through Home Assistant. This skill provides direct access to the HA API.

## Available Tools

### Device Control
- `ha_turn_on(entityId)` - Turn on a device (light, switch, fan, etc.)
- `ha_turn_off(entityId)` - Turn off a device
- `ha_toggle(entityId)` - Toggle a device on/off

### Light Control
- `ha_set_brightness(entityId, brightness)` - Set light brightness (0-100%)

### Climate Control
- `ha_set_temperature(entityId, temperature)` - Set thermostat target temperature

### Automations & Scripts
- `ha_trigger_automation(entityId)` - Trigger an automation manually
- `ha_run_script(entityId)` - Execute a Home Assistant script

### State Queries
- `ha_get_state(entityId)` - Get current state of a specific entity
- `ha_get_states()` - Get all entity states (use sparingly - large response)
- `ha_list_devices()` - List all devices with friendly names (use sparingly)
- `ha_find_entities(query)` - Search entities by name or ID

## Entity ID Format

Entity IDs follow the pattern `domain.name`:
- `light.living_room` - Lights
- `switch.kitchen_outlet` - Switches
- `climate.thermostat` - Thermostats
- `cover.garage_door` - Covers/blinds
- `automation.morning_routine` - Automations
- `script.goodnight` - Scripts

## Usage Tips

1. **Prefer specific queries** - Use `ha_get_state` with known entity_id instead of `ha_get_states`
2. **Direct control** - Go directly to `ha_turn_on`/`ha_turn_off` when you know the entity_id
3. **Search first** - Use `ha_find_entities("kitchen")` to find entities by name
4. **Avoid list_devices** - Only call when user explicitly asks "what devices do I have?"
