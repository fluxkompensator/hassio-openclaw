ARG BUILD_FROM
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

# Install Java runtime for signal-cli
RUN apt-get update && apt-get install -y --no-install-recommends \
    openjdk-17-jre-headless \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install signal-cli
ARG SIGNAL_CLI_VERSION=0.13.4
RUN curl -L -o /tmp/signal-cli.tar.gz \
    "https://github.com/AsamK/signal-cli/releases/download/v${SIGNAL_CLI_VERSION}/signal-cli-${SIGNAL_CLI_VERSION}.tar.gz" \
    && tar xf /tmp/signal-cli.tar.gz -C /opt \
    && ln -s /opt/signal-cli-${SIGNAL_CLI_VERSION}/bin/signal-cli /usr/local/bin/signal-cli \
    && rm /tmp/signal-cli.tar.gz

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
