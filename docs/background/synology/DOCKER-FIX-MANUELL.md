# Docker-fix - Manuell lösning

## Problemet
Docker-socket har fel rättigheter efter ominstallation. DSM visar inte Docker under användarbehörigheter.

## Admin-konto aktiverat
**Användarnamn:** admin
**Lösenord:** ^5$_RfC-OeS>Ikhwk*V.

## Lösning: Fixa manuellt via SSH

### Metod 1: Via Windows Command Prompt (REKOMMENDERAT)

**Steg 1 - Öppna Command Prompt:**
1. Tryck `Windows + R`
2. Skriv `cmd`
3. Tryck Enter

**Steg 2 - Logga in som admin:**
```cmd
ssh admin@REDACTED_SERVER_IP
```
Ange lösenord: `^5$_RfC-OeS>Ikhwk*V.`

**Steg 3 - Kör dessa kommandon:**
```bash
sudo chmod 666 /var/run/docker.sock
```
Ange lösenord igen när det frågar: `^5$_RfC-OeS>Ikhwk*V.`

**Steg 4 - Verifiera:**
```bash
ls -la /var/run/docker.sock
```
Ska visa: `srw-rw-rw- 1 root root ...`

**Steg 5 - Logga ut:**
```bash
exit
```

**Steg 6 - Testa med REDACTED_USERNAME:**
```cmd
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
```
Ange lösenord: `REDACTED_PASSWORD`

```bash
docker ps
```
**Detta borde nu fungera!**

---

### Metod 2: Via PowerShell

**Steg 1 - Öppna PowerShell:**
1. Tryck `Windows + X`
2. Välj "Windows PowerShell"

**Steg 2 - Samma kommandon som ovan:**
```powershell
ssh admin@REDACTED_SERVER_IP
sudo chmod 666 /var/run/docker.sock
exit
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
docker ps
```

---

### Metod 3: Via PuTTY (om du har det installerat)

1. Öppna PuTTY
2. Host: `REDACTED_SERVER_IP`
3. Port: `22`
4. Klicka "Open"
5. Login as: `admin`
6. Password: `^5$_RfC-OeS>Ikhwk*V.`
7. Kör: `sudo chmod 666 /var/run/docker.sock`
8. Ange lösenord igen
9. Stäng PuTTY
10. Öppna ny PuTTY-session som `REDACTED_USERNAME`
11. Testa: `docker ps`

---

### Metod 4: Gör det permanent med ett startup-script

Efter att Metod 1 fungerar, gör det permanent:

**Via DSM GUI:**
1. Öppna DSM
2. Gå till **Kontrollpanel** → **Schemaläggare**
3. Klicka **Skapa** → **Utlöst uppgift** → **Användardefinierat skript**
4. Allmänt:
   - Uppgiftsnamn: `Fix Docker Permissions`
   - Användare: `root`
   - Händelse: `Boot-up`
5. Schemaläggare → Aktivera
6. Skript:
   ```bash
   #!/bin/bash
   sleep 10
   chmod 666 /var/run/docker.sock
   ```
7. Spara

Nu kommer Docker-rättigheter fixas automatiskt vid varje omstart!

---

## Alternativ lösning: Skapa docker-grupp

Om chmod 666 känns för öppet, skapa en docker-grupp:

**Via admin SSH (Command Prompt/PowerShell):**

```bash
ssh admin@REDACTED_SERVER_IP

# Skapa docker-grupp
sudo groupadd -f docker

# Lägg till användare i gruppen
sudo usermod -aG docker REDACTED_USERNAME

# Ändra ägare på socket
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock

# Logga ut
exit
```

**Testa:**
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
docker ps
```

Om det inte fungerar direkt, logga ut och in igen.

---

## Snabb-fix (kör detta nu)

**Öppna Windows Command Prompt och kör:**

```cmd
ssh admin@REDACTED_SERVER_IP "sudo chmod 666 /var/run/docker.sock"
```

När det frågar om lösenord, ange: `^5$_RfC-OeS>Ikhwk*V.`

**Sedan testa:**
```cmd
ssh REDACTED_USERNAME@REDACTED_SERVER_IP "docker ps"
```

---

## Felsökning

**Problem:** "sudo: no tty present and no askpass program specified"
**Lösning:** Du måste vara interaktivt inloggad, inte köra kommandot direkt

**Problem:** "Permission denied" fortfarande
**Lösning:**
1. Dubbelkolla att chmod kördes: `ssh admin@REDACTED_SERVER_IP "ls -la /var/run/docker.sock"`
2. Logga ut och in igen som REDACTED_USERNAME
3. Vänta 10 sekunder efter login innan du testar docker

**Problem:** Fungerar efter omstart men slutar fungera
**Lösning:** Använd Metod 4 (Startup-script) för att göra det permanent

---

## Verifiera att det fungerar

När det fungerar ska du se:

```bash
$ docker ps
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES

$ docker --version
Docker version 20.10.3, build 55f0773

$ docker run hello-world
Hello from Docker!
...
```

---

## Updatera credentials.md

När det fungerar, lägg till i CREDENTIALS.md:

```
## Docker Fix Applied
Datum: [DATUM]
Metod: chmod 666 /var/run/docker.sock
Permanent: [JA/NEJ - startup script]
```

---

**Prova Metod 1 först!** Använd Windows Command Prompt, inte Git Bash.
