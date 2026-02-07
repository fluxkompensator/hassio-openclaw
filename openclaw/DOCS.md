# OpenClaw Home Assistant Addon

Control your smart home with natural language using [OpenClaw.ai](https://openclaw.ai) - an AI-powered home automation assistant.

## Features

- **Web UI Access** - Access the OpenClaw interface directly from your Home Assistant sidebar
- **Device Control** - Control all your Home Assistant devices using natural language commands
- **Voice Integration** - Integrate with Home Assistant's voice assistants for hands-free control
- **Signal Voice Messages** - Send voice messages via Signal for mobile access with E2E encryption

## Configuration

### Authentication (Choose One)

| Option | Description |
|--------|-------------|
| `anthropic_api_key` | Anthropic API key from console.anthropic.com |
| `claude_oauth_credentials` | OAuth credentials JSON from `claude setup-token` |

### Optional Settings

| Option | Default | Description |
|--------|---------|-------------|
| `log_level` | `info` | Logging verbosity: `debug`, `info`, `warning`, `error` |
| `signal_enabled` | `false` | Enable Signal voice message support |
| `signal_phone` | | Your Signal phone number (e.g., +15551234567) |
| `signal_allowed_numbers` | `[]` | Phone numbers allowed to message the bot (E.164 format, e.g. `["+15551234567"]`) |
| `voice_transcription` | `none` | Voice transcription engine: `sherpa-onnx`, `whisper`, or `none` |

## Authentication Setup

### Option 1: OAuth Credentials (Recommended)

OAuth credentials provide automatic token refresh and better rate limits.

1. **On your local machine**, install Claude CLI and authenticate:
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude setup-token
   ```

2. **Copy the credentials JSON:**
   ```bash
   cat ~/.claude/.credentials.json
   ```

3. **In Home Assistant:** Settings → Add-ons → OpenClaw → Configuration

4. **Paste the entire JSON** into the `claude_oauth_credentials` field

5. **Save and restart** the addon

### Option 2: API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up for an account or log in
3. Navigate to **API Keys** in the dashboard
4. Click **Create Key**
5. Copy the generated key and paste it into `anthropic_api_key`

> **Note:** Keep your credentials secure and never share them publicly.

## Signal Voice Messages (Mobile Access)

Control your home from anywhere using Signal voice messages with end-to-end encryption.

### Setup

1. **Configure the addon:**
   - Set `signal_enabled` to `true`
   - Set `signal_phone` to your phone number (e.g., `+15551234567`)
   - Add allowed phone numbers to `signal_allowed_numbers` in E.164 format (e.g., `["+15551234567"]`). Only numbers in this list can message the bot. If left empty, all incoming messages are blocked.
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

## ESPHome Voice Satellite Integration

Create a physical voice assistant device that connects to OpenClaw via Home Assistant Assist.

**Flow**: Wake Word -> STT (local) -> OpenClaw/Claude -> TTS (Edge) -> Speaker

### Hardware Options

| Option | Price | Notes |
|--------|-------|-------|
| **ESP32-S3-BOX-3** | ~$45 | Recommended - all-in-one with mic, speaker, display |
| M5Stack ATOM Echo | ~$13 | Budget - tiny, lower audio quality |
| Custom Build | ~$25 | Best audio - ESP32-S3 + INMP441 + MAX98357 |

### Quick Start (ESP32-S3-BOX-3)

1. **Install ESPHome addon** in Home Assistant
2. **Create new device** using the provided configuration:
   - Copy `esphome/voice-satellite-s3box.yaml` to your ESPHome config
   - Create `secrets.yaml` from the example template
3. **Flash the device** via USB
4. **Configure Assist pipeline** in Home Assistant:
   - Settings -> Voice Assistants -> Add Assistant
   - Set conversation agent to OpenClaw

### Custom Build Setup

For custom hardware (ESP32-S3 + INMP441 + MAX98357):

1. Use `esphome/voice-satellite.yaml` configuration
2. Adjust GPIO pins to match your wiring:
   ```yaml
   # Microphone (INMP441)
   i2s_lrclk_pin: GPIO3   # WS
   i2s_bclk_pin: GPIO2    # SCK
   i2s_din_pin: GPIO4     # SD

   # Speaker (MAX98357)
   i2s_lrclk_pin: GPIO6   # WS
   i2s_bclk_pin: GPIO5    # BCLK
   i2s_dout_pin: GPIO7    # DIN
   ```

### OpenClaw Conversation Agent

The addon includes a custom Home Assistant component that registers OpenClaw as a conversation agent. To install:

1. **Copy the component** to your HA config:
   ```bash
   cp -r /homeassistant/custom_components/openclaw_agent \
         /config/custom_components/
   ```

2. **Add to configuration.yaml**:
   ```yaml
   openclaw_agent:
     url: "http://localhost:18789/api/chat"
     token: !secret openclaw_token
   ```

3. **Add to secrets.yaml**:
   ```yaml
   openclaw_token: "your-gateway-token-from-addon-logs"
   ```

4. **Restart Home Assistant**

5. **Configure Assist pipeline**:
   - Settings -> Voice Assistants -> Add Assistant
   - Select "OpenClaw" as the conversation agent
   - Choose your preferred STT engine (Whisper, Sherpa-ONNX)
   - TTS is handled by OpenClaw (Edge TTS)

### Wake Words

Available wake words:
- "Hey Jarvis" (built into HA)
- "OK Nabu" (HA custom)
- Custom - train your own with openWakeWord

### Testing

1. **Test the API**:
   ```bash
   curl -X POST http://localhost:18789/api/chat \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"message": "Hello"}'
   ```

2. **Test conversation agent**:
   - HA -> Developer Tools -> Services
   - Call `conversation.process` with text input

3. **Test voice satellite**:
   - Say wake word
   - LED lights up
   - Speak your command
   - Hear the response

### LED Status Indicators

| Color | Meaning |
|-------|---------|
| Green pulse | Wake word detected |
| Blue | Listening |
| Yellow pulse | Processing |
| Purple | Speaking response |
| Red | Error |
| Orange pulse | Disconnected |

## Support

- [OpenClaw Documentation](https://openclaw.ai/docs)
- [GitHub Repository](https://github.com/openclaw/openclaw)
- [Home Assistant Community Forum](https://community.home-assistant.io/)
