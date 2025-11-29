# Tailscale Funnel POC - Önskelista

## Sammanfattning

Detta dokument beskriver en POC (Proof of Concept) för att exponera julönskelistan publikt via Tailscale Funnel.

## Status: ✅ Genomförbar med automation-script

### Vad som fungerade ✅

1. **Tailscale är installerat och aktivt**
   - Tailscale körs på Synology NAS via appstore-paketet
   - Binary finns i: `/volume1/@appstore/Tailscale/bin/tailscale`
   - Nätverket är aktivt och ansluter enheter:
     - `mittemellan` (Synology): 100.94.213.121
     - `mackanspc` (Windows): 100.125.146.86

2. **Önskelistan identifierad och verifierad**
   - Applikation: `/var/services/homes/REDACTED_USERNAME/projects/christmas-wishlist`
   - Körs via Docker Compose
   - Exponerad på port: **4001**
   - Verifierad fungerande via `http://localhost:4001`

3. **Tailscale Funnel-arkitektur förstådd**
   - Funnel skapar en krypterad tunnel från internet till lokal tjänst
   - Genererar unik URL: `https://<node-name>.<tailnet-name>.ts.net`
   - End-to-end krypterad via relay-servrar
   - Döljer enhetens IP-adress från internet

### Begränsningar som upptäcktes 🚧

1. **Administratörsrättigheter krävs**
   ```bash
   # Följande kommando kräver root/admin-access:
   /volume1/@appstore/Tailscale/bin/tailscale serve --bg --https 443 http://localhost:4001

   # Fel: "Access denied: watch IPN bus access denied"
   ```
   - SSH-användaren `REDACTED_USERNAME` har inte tillräckliga privilegier
   - Sudo kräver lösenord interaktivt (fungerar inte över SSH utan terminal)

2. **Funnel måste aktiveras i Tailscale Admin Console**
   ```
   Serve is not enabled on your tailnet.
   To enable, visit:
   https://login.tailscale.com/f/serve?node=nmSYZYvzF921CNTRL
   ```
   - Detta är ett engångssteget som måste göras manuellt via webbgränssnittet

3. **Tailscale API-begränsningar**
   - Client ID och Secret finns tillgängliga
   - API Access Token finns och fungerar för att läsa enheter
   - API kan användas för monitoring, MEN:
     - Funnel/Serve-konfiguration finns inte i public API
     - Kan inte direkt konfigurera funnel programmatiskt från CLI utan admin-access
     - CLI är det primära verktyget för Funnel-konfiguration

4. **Automation-script skapade**
   - Bash-script för körning direkt på Synology: `scripts/setup-wishlist-funnel.sh`
   - PowerShell-script för Windows-användare: `scripts/setup-wishlist-funnel.ps1`
   - Båda hanterar alla kontroller och konfiguration automatiskt

## Snabbstart med Automation-Script 🚀

### Alternativ 1: Från Windows (Rekommenderat)

```powershell
# Navigera till script-mappen
cd C:\Users\marcu\OneDrive\Dokument\_synology_1\scripts

# Aktivera Funnel
.\setup-wishlist-funnel.ps1

# Visa status
.\setup-wishlist-funnel.ps1 -Status

# Stoppa Funnel
.\setup-wishlist-funnel.ps1 -Stop
```

### Alternativ 2: Direkt på Synology

```bash
# SSH in på Synology
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22

# Kopiera scriptet till Synology (från Windows)
scp scripts/setup-wishlist-funnel.sh REDACTED_USERNAME@REDACTED_SERVER_IP:/var/services/homes/REDACTED_USERNAME/

# Kör på Synology med sudo
sudo bash setup-wishlist-funnel.sh

# Stoppa Funnel
sudo bash setup-wishlist-funnel.sh stop
```

**OBS:** Första gången måste du aktivera Funnel i Tailscale Admin Console. Scriptet kommer guida dig.

## Manuell lösning (Steg-för-steg)

Om du föredrar att göra det manuellt, följ dessa steg:

### Steg 1: Aktivera Funnel i Admin Console
1. Logga in på https://login.tailscale.com med ditt GitHub-konto (retea-se)
2. Besök: https://login.tailscale.com/f/serve?node=nmSYZYvzF921CNTRL
3. Aktivera "Funnel" för noden `mittemellan`

### Steg 2: SSH in som root/admin
```bash
# SSH in med en användare som har sudo-rättigheter
ssh admin@REDACTED_SERVER_IP -p 22

# Eller använd DSM Web Terminal som admin
```

### Steg 3: Konfigurera Tailscale Serve + Funnel
```bash
# Sätt upp serve för att exponera port 4001 på HTTPS
/volume1/@appstore/Tailscale/bin/tailscale serve --bg --https 443 http://localhost:4001

# Aktivera funnel för att göra det publikt tillgängligt
/volume1/@appstore/Tailscale/bin/tailscale funnel --bg 443
```

