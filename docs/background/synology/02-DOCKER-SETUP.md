# Docker-setup på Mittemellan

## Status

Docker är installerat på servern via DSM Package Center.

**Version:** 20.10.3
**Plats:** `/usr/local/bin/docker` → `/var/packages/Docker/target/usr/bin/docker`
**Docker Compose:** `/usr/local/bin/docker-compose`

## Problem: Rättigheter

Din användare `REDACTED_USERNAME` kan för närvarande inte köra Docker-kommandon utan sudo.

**Fel du får:**
```
permission denied while trying to connect to the Docker daemon socket
```

## Lösning 1: Via DSM GUI (REKOMMENDERAT)

### Steg för steg:
1. Öppna DSM: http://REDACTED_SERVER_IP:5000
2. Logga in med admin-konto
3. Gå till **Kontrollpanel** → **Användare & Grupper**
4. Välj användaren `REDACTED_USERNAME`
5. Klicka på **Redigera**
6. Under fliken **Behörigheter** eller **Applikationer**:
   - Bocka i **Docker** för att ge användaren Docker-behörigheter
7. Klicka **Spara**
8. **Logga ut och in igen** via SSH för att aktivera ändringarna

### Verifiera att det fungerar:
```bash
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
docker --version
docker ps
docker-compose --version
```

Om du inte får "permission denied" är du klar!

## Lösning 2: Använd DSM Docker GUI

Om du inte behöver kommandorad kan du använda DSM:s grafiska Docker-gränssnitt:

1. Öppna **Docker**-paketet från DSM huvudmeny
2. Hantera containers, images, och networks grafiskt
3. Bra för enklare projekt och administration

## Lösning 3: Docker-alias med sudo (Temporärt)

⚠️ **Bara om du har sudo-rättigheter:**

```bash
# Lägg till i ~/.bashrc
echo 'alias docker="sudo /usr/local/bin/docker"' >> ~/.bashrc
echo 'alias docker-compose="sudo /usr/local/bin/docker-compose"' >> ~/.bashrc
source ~/.bashrc
```

**OBS:** Detta kräver att du anger lösenord varje gång.

## Testkommandon

När Docker-rättigheter är fixade, testa med:

### Grundläggande Docker
```bash
# Visa Docker-information
docker --version
docker info

# Lista containers
docker ps
docker ps -a

# Lista images
docker images
```

### Testa med en enkel container
```bash
# Kör hello-world
docker run hello-world

# Kör enkel nginx
docker run -d -p 8081:80 nginx:alpine
curl http://localhost:8081
docker stop $(docker ps -q)
```

### Docker Compose-test
```bash
# Gå till en template
cd ~/projects/templates/static-nginx

# Starta med Docker Compose
docker-compose up -d

# Kontrollera att det fungerar
curl http://localhost:8080
docker-compose ps

# Stoppa
docker-compose down
```

## Grundläggande Docker-kommandon

### Container-hantering
```bash
# Starta container
docker-compose up              # Förgrund
docker-compose up -d           # Bakgrund

# Stoppa containers
docker-compose down            # Stoppa och ta bort
docker-compose stop            # Bara stoppa

# Visa loggar
docker-compose logs
docker-compose logs -f         # Följ loggar live

# Lista containers
docker-compose ps
docker ps
```

### Image-hantering
```bash
# Bygg image
docker-compose build
docker build -t myapp .

# Lista images
docker images

# Ta bort image
docker rmi image-name
```

### Rensa upp
```bash
# Ta bort stoppade containers
docker container prune

# Ta bort oanvända images
docker image prune

# Ta bort allt oanvänt
docker system prune -a
```

## Docker Compose-filer

Alla templates har färdiga `docker-compose.yml`-filer:

### Exempel: Static nginx
```yaml
version: '3.8'

services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html:ro
```

### Exempel: Python Flask
```yaml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "5000:5000"
    volumes:
      - ./app:/app/app
    environment:
      - FLASK_APP=app
      - FLASK_ENV=development
```

## Port-översikt

Håll koll på använda portar:

| Service | Port | Template | Status |
|---------|------|----------|--------|
| Static nginx | 8080 | static-nginx | Template |
| React dev | 3000 | nodejs-react | Template |
| Express API | 3001 | nodejs-express | Template |
| Flask app | 5000 | python-flask | Template |
| DSM | 5000 | System | Aktiv |
| Test webserver | 8080 | Aktiv (Python) | Kan stängas |

## Felsökning

### "Permission denied"
**Orsak:** Användaren har inte Docker-rättigheter
**Fix:** Följ Lösning 1 ovan (DSM GUI)

### "Port already in use"
**Orsak:** Porten används redan av annan tjänst
**Fix:** Ändra port i `docker-compose.yml`:
```yaml
ports:
  - "8081:80"  # Ändra från 8080 till 8081
```

### "Cannot connect to Docker daemon"
**Orsak:** Docker-tjänsten körs inte
**Fix:** Starta Docker via DSM → Paketcenter → Docker → Kör

### Container startar men kraschar
**Fix:** Visa loggar:
```bash
docker-compose logs
docker logs container-name
```

## Best Practices

1. **Använd docker-compose** för alla projekt
2. **Versionshantera** docker-compose.yml och Dockerfile
3. **Rensa regelbundet** med `docker system prune`
4. **Begränsa resurser** i docker-compose.yml för stora projekt:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

## Säkerhet

⚠️ **För utveckling i lokalt nätverk (192.168.x.x):**
- Nuvarande setup är OK

⚠️ **För exponering till internet:**
- Använd reverse proxy (nginx/Traefik)
- Aktivera HTTPS med Let's Encrypt
- Sätt upp firewall
- Använd environment-variabler för secrets (inte hårdkodade)

## Nästa steg

1. ✅ **Fixa Docker-rättigheter** (se Lösning 1)
2. ✅ **Testa med en template** (t.ex. static-nginx)
3. ✅ **Skapa ditt första projekt**

---

**Dokumentation uppdaterad:** 2025-11-09
