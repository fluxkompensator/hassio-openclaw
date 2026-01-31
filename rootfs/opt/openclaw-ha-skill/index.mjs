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

export async function getStates() {
  return haFetch('/api/states');
}

export async function getState(entityId) {
  return haFetch(`/api/states/${entityId}`);
}

export async function callService(domain, service, data = {}) {
  return haFetch(`/api/services/${domain}/${service}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function turnOn(entityId) {
  const domain = entityId.split('.')[0];
  return callService(domain, 'turn_on', { entity_id: entityId });
}

export async function turnOff(entityId) {
  const domain = entityId.split('.')[0];
  return callService(domain, 'turn_off', { entity_id: entityId });
}

export async function toggle(entityId) {
  const domain = entityId.split('.')[0];
  return callService(domain, 'toggle', { entity_id: entityId });
}

export async function setLightBrightness(entityId, brightness) {
  return callService('light', 'turn_on', {
    entity_id: entityId,
    brightness: Math.round(brightness * 2.55),
  });
}

export async function setTemperature(entityId, temperature) {
  return callService('climate', 'set_temperature', {
    entity_id: entityId,
    temperature,
  });
}

export async function triggerAutomation(entityId) {
  return callService('automation', 'trigger', { entity_id: entityId });
}

export async function runScript(entityId) {
  return callService('script', 'turn_on', { entity_id: entityId });
}

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

export async function findEntities(query) {
  const devices = await listDevices();
  const lowerQuery = query.toLowerCase();
  return devices.filter(d =>
    d.name.toLowerCase().includes(lowerQuery) ||
    d.entity_id.toLowerCase().includes(lowerQuery)
  );
}

export default {
  name: 'homeassistant',
  description: 'Control Home Assistant devices and automations',
  tools: [
    { name: 'ha_get_states', description: 'Get all entity states from Home Assistant', handler: getStates },
    { name: 'ha_get_state', description: 'Get state of a specific entity', parameters: { entityId: 'string' }, handler: getState },
    { name: 'ha_turn_on', description: 'Turn on a device (light, switch, etc.)', parameters: { entityId: 'string' }, handler: turnOn },
    { name: 'ha_turn_off', description: 'Turn off a device', parameters: { entityId: 'string' }, handler: turnOff },
    { name: 'ha_toggle', description: 'Toggle a device on/off', parameters: { entityId: 'string' }, handler: toggle },
    { name: 'ha_set_brightness', description: 'Set light brightness (0-100)', parameters: { entityId: 'string', brightness: 'number' }, handler: setLightBrightness },
    { name: 'ha_set_temperature', description: 'Set thermostat temperature', parameters: { entityId: 'string', temperature: 'number' }, handler: setTemperature },
    { name: 'ha_trigger_automation', description: 'Trigger an automation', parameters: { entityId: 'string' }, handler: triggerAutomation },
    { name: 'ha_run_script', description: 'Run a Home Assistant script', parameters: { entityId: 'string' }, handler: runScript },
    { name: 'ha_list_devices', description: 'List all devices with friendly names', handler: listDevices },
    { name: 'ha_find_entities', description: 'Search for entities by name', parameters: { query: 'string' }, handler: findEntities },
  ],
};
