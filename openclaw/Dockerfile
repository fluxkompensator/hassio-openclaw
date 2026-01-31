ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js, npm, and build dependencies for native modules
RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    python3 \
    make \
    g++ \
    libx11-dev \
    libxcb-dev

# Install OpenClaw globally (with native module compilation)
RUN npm install -g openclaw@latest

# Copy root filesystem
COPY rootfs /

# Create directories
RUN mkdir -p /data/openclaw /share/openclaw

# Set working directory
WORKDIR /data/openclaw

# Labels
LABEL \
    io.hass.name="OpenClaw" \
    io.hass.description="OpenClaw.ai personal AI assistant" \
    io.hass.type="addon" \
    io.hass.version="0.1.0"
