# SSH-anslutning till Mittemellan

## Serverinformation

**Servernamn:** Mittemellan
**IP-adress:** REDACTED_SERVER_IP
**SSH-port:** 22

**Enheter:**
- DS2188: REDACTED_SERVER_IP
- DS218play: REDACTED_DS218_IP

## SSH-användare

**Användarnamn:** REDACTED_USERNAME
**Lösenord:** REDACTED_PASSWORD
**Hemkatalog:** /var/services/homes/REDACTED_USERNAME

## Snabbanslutning

### Med lösenord
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP -p 22
```

### Med SSH-nyckel (om konfigurerad)
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
```

## VS Code Remote-SSH

### SSH Config
Lägg till i `~/.ssh/config`:

```
Host Mittemellan
    HostName REDACTED_SERVER_IP
    User REDACTED_USERNAME
    IdentityFile ~/.ssh/id_rsa
    Port 22
```

### Anslut i VS Code
1. Öppna VS Code
2. Tryck F1 eller Ctrl+Shift+P
3. Skriv "Remote-SSH: Connect to Host"
4. Välj "Mittemellan"

## SSH-nyckelautentisering (valfritt)

### 1. Generera SSH-nyckel på din dator
```bash
ssh-keygen -t rsa -b 2048 -C "REDACTED_USERNAME@REDACTED_SERVER_IP"
```

### 2. Kopiera publik nyckel till servern
```bash
# Logga in med lösenord första gången
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# På servern:
cd /var/services/homes/REDACTED_USERNAME
mkdir -p .ssh
chmod 700 .ssh
vi .ssh/authorized_keys  # Klistra in innehållet från ~/.ssh/id_rsa.pub
chmod 600 .ssh/authorized_keys
```

### 3. Testa anslutning utan lösenord
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
```

## Viktiga sökvägar på servern

- **Hemkatalog:** `/var/services/homes/REDACTED_USERNAME/` eller `~/`
- **Projektkatalog:** `~/projects/`
- **Webbserver (test):** `~/webserver/`
- **Templates:** `~/projects/templates/`

## DSM Web-gränssnitt

**URL:** http://REDACTED_SERVER_IP:5000
**Alternativ:** http://REDACTED_DS218_IP:5000 (DS218play)

Logga in med dina DSM-admin-uppgifter.

## Felsökning

**Problem:** "Connection refused"
**Lösning:** Kontrollera att SSH-tjänsten är aktiverad i DSM → Kontrollpanel → Terminal & SNMP

**Problem:** "Permission denied (publickey)"
**Lösning:** Kontrollera rättigheter på .ssh-mappen (700) och authorized_keys (600)

**Problem:** Timeout
**Lösning:** Kontrollera IP-adress och nätverksanslutning

## Användarrättigheter

Din användare `REDACTED_USERNAME` är medlem i:
- **users** (standard)
- **administrators** (admin-rättigheter)

Detta ger dig tillgång till:
- SSH
- Docker (efter konfiguration)
- Alla systeminställningar
