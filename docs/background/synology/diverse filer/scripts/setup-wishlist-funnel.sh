#!/bin/bash

###############################################################################
# Tailscale Funnel Setup Script - Christmas Wishlist
###############################################################################
# Detta script konfigurerar Tailscale Funnel för att exponera julönskelistan
# publikt på internet via en krypterad Tailscale-tunnel.
#
# KRAV:
# - Tailscale måste vara installerat och aktivt
# - Funnel måste vara aktiverat i Tailscale Admin Console
# - Scriptet måste köras med tillräckliga privilegier (root/sudo)
# - Christmas wishlist måste köra på port 4001
#
# ANVÄNDNING:
# På Synology NAS, kör som root eller med sudo:
#   sudo bash /var/services/homes/REDACTED_USERNAME/scripts/setup-wishlist-funnel.sh
#
# För att stoppa Funnel:
#   sudo bash /var/services/homes/REDACTED_USERNAME/scripts/setup-wishlist-funnel.sh stop
#
###############################################################################

set -e  # Avsluta vid fel

# Färgkoder för utskrift
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Konfiguration
TAILSCALE_BIN="/volume1/@appstore/Tailscale/bin/tailscale"
WISHLIST_PORT=4001
WISHLIST_HOST="localhost"
HTTPS_PORT=443

# Funktioner för utskrift
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kontrollera om Tailscale är installerat
check_tailscale() {
    info "Kontrollerar Tailscale-installation..."

    if [ ! -f "$TAILSCALE_BIN" ]; then
        error "Tailscale hittades inte på: $TAILSCALE_BIN"
        error "Installera Tailscale via Synology Package Center först."
        exit 1
    fi

    info "Tailscale hittad: $($TAILSCALE_BIN version)"
}

# Kontrollera om Tailscale är uppkopplat
check_connection() {
    info "Kontrollerar Tailscale-anslutning..."

    if ! $TAILSCALE_BIN status > /dev/null 2>&1; then
        error "Tailscale är inte uppkopplat."
        error "Logga in med: $TAILSCALE_BIN up"
        exit 1
    fi

    local node_name=$($TAILSCALE_BIN status --json | grep -o '"HostName":"[^"]*"' | cut -d'"' -f4 | head -1)
    info "Ansluten som: $node_name"
}

# Kontrollera om önskelistan körs
check_wishlist() {
    info "Kontrollerar om önskelistan körs på port $WISHLIST_PORT..."

    if ! netstat -tln | grep -q ":$WISHLIST_PORT "; then
        warn "Ingen tjänst körs på port $WISHLIST_PORT"
        warn "Starta önskelistan först med:"
        warn "  cd /var/services/homes/REDACTED_USERNAME/projects/christmas-wishlist"
        warn "  docker-compose up -d"
        exit 1
    fi

    info "Önskelistan körs på port $WISHLIST_PORT"
}

# Testa lokal åtkomst
test_local_access() {
    info "Testar lokal åtkomst till önskelistan..."

    if curl -s -f "http://$WISHLIST_HOST:$WISHLIST_PORT" > /dev/null; then
        info "Önskelistan är tillgänglig lokalt"
    else
        error "Kunde inte nå önskelistan på http://$WISHLIST_HOST:$WISHLIST_PORT"
        exit 1
    fi
}

# Konfigurera Tailscale Serve
setup_serve() {
    info "Konfigurerar Tailscale Serve för port $WISHLIST_PORT..."

    # Stoppa eventuell befintlig konfiguration
    $TAILSCALE_BIN serve reset > /dev/null 2>&1 || true

    # Sätt upp serve i bakgrunden
    if $TAILSCALE_BIN serve --bg --https $HTTPS_PORT "http://$WISHLIST_HOST:$WISHLIST_PORT"; then
        info "Tailscale Serve konfigurerat"
    else
        error "Kunde inte konfigurera Tailscale Serve"
        exit 1
    fi
}

# Aktivera Funnel
enable_funnel() {
    info "Aktiverar Tailscale Funnel för publik åtkomst..."

    # Försök aktivera funnel
    if $TAILSCALE_BIN funnel --bg $HTTPS_PORT 2>&1 | tee /tmp/funnel_output.log; then
        info "Tailscale Funnel aktiverat!"
    else
        local output=$(cat /tmp/funnel_output.log)

        if echo "$output" | grep -q "not enabled on your tailnet"; then
            error "Funnel är inte aktiverat i Tailscale Admin Console"
            error ""
            error "Aktivera Funnel genom att:"
            error "1. Besök: https://login.tailscale.com/admin/machines"
            error "2. Välj din enhet (mittemellan)"
            error "3. Aktivera 'Funnel' i inställningarna"
            error ""
            error "Eller besök direkt länk:"
            echo "$output" | grep -o "https://login.tailscale.com/[^ ]*" || true
            exit 1
        else
            error "Okänt fel vid aktivering av Funnel:"
            error "$output"
            exit 1
        fi
    fi

    rm -f /tmp/funnel_output.log
}

# Visa status och publik URL
show_status() {
    info "Hämtar Funnel-status..."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    $TAILSCALE_BIN funnel status

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Extrahera URL från status
    local funnel_url=$($TAILSCALE_BIN funnel status 2>/dev/null | grep -o "https://[^ ]*" | head -1)

    if [ -n "$funnel_url" ]; then
        info "🎄 Önskelistan är nu publikt tillgänglig på:"
        echo ""
        echo -e "  ${GREEN}${funnel_url}${NC}"
        echo ""
        info "Dela denna länk med vem som helst!"
    else
        warn "Kunde inte extrahera publik URL automatiskt."
        warn "Kör 'tailscale funnel status' för att se URL:en."
    fi
}

# Stoppa Funnel och Serve
stop_funnel() {
    info "Stoppar Tailscale Funnel och Serve..."

    $TAILSCALE_BIN serve reset

    info "Funnel och Serve har stoppats"
    info "Önskelistan är inte längre tillgänglig publikt"
}

# Huvudfunktion
main() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║     Tailscale Funnel Setup - Christmas Wishlist 🎄         ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo ""

    # Kontrollera om vi ska stoppa
    if [ "$1" == "stop" ]; then
        stop_funnel
        exit 0
    fi

    # Kör alla kontroller
    check_tailscale
    check_connection
    check_wishlist
    test_local_access

    echo ""
    info "Alla kontroller godkända! Sätter upp Funnel..."
    echo ""

    # Konfigurera Serve och Funnel
    setup_serve
    enable_funnel

    echo ""
    info "Setup komplett!"
    echo ""

    # Visa status och URL
    show_status

    echo ""
    info "Tips:"
    echo "  - För att stoppa: sudo $0 stop"
    echo "  - För att se status: $TAILSCALE_BIN funnel status"
    echo "  - För att se loggar: $TAILSCALE_BIN debug daemon-logs"
    echo ""
}

# Kör huvudfunktionen
main "$@"
