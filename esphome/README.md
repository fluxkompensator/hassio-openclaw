# ESPHome Voice Satellite Configurations

ESPHome configurations for creating voice assistant satellites that integrate with OpenClaw via Home Assistant Assist.

## Files

| File | Hardware | Description |
|------|----------|-------------|
| `voice-satellite-s3box.yaml` | ESP32-S3-BOX-3 | Recommended all-in-one solution with display |
| `voice-satellite.yaml` | Custom build | For INMP441 mic + MAX98357 amp setups |
| `secrets.yaml.example` | - | Template for WiFi and API credentials |

## Quick Start

1. Copy your chosen configuration to ESPHome
2. Copy `secrets.yaml.example` to `secrets.yaml` and fill in values
3. Flash the device via USB or OTA
4. Configure Home Assistant Assist pipeline

## Hardware Recommendations

### Best Overall: ESP32-S3-BOX-3 (~$45)
- Built-in microphone, speaker, and display
- Officially supported by Espressif
- Just flash and use

### Budget: M5Stack ATOM Echo (~$13)
- Tiny form factor
- Built-in mic and speaker (lower quality)
- Good for testing

### Best Audio: Custom Build (~$25)
- ESP32-S3 DevKit ($8)
- INMP441 I2S Microphone ($3)
- MAX98357 I2S Amplifier ($3)
- Small speaker ($5)

## Wiring (Custom Build)

### INMP441 Microphone
| INMP441 | ESP32-S3 |
|---------|----------|
| VDD | 3.3V |
| GND | GND |
| SD | GPIO4 |
| WS | GPIO3 |
| SCK | GPIO2 |
| L/R | GND (left channel) |

### MAX98357 Amplifier
| MAX98357 | ESP32-S3 |
|----------|----------|
| VIN | 5V |
| GND | GND |
| DIN | GPIO7 |
| BCLK | GPIO5 |
| LRC | GPIO6 |
| GAIN | Not connected (9dB default) |
