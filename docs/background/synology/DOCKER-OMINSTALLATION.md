# Docker Ominstallation - Steg för Steg

## Vad du har nu

**Befintliga containers (konfiguration finns):**
- Freescout + Freescout-DB
- kometateam-kometa1
- portainer-ce

**Konfigurations-filer finns i:** `/var/packages/Docker/etc/*.config`

## Varför ominstallation kan hjälpa

När Docker installeras om via DSM Package Center:
1. Behörighetsstrukturen sätts upp på nytt
2. Docker-socket får korrekta rättigheter
3. Användarbehörigheter appliceras korrekt
4. Rensar potentiella konfigurationsproblem

## VIKTIGT innan du börjar

### ⚠️ Detta kommer du att förlora:
- ✅ Alla Docker images (kan laddas ner igen)
- ✅ Körande containers (kan skapas om från config)
- ⚠️ Container-data (BARA om du inte har volumes på /volume1/)
- ❌ Dina projekt-templates (påverkas INTE, ligger i ~/projects/)

### ✅ Detta behålls:
- All din kod i ~/projects/
- Docker-compose.yml filer
- Dockerfiles
- Data i Synology-volymer (/volume1/)

### 📋 Vad du bör göra INNAN:
1. **Dokumentera dina containers** (se nedan)
2. **Backup viktiga container-volymer** (om inte redan på /volume1/)
3. **Spara docker-compose.yml** för alla projekt

## Steg-för-steg Ominstallation

### Steg 1: Dokumentera befintliga containers (VIA DSM GUI)

1. Öppna DSM → **Docker**-applikationen
2. Gå till fliken **Container**
3. För varje container, notera:
   - Namn
   - Image
   - Portar
   - Volymer/Mount points
   - Environment variables (om viktiga)
4. Ta skärmdumpar om du är osäker

**Alternativt:** Dina befintliga containers baseras på config-filer som borde finnas kvar.

---

### Steg 2: Exportera containers (om möjligt via GUI)

Via DSM Docker:
1. Container → Högerklicka → **Export**
2. Spara .json-konfiguration för varje container
3. Kopiera till säker plats

**ELLER** kopiera config-filer:
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
mkdir -p ~/docker-backup
# Du kan inte läsa dessa utan sudo, så skippa detta steg
```

---

### Steg 3: Stoppa Docker-tjänsten

Via DSM:
1. Gå till **Paketcenter**
2. Hitta **Docker**
3. Klicka på **Stoppa** (inte avinstallera än)
4. Vänta tills statusen visar "Stoppad"

---

### Steg 4: Avinstallera Docker

Via DSM:
1. Paketcenter → **Docker**
2. Klicka på **Avinstallera**
3. **VIKTIGT:** När du får frågan om att ta bort data:
   - ✅ **Behåll användardata** (om du vill behålla images/containers)
   - ⚠️ **Ta bort data** (för en "ren" installation - rekommenderat för att fixa behörigheter)

**Rekommendation:** Välj **"Ta bort data"** för en helt ren installation

---

### Steg 5: Rensa Docker-rester (valfritt men rekommenderat)

Om du vill vara helt säker på en ren installation:

```bash
# Via SSH som admin (om du har tillgång)
ssh admin@REDACTED_SERVER_IP

# Kolla om Docker-kataloger finns kvar
ls -la /var/run/ | grep docker
ls -la /volume1/@docker/

# Om de finns, ta bort (ENDAST om du valde "Ta bort data")
sudo rm -rf /var/run/docker*
sudo rm -rf /volume1/@docker/

# Logga ut
exit
```

**OBS:** Gör bara detta om du är bekväm med kommandoraden!

---

### Steg 6: Installera Docker på nytt

Via DSM:
1. Gå till **Paketcenter**
2. Sök efter **Docker**
3. Klicka på **Installera**
4. Vänta tills installationen är klar (kan ta 2-5 minuter)

---

### Steg 7: Konfigurera behörigheter (VIKTIGT - GÖR DIREKT!)

**DIREKT efter installationen, INNAN du testar något:**

1. DSM → **Kontrollpanel** → **Användare & Grupper**
2. Välj användare **REDACTED_USERNAME**
3. Klicka på **Redigera**
4. Gå till fliken **Behörigheter** (eller **Applikationer**)
5. Hitta **Docker** och **bocka i rutan**
6. Klicka **Spara**
7. **VIKTIGT:** Vänta 30 sekunder innan nästa steg

---

### Steg 8: Starta om SSH-session

**För att aktivera nya behörigheter:**

```bash
# Logga ut från nuvarande SSH-session
exit