### Steg 4: Hämta publik URL
```bash
# Visa funnel-status och URL
/volume1/@appstore/Tailscale/bin/tailscale funnel status
```

Förväntad URL-format:
```
https://mittemellan.retea-se-github.ts.net
```

## Alternativa lösningar

### 1. Använd DSM Web Terminal
- Logga in på DSM (http://REDACTED_DS218_IP:5000)
- Öppna Control Panel → Terminal & SNMP
- Aktivera SSH
- Använd terminalen som admin-användare

### 2. Konfigurera sudoers för REDACTED_USERNAME
```bash
# Som admin, lägg till i /etc/sudoers.d/REDACTED_USERNAME:
REDACTED_USERNAME ALL=(ALL) NOPASSWD: /volume1/@appstore/Tailscale/bin/tailscale
```

### 3. Använd Tailscale Admin Console UI
- Besök https://login.tailscale.com/admin/machines
- Välj `mittemellan`
- Använd "Edit route settings" för att konfigurera Funnel via UI

### 4. Använd Port Forwarding via Router (mindre säkert)
- Öppna port 4001 i routern
- Forwarda till REDACTED_SERVER_IP:4001
- Konfigurera DynDNS för dynamisk IP

## Tailscale API - Vad fungerar och inte fungerar

### ✅ Vad som fungerar med API

API Access Token är konfigurerad och fungerar för:

```bash
# Lista alla enheter i tailnet
curl -H "Authorization: Bearer tskey-api-kghQPm77T111CNTRL-..." \
  https://api.tailscale.com/api/v2/tailnet/retea-se.github/devices

# Resultat:
# - mittemellan (Synology): 100.94.213.121
# - mackanspc (Windows): 100.125.146.86
```

**API kan användas för:**
- Läsa enheter och deras status
- Hantera ACLs (Access Control Lists)
- Hantera DNS-inställningar
- Läsa användare och nyckel-expirations
- Device posture checks

### ❌ Vad som INTE fungerar med API

**Funnel/Serve-konfiguration finns inte i public API:**
- Det finns ingen API endpoint för att aktivera/konfigurera Funnel
- Ingen API för att hantera Serve-konfiguration
- Ingen programmatisk åtkomst till Funnel-status

**Därför:**
- CLI är det enda sättet att konfigurera Funnel
- Admin-rättigheter krävs på enheten
- Web UI kan användas för att aktivera Funnel första gången

### 🔮 Framtida API-möjligheter

Om Tailscale skulle lägga till Funnel-endpoints i API:et skulle det möjliggöra:

```javascript
// Hypotetiskt exempel (fungerar ej i nuläget)
const response = await fetch('https://api.tailscale.com/api/v2/device/mittemellan/funnel', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer tskey-api-...' },
  body: JSON.stringify({
    enabled: true,
    port: 443,
    target: 'http://localhost:4001'
  })
});
```

Men detta är inte tillgängligt i nuvarande API-version.

## Säkerhetsöverväganden

### Fördelar med Tailscale Funnel:
- ✅ End-to-end kryptering (TLS)
- ✅ Automatiska SSL-certifikat (Let's Encrypt)
- ✅ Ingen IP-exponering av servern
- ✅ Inbyggd DDoS-skydd via relay-servrar
- ✅ Revocerbar åtkomst (kan stängas av omedelbart)

### Nackdelar:
- ⚠️ Offentligt tillgänglig (vem som helst med URL:en kan besöka)
- ⚠️ Ingen autentisering på applikationsnivå
- ⚠️ Ingen rate-limiting (om inte implementerat i appen)

### Rekommendationer:
1. Lägg till basic auth i önskelistan
2. Implementera rate-limiting
3. Monitora åtkomstloggar
4. Använd Tailscale ACLs för att begränsa vem som kan aktivera Funnel

## Nästa steg

1. **Omedelbart:**
   - Logga in på Tailscale Admin Console
   - Aktivera Funnel för `mittemellan`
   - SSH in som admin och kör serve/funnel-kommandon

2. **Kort sikt:**
   - Lägg till autentisering i önskelistan
   - Implementera session-hantering
   - Sätt upp monitoring/logging

3. **Lång sikt:**
   - Utforska Tailscale Enterprise för API-automation
   - Implementera CI/CD för automatisk deployment
   - Sätt upp backup-lösning för databasen

## Resurser

- Tailscale Funnel Docs: https://tailscale.com/kb/1223/funnel
- Tailscale API: https://tailscale.com/api
- Tailscale CLI: https://tailscale.com/kb/1080/cli
- Install Guide: https://tailscale.com/kb/1017/install

## Författare

- **Datum:** 2025-11-10
- **Av:** Claude Code POC
- **Tailnet:** retea-se.github (REDACTED_TAILNET_ID)
