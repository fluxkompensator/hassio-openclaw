ARG BUILD_FROM

# Get signal-cli with native libs from multi-arch image
FROM bbernhard/signal-cli-rest-api:latest AS signal-cli-source

FROM ${BUILD_FROM}

# Install Node.js 22 from NodeSource
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Java 21 runtime for signal-cli (from Adoptium/Temurin)
RUN apt-get update && apt-get install -y --no-install-recommends wget apt-transport-https \
    && mkdir -p /etc/apt/keyrings \
    && wget -qO - https://packages.adoptium.net/artifactory/api/gpg/key/public | gpg --dearmor -o /etc/apt/keyrings/adoptium.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/adoptium.gpg] https://packages.adoptium.net/artifactory/deb $(. /etc/os-release && echo $VERSION_CODENAME) main" > /etc/apt/sources.list.d/adoptium.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends temurin-21-jre \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy signal-cli from multi-arch image (has ARM64 native libs)
COPY --from=signal-cli-source /opt/signal-cli-* /opt/signal-cli/
RUN ln -s /opt/signal-cli/bin/signal-cli /usr/local/bin/signal-cli

# Install ffmpeg for audio conversion (AAC -> WAV) and sherpa-onnx for transcription
ARG SHERPA_VERSION=1.12.20
RUN apt-get update && apt-get install -y --no-install-recommends bzip2 ffmpeg \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && ARCH=$(uname -m) \
    && if [ "$ARCH" = "x86_64" ]; then \
         SHERPA_FILE="sherpa-onnx-v${SHERPA_VERSION}-linux-x64-shared.tar.bz2"; \
       elif [ "$ARCH" = "aarch64" ]; then \
         SHERPA_FILE="sherpa-onnx-v${SHERPA_VERSION}-linux-aarch64-shared-cpu.tar.bz2"; \
       else \
         echo "Unsupported architecture: $ARCH" && exit 1; \
       fi \
    && curl -fSL -o /tmp/sherpa-onnx.tar.bz2 \
       "https://github.com/k2-fsa/sherpa-onnx/releases/download/v${SHERPA_VERSION}/${SHERPA_FILE}" \
    && tar xjf /tmp/sherpa-onnx.tar.bz2 -C /opt \
    && rm /tmp/sherpa-onnx.tar.bz2 \
    && for f in /opt/sherpa-onnx-*/bin/sherpa-onnx-offline; do ln -sf "$f" /usr/local/bin/sherpa-onnx-offline; done

# Download whisper small multilingual model (best accuracy for German, English, etc.)
# tiny=75MB (poor), base=150MB (good), small=500MB (best)
RUN curl -fSL -o /tmp/whisper-model.tar.bz2 \
       "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2" \
    && tar xjf /tmp/whisper-model.tar.bz2 -C /opt \
    && rm /tmp/whisper-model.tar.bz2

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Install ha-mcp MCP server for Home Assistant integration
RUN npm install -g @anthropic-ai/ha-mcp || npm install -g ha-mcp

# Copy root filesystem
COPY rootfs /

# Make scripts executable and apply audio patch
RUN chmod +x /usr/local/bin/transcribe-audio /usr/local/bin/patch-openclaw-audio \
    && /usr/local/bin/patch-openclaw-audio

# Install Signal setup web UI dependencies
RUN cd /opt/signal-setup-web && npm install --omit=dev

# Create directories
RUN mkdir -p /data/openclaw /share/openclaw

# Set working directory
WORKDIR /data/openclaw

# Labels
LABEL \
    io.hass.name="OpenClaw" \
    io.hass.description="OpenClaw.ai personal AI assistant" \
    io.hass.type="addon" \
    io.hass.version="0.2.33"