# Logga in igen
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# Vänta ytterligare 10 sekunder
```

---

### Steg 9: Verifiera att Docker fungerar

```bash
# Testa Docker-åtkomst
docker --version

# Detta borde fungera NU:
docker ps

# Om du får "permission denied" - SE LÖSNINGAR NEDAN
```

**Förväntat resultat:**
```
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
```

Om listan är tom är det PERFEKT - det betyder att Docker fungerar!

---

### Steg 10: Testa med en enkel container

```bash
# Testa med hello-world
docker run hello-world

# Om det fungerar, testa en riktig container
docker run -d -p 8081:80 nginx:alpine

# Testa i webbläsare eller curl
curl http://localhost:8081

# Stoppa och ta bort test-container
docker stop $(docker ps -q)
docker rm $(docker ps -aq)
```

---

### Steg 11: Återskapa dina containers (om du hade några)

**Via DSM GUI:**
1. Öppna Docker-applikationen
2. Gå till **Registry** och sök efter images du behöver
3. Ladda ner images
4. Skapa containers manuellt med samma inställningar som innan

**Via kommandorad (om docker fungerar):**
```bash
# Exempel: Portainer
docker run -d \
  -p 9000:9000 \
  -p 9443:9443 \
  --name portainer \
  --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

---

### Steg 12: Testa dina projekt-templates

```bash
cd ~/projects/templates/static-nginx
docker-compose up -d

# Testa
curl http://localhost:8080

# Stoppa
docker-compose down
```

---

## Om det fortfarande inte fungerar efter ominstallation

### Plan B: Skapa docker-grupp manuellt

```bash
# SSH som admin
ssh admin@REDACTED_SERVER_IP

# Skapa docker-grupp
sudo groupadd -f docker

# Lägg till användare
sudo usermod -aG docker REDACTED_USERNAME

# Ändra ägare på socket
sudo chown root:docker /var/run/docker.sock
sudo chmod 660 /var/run/docker.sock

# Testa från REDACTED_USERNAME
su - REDACTED_USERNAME
docker ps
```

### Plan C: Passwordless sudo

```bash
# Via admin
sudo visudo

# Lägg till:
REDACTED_USERNAME ALL=(ALL) NOPASSWD: /usr/local/bin/docker, /usr/local/bin/docker-compose

# Spara och testa
```

---

## Checklista

Bocka av när du har gjort varje steg:

- [ ] Dokumenterat befintliga containers
- [ ] Stoppat Docker-tjänsten
- [ ] Avinstallerat Docker (valt "Ta bort data")
- [ ] (Valfritt) Rensat Docker-rester via SSH
- [ ] Installerat Docker på nytt
- [ ] **DIREKT** efter installation: Lagt till REDACTED_USERNAME behörighet
- [ ] Väntat 30 sekunder
- [ ] Startat om SSH-session (exit + login igen)
- [ ] Väntat ytterligare 10 sekunder
- [ ] Testat `docker ps` - FUNGERADE DET?
- [ ] Testat `docker run hello-world`
- [ ] Testat en template (static-nginx)

---

## Tidsåtgång

- **Avinstallation:** 2-3 minuter
- **Installation:** 3-5 minuter
- **Konfiguration:** 2 minuter
- **Testning:** 3-5 minuter

**Totalt:** ~15 minuter

---

## Om du behöver hjälp under processen

1. Ta en paus vid varje steg
2. Om något går fel, dokumentera felmeddelandet
3. Du kan alltid installera om Docker igen
4. Dina projekt-templates i ~/projects/ påverkas INTE

---

## Efter lyckad ominstallation

Dokumentera vad som fungerade:

```
Datum: __________
Resultat: [ ] Lyckades [ ] Fungerade inte
Kommentarer:
___________________________________
___________________________________
```

Uppdatera sen `02-DOCKER-SETUP.md` med att problemet är löst!

---

**Redo att börja? Börja med Steg 1!**
