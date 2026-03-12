ARG BUILD_FROM

FROM ${BUILD_FROM}

# Install Node.js 22 and system dependencies (no Java needed — signal-cli-native is a GraalVM binary)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg wget apt-transport-https \
    && mkdir -p /etc/apt/keyrings \
    # Node.js 22 repository
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    # Install all packages
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs git jq \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install signal-cli with native libsignal (morph027 packages support aarch64+amd64)
ARG SIGNAL_CLI_VERSION=0.14.1
ARG SIGNAL_CLI_NATIVE_VERSION=0.14.1+morph027+1
RUN curl -fsSL https://packaging.gitlab.io/signal-cli/gpg.key | gpg --dearmor -o /usr/share/keyrings/signal-cli-native.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/signal-cli-native.gpg] https://packaging.gitlab.io/signal-cli signalcli main" > /etc/apt/sources.list.d/signal-cli-native.list \
    && apt-get update \
    && cd /tmp \
    && apt-get download signal-cli-native=${SIGNAL_CLI_NATIVE_VERSION} \
    && ar x signal-cli-native_*.deb \
    && tar xf data.tar.* -C / \
    && rm -f /tmp/signal-cli-native_* /tmp/data.tar.* /tmp/control.tar.* /tmp/debian-binary \
    && ln -sf /opt/signal-cli-native/bin/signal-cli /usr/local/bin/signal-cli \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

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

# Install OpenClaw globally (pin version for reproducible builds)
ARG OPENCLAW_VERSION=latest
RUN npm install -g openclaw@${OPENCLAW_VERSION}

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
    io.hass.version="0.5.0"
