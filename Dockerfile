ARG BUILD_FROM
FROM ${BUILD_FROM}

# Install Node.js 22 and npm
RUN apk add --no-cache \
    nodejs \
    npm \
    git \
    bash

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Install Bashio for addon scripting
ARG BASHIO_VERSION="0.16.2"
RUN curl -L -s "https://github.com/hassio-addons/bashio/archive/v${BASHIO_VERSION}.tar.gz" \
    | tar -xzf - -C /tmp \
    && mv /tmp/bashio-${BASHIO_VERSION}/lib /usr/lib/bashio \
    && ln -s /usr/lib/bashio/bashio /usr/bin/bashio \
    && rm -rf /tmp/bashio-${BASHIO_VERSION}

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
