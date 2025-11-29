# Docker Permanent Fix - Schemaläggare

## ✅ Docker fungerar nu!

Du har lyckats fixa Docker-rättigheterna manuellt. Men detta måste göras permanent så att det fungerar efter omstart.

## Gör fixen permanent med DSM Schemaläggare

### Steg 1: Öppna DSM
1. Öppna webbläsare
2. Gå till: http://REDACTED_SERVER_IP:5000
3. Logga in med admin-konto

### Steg 2: Öppna Schemaläggare
1. Klicka på **Huvudmeny** (de 9 prickarna uppe till vänster)
2. Gå till **Kontrollpanel** → **Schemaläggare**

### Steg 3: Skapa ny uppgift
1. Klicka på **Skapa** → **Utlöst uppgift** → **Användardefinierat skript**

### Steg 4: Konfigurera uppgiften

**Flik: Allmänt**
- **Uppgiftsnamn:** `Fix Docker Permissions`
- **Användare:** `root` (viktigt!)
- **Händelse:** `Boot-up` (vid uppstart)
- **Aktiverad:** ✅ Bocka i

**Flik: Uppgiftsinställningar**
- Bocka i: **Skicka körningsinfo till:**
  - Ange din e-post (valfritt)

**Flik: Schemaläggare**
Inget att ändra här för Boot-up tasks.

**Flik: Användardefinierat skript**

Klistra in detta skript:
```bash
#!/bin/bash

# Vänta på att Docker startar
sleep 15

# Fixa rättigheter på docker.sock
chmod 666 /var/run/docker.sock

# Logga att det är klart
echo "$(date): Docker permissions fixed" >> /tmp/docker-fix.log
```

### Steg 5: Spara
1. Klicka **OK**
2. Du borde nu se uppgiften i listan

### Steg 6: Testa att köra manuellt (valfritt)
1. Högerklicka på uppgiften "Fix Docker Permissions"
2. Välj **Kör**
3. Vänta 5 sekunder
4. Testa i SSH: `docker ps`

### Steg 7: Testa efter omstart (viktigt!)

**När du har tid:**
1. Starta om Synology NAS via DSM
2. Vänta 2-3 minuter efter omstart
3. Logga in via SSH som REDACTED_USERNAME
4. Testa: `docker ps`
5. Om det fungerar - perfekt!

---

## Alternativ: Mer säker lösning med docker-grupp

Om du vill ha en säkrare lösning (rekommenderat för produktion):

### Via SSH som admin:

```bash
ssh admin@REDACTED_SERVER_IP

# Skapa docker-grupp
sudo groupadd -f docker

# Lägg till användare
sudo usermod -aG docker REDACTED_USERNAME

# Ändra ägare på socket
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock

# Logga ut och in igen
exit
```

**Schemaläggare-script för detta:**
```bash
#!/bin/bash
sleep 15
groupadd -f docker
usermod -aG docker REDACTED_USERNAME
chown root:docker /var/run/docker.sock
chmod 660 /var/run/docker.sock
echo "$(date): Docker group permissions fixed" >> /tmp/docker-fix.log
```

---

## Verifiera att permanent fix fungerar

Efter omstart, testa:

```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
docker ps
docker --version
docker run hello-world
```

Om allt fungerar efter omstart = klart! ✅

---

## Nästa steg - Testa dina templates!

Nu när Docker fungerar, testa projekten:

### Test 1: Static nginx
```bash
cd ~/projects/templates/static-nginx
docker-compose up -d
# Öppna: http://REDACTED_SERVER_IP:8080
docker-compose down
```

### Test 2: Python Flask
```bash
cd ~/projects/templates/python-flask
docker-compose up --build
# Öppna: http://REDACTED_SERVER_IP:5000
# Ctrl+C för att stoppa
```

### Test 3: Node.js Express API
```bash
cd ~/projects/templates/nodejs-express
docker-compose up --build
# Öppna: http://REDACTED_SERVER_IP:3001
# Ctrl+C för att stoppa
```

---

## Dokumentera din lösning

Uppdatera CREDENTIALS.md:

```
## Docker Fix
Datum: 2025-11-09
Problem: Permission denied på docker.sock
Lösning: chmod 666 /var/run/docker.sock via admin
Permanent: Schemaläggare boot-up script
Status: ✅ Fungerar
```

---

**Du är nu klar med Docker-setup! 🎉**

Nästa: Skapa ditt första riktiga projekt från en template!
