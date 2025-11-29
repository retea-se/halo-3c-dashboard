# Docker Permission Problem - Lösningar

## Problemet

Din användare `REDACTED_USERNAME` har:
- ✅ Administrators-grupp
- ✅ Alla applikationsbehörigheter i DSM
- ❌ Kan INTE köra Docker-kommandon

**Orsak:** På Synology DSM 7.x finns det ett känt problem där Docker-socket (`/var/run/docker.sock`) ägs av `root:root` och GUI-inställningarna för Docker-behörigheter inte alltid appliceras korrekt på SSH-användare.

## Verifierat

```bash
# Din användare är i administrators
id
# uid=1029(REDACTED_USERNAME) gid=100(users) groups=100(users),101(administrators),1023(http)

# Docker socket ägs av root
ls -la /var/run/docker.sock
# srw-rw---- 1 root root 0 Nov  8 04:07 /var/run/docker.sock

# Inget docker-grupp finns på Synology
cat /etc/group | grep docker
# (tom output)
```

## Lösningar

### Lösning 1: Använd DSM Docker GUI (Enklast)

**För:** Perfekt för enklare projekt och lärande
**Mot:** Ingen kommandorad, begränsat CI/CD

**Hur:**
1. Öppna DSM → **Docker**-applikationen
2. Hantera containers under fliken **Container**
3. Importera images under **Image**
4. Konfigurera networks och volumes grafiskt

**Fungerar med templates:**
Du kan fortfarande skapa `docker-compose.yml`-filer och sedan importera dem via DSM GUI.

---

### Lösning 2: SSH som Admin-användare

**För:** Fungerar direkt
**Mot:** Mindre säkert, inga separata användarbehörigheter

Om du har ett admin-konto (t.ex. `admin` eller `mittemellan` som visas i administrators-gruppen):

```bash
# Logga in som admin istället
ssh admin@REDACTED_SERVER_IP

# Testa Docker
docker ps
```

**Om detta fungerar:**
Använd detta konto för Docker-utveckling, eller kör VS Code Remote-SSH med admin-kontot.

---

### Lösning 3: Manuell Socket-rättighet (Kräver root/admin)

**För:** Fungerar direkt på kommandorad
**Mot:** Måste göras om vid varje Docker-omstart

**Via admin-konto eller sudo:**

```bash
# Logga in som admin
ssh admin@REDACTED_SERVER_IP

# Ändra rättigheter på socket
sudo chmod 666 /var/run/docker.sock

# Verifiera
ls -la /var/run/docker.sock
# srw-rw-rw- 1 root root 0 Nov  8 04:07 /var/run/docker.sock

# Nu kan REDACTED_USERNAME köra docker
```

**Permanent lösning:**
Skapa ett uppstartsskript i DSM → Kontrollpanel → Schemaläggare:
```bash
chmod 666 /var/run/docker.sock
```

---

### Lösning 4: Docker via Sudo

**För:** Enkel workaround
**Mot:** Kräver lösenord varje gång, eller passwordless sudo-konfiguration

**Setup passwordless sudo för docker (kräver root-åtkomst):**

1. Logga in som admin
2. Redigera sudoers:
```bash
sudo visudo
```

3. Lägg till följande rad:
```
REDACTED_USERNAME ALL=(ALL) NOPASSWD: /usr/local/bin/docker, /usr/local/bin/docker-compose
```

4. Spara och avsluta (`:wq` i vi)

5. Testa från REDACTED_USERNAME:
```bash
sudo docker ps  # Borde fungera utan lösenord
```

6. Skapa alias i `~/.bashrc`:
```bash
echo 'alias docker="sudo docker"' >> ~/.bashrc
echo 'alias docker-compose="sudo docker-compose"' >> ~/.bashrc
source ~/.bashrc
```

Nu kan du köra `docker ps` som vanligt (går via sudo automatiskt).

---

### Lösning 5: Docker-grupp manuellt (Avancerat)

**För:** Mest "korrekt" lösning enligt Linux-standard
**Mot:** Kräver root och kan brytas vid DSM-uppdatering

**Steg (som admin/root):**

```bash
# 1. Skapa docker-grupp
sudo groupadd docker

# 2. Lägg till användare i gruppen
sudo usermod -aG docker REDACTED_USERNAME

# 3. Ändra ägare på docker.sock
sudo chown root:docker /var/run/docker.sock

# 4. Logga ut och in igen
exit
ssh REDACTED_USERNAME@REDACTED_SERVER_IP

# 5. Verifiera
docker ps
```

**Problem:** Synology kan återställa detta vid omstart eller DSM-uppdatering.

---

## Rekommendation

Baserat på din situation:

### Om du har tillgång till admin-kontot:
**→ Använd Lösning 3 (Manuell socket-rättighet)**

Detta är snabbast och enklast:
1. SSH som admin
2. Kör `sudo chmod 666 /var/run/docker.sock`
3. Lägg till i Schemaläggare för att göra permanent
4. Fortsätt använda REDACTED_USERNAME för utveckling

### Om du inte vill hantera rättigheter:
**→ Använd Lösning 1 (DSM Docker GUI)**

Eller utveckla lokalt på Windows med Docker Desktop och deployer färdiga containers till servern.

### För bästa utvecklingsupplevelse:
**→ Kombinera Lösning 3 + Lösning 4**
- Fixa socket-rättigheter
- Konfigurera passwordless sudo
- Använd VS Code Remote-SSH med REDACTED_USERNAME

---

## Testa lösningarna

### Efter Lösning 3 (socket-rättigheter):
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
docker ps
docker --version
cd ~/projects/templates/static-nginx
docker-compose up -d
curl http://localhost:8080
docker-compose down
```

### Med DSM GUI (Lösning 1):
1. Öppna DSM Docker-app
2. Gå till Container → Skapa
3. Importera `~/projects/templates/static-nginx/docker-compose.yml`
4. Starta container
5. Öppna http://REDACTED_SERVER_IP:8080

---

## Dokumentera vilken lösning du valde

När du har valt och implementerat en lösning, uppdatera denna fil med:
- ✅ Vilken lösning du använde
- ✅ Datum
- ✅ Eventuella problem och fixar

---

**Nästa steg:** Välj en lösning ovan och testa!
