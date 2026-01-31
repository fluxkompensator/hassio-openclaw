# OpenClaw Home Assistant Addon

Control your smart home with natural language using [OpenClaw.ai](https://openclaw.ai) - an AI-powered home automation assistant.

## Features

- **Web UI Access** - Access the OpenClaw interface directly from your Home Assistant sidebar
- **Device Control** - Control all your Home Assistant devices using natural language commands
- **Voice Integration** - Integrate with Home Assistant's voice assistants for hands-free control
- **Signal Voice Messages** - Send voice messages via Signal for mobile access with E2E encryption

## Configuration

### Required Settings

| Option | Description |
|--------|-------------|
| `anthropic_api_key` | Your Anthropic API key for Claude AI access |

### Optional Settings

| Option | Default | Description |
|--------|---------|-------------|
| `log_level` | `info` | Logging verbosity: `debug`, `info`, `warning`, `error` |
| `signal_enabled` | `false` | Enable Signal voice message support |
| `signal_phone` | | Your Signal phone number (e.g., +15551234567) |
| `voice_transcription` | `none` | Voice transcription engine: `sherpa-onnx`, `whisper`, or `none` |

## Getting Your Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up for an account or log in
3. Navigate to **API Keys** in the dashboard
4. Click **Create Key**
5. Copy the generated key and paste it into the addon configuration

> **Note:** Keep your API key secure and never share it publicly.

## Signal Voice Messages (Mobile Access)

Control your home from anywhere using Signal voice messages with end-to-end encryption.

### Setup

1. **Configure the addon:**
   - Set `signal_enabled` to `true`
   - Set `signal_phone` to your phone number (e.g., `+15551234567`)
   - Optionally set `voice_transcription` to `sherpa-onnx` or `whisper`

2. **Link your Signal account (Web UI - Recommended):**
   - Open the Signal Setup page: `http://homeassistant.local:18790`
   - Click **Generate QR Code**
   - Open Signal on your phone → **Settings** → **Linked Devices** → **Link New Device**
   - Scan the QR code displayed in the browser

   **Alternative (SSH):**
   ```bash
   docker exec -it $(docker ps -qf "name=openclaw") /opt/signal-setup.sh link
   ```

3. **Test it:**
   - Send a voice message to your linked Signal number
   - OpenClaw will transcribe and respond

### Signal Setup Web UI

Access the Signal setup interface at `http://homeassistant.local:18790` to:
- Generate QR codes for linking
- Check account status
- Re-link if needed

### Signal Setup Commands (SSH)

| Command | Description |
|---------|-------------|
| `/opt/signal-setup.sh link` | Link to existing Signal account |
| `/opt/signal-setup.sh status` | Check Signal account status |
| `/opt/signal-setup.sh receive` | Test receiving messages |

## Voice Integration Setup (Home Assistant Voice)

To use voice commands with OpenClaw via Home Assistant's built-in voice pipeline, follow these steps:

### Step 1: Add REST Command

Add the following to your `configuration.yaml` file:

```yaml
rest_command:
  openclaw_chat:
    url: "http://localhost:8080/api/chat"
    method: POST
    headers:
      Content-Type: "application/json"
    payload: '{"message": "{{ message }}"}'
    timeout: 30
```

### Step 2: Create an Intent Script

Add an intent script to handle voice commands:

```yaml
intent_script:
  OpenClawIntent:
    speech:
      text: "Processing your request"
    action:
      - service: rest_command.openclaw_chat
        data:
          message: "{{ query }}"
```

### Step 3: Restart Home Assistant

After making these changes, restart Home Assistant for the configuration to take effect:

1. Go to **Settings** > **System** > **Restart**
2. Or use the Developer Tools to call the `homeassistant.restart` service

## Home Assistant Control

OpenClaw understands natural language commands. Here are some examples:

- "Turn on the living room lights"
- "Set the thermostat to 72 degrees"
- "Lock all the doors"
- "What's the temperature in the bedroom?"
- "Turn off all lights except the kitchen"
- "Dim the bedroom lights to 50%"
- "Is the garage door open?"
- "Start the robot vacuum"

## Troubleshooting

### Addon Won't Start

- **Check your API key** - Ensure your Anthropic API key is correctly entered in the addon configuration
- **View the logs** - Go to the addon's Log tab to see detailed error messages
- **Verify network access** - The addon requires internet access to communicate with Anthropic's API

### Can't Control Devices

- **Check entity permissions** - Ensure the devices you want to control are not hidden or disabled in Home Assistant
- **Verify device names** - Try using the exact entity names as shown in Home Assistant
- **Review the logs** - Set `log_level` to `debug` for more detailed information

### Voice Commands Not Working

- **Verify REST command** - Check that the `rest_command.openclaw_chat` service exists in Developer Tools > Services
- **Test the intent** - Use Developer Tools to manually trigger the intent script
- **Check addon status** - Ensure the OpenClaw addon is running and accessible at the configured port

## Support

- [OpenClaw Documentation](https://openclaw.ai/docs)
- [GitHub Repository](https://github.com/openclaw/openclaw)
- [Home Assistant Community Forum](https://community.home-assistant.io/)
