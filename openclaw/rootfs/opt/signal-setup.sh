#!/command/with-contenv bashio
# shellcheck shell=bash
# ==============================================================================
# Signal registration/linking helper for OpenClaw
# ==============================================================================

set -e

SIGNAL_DATA_DIR="/data/openclaw/.signal-cli"
PHONE=$(bashio::config 'signal_phone')

usage() {
    echo "Signal Setup for OpenClaw"
    echo ""
    echo "Usage: signal-setup.sh <command>"
    echo ""
    echo "Commands:"
    echo "  link      Link to existing Signal account (recommended)"
    echo "  register  Register new Signal account (requires captcha)"
    echo "  verify    Verify registration with SMS code"
    echo "  status    Check Signal account status"
    echo "  receive   Test receiving messages"
    echo ""
    echo "Typical setup flow:"
    echo "  1. Run: signal-setup.sh link"
    echo "  2. Scan QR code with Signal app on your phone"
    echo "  3. Verify with: signal-setup.sh status"
    echo ""
}

link_account() {
    if [[ -z "${PHONE}" ]]; then
        bashio::log.error "signal_phone not configured in addon settings"
        exit 1
    fi

    bashio::log.info "Linking Signal account for ${PHONE}..."
    bashio::log.info "A QR code will be displayed. Scan it with your Signal app:"
    bashio::log.info "  Signal app -> Settings -> Linked Devices -> Link New Device"
    echo ""

    signal-cli --config "${SIGNAL_DATA_DIR}" link --name "OpenClaw-HA"

    echo ""
    bashio::log.info "Link complete! Run 'signal-setup.sh status' to verify."
}

register_account() {
    if [[ -z "${PHONE}" ]]; then
        bashio::log.error "signal_phone not configured in addon settings"
        exit 1
    fi

    bashio::log.info "Registering new Signal account for ${PHONE}..."
    bashio::log.warning "You may need to solve a captcha at: https://signalcaptchas.org/registration/generate.html"

    if [[ -n "${1}" ]]; then
        signal-cli --config "${SIGNAL_DATA_DIR}" -a "${PHONE}" register --captcha "${1}"
    else
        signal-cli --config "${SIGNAL_DATA_DIR}" -a "${PHONE}" register
    fi

    bashio::log.info "Check your phone for SMS verification code"
    bashio::log.info "Then run: signal-setup.sh verify <code>"
}

verify_account() {
    if [[ -z "${1}" ]]; then
        bashio::log.error "Usage: signal-setup.sh verify <code>"
        exit 1
    fi

    signal-cli --config "${SIGNAL_DATA_DIR}" -a "${PHONE}" verify "${1}"
    bashio::log.info "Account verified!"
}

check_status() {
    if [[ -z "${PHONE}" ]]; then
        bashio::log.error "signal_phone not configured in addon settings"
        exit 1
    fi

    bashio::log.info "Checking Signal account status..."

    if [[ -d "${SIGNAL_DATA_DIR}/data" ]]; then
        bashio::log.info "Signal data directory exists"
        signal-cli --config "${SIGNAL_DATA_DIR}" -a "${PHONE}" listAccounts 2>/dev/null || true
        signal-cli --config "${SIGNAL_DATA_DIR}" -a "${PHONE}" getUserStatus "${PHONE}" 2>/dev/null || true
    else
        bashio::log.warning "Signal not configured. Run 'signal-setup.sh link' first."
    fi
}

test_receive() {
    if [[ -z "${PHONE}" ]]; then
        bashio::log.error "signal_phone not configured in addon settings"
        exit 1
    fi

    bashio::log.info "Listening for Signal messages (Ctrl+C to stop)..."
    signal-cli --config "${SIGNAL_DATA_DIR}" -a "${PHONE}" receive --timeout 60
}

# Main
case "${1:-}" in
    link)
        link_account
        ;;
    register)
        register_account "${2:-}"
        ;;
    verify)
        verify_account "${2:-}"
        ;;
    status)
        check_status
        ;;
    receive)
        test_receive
        ;;
    *)
        usage
        ;;
esac
