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

# Install OpenClaw globally
RUN npm install -g openclaw@latest

# Copy root filesystem
COPY rootfs /

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
    io.hass.version="0.2.0"
