# Fullstack Demo - Node.js + PostgreSQL

Komplett guide för fullstack-projekt med Docker networking, volymer och utvecklingsworkflow.

## Översikt

**Vad vi bygger:**
- Node.js Express API (port 4000)
- PostgreSQL databas (ENDAST intern åtkomst via Docker-nätverk)
- Docker-nätverk för säker kommunikation
- Volymer för persistent data och kodredigering

**Arkitektur:**
```
┌─────────────────┐
│   Din Dator     │
│   (VS Code)     │
└────────┬────────┘
         │ SSH/Remote-SSH
         ↓
┌────────────────────────────────────────┐
│         Synology NAS (Mittemellan)     │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │  Docker Network: app-network     │ │
│  │                                  │ │
│  │  ┌─────────────┐  ┌───────────┐ │ │
│  │  │   app:4000  │←→│ db:5432   │ │ │
│  │  │  (Node.js)  │  │(PostgreSQL│ │ │
│  │  └──────┬──────┘  └─────┬─────┘ │ │
│  │         │                │       │ │
│  └─────────┼────────────────┼───────┘ │
│            │                │         │
│       ┌────▼────┐      ┌───▼───┐     │
│       │ ~/code  │      │pg-data│     │
│       │(volym)  │      │(volym)│     │
│       └─────────┘      └───────┘     │
└────────────────────────────────────────┘
         │
         ↓ Exponerat
    http://REDACTED_SERVER_IP:4000
```

## Projektstruktur

```
~/projects/fullstack-demo/
├── docker-compose.yml      # Orkestre ring
├── Dockerfile              # Node.js container
├── package.json            # NPM dependencies
├── .gitignore             # Git ignore
├── README.md              # Dokumentation
├── src/                   # Appkod (VOLYM-MAPPAD)
│   └── server.js          # Express server
└── db-init/               # Databas init-scripts
    └── 01-schema.sql      # Skapa tabeller
```

## Steg 1: Projektfiler

Alla filer finns redan skapade i:
`~/projects/fullstack-demo/`

### Filer som saknas (skapa dessa):

**db-init/01-schema.sql** - Databas-schema:
```sql
-- Skapa users-tabell
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lägg till test-data
INSERT INTO users (name, email) VALUES
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Smith', 'bob@example.com'),
  ('Charlie Brown', 'charlie@example.com')
ON CONFLICT DO NOTHING;
```

**.gitignore:**
```
node_modules/
*.log
.env
.DS_Store
```

**README.md:**
```markdown
# Fullstack Demo

Node.js + PostgreSQL fullstack application.

## Start
\`\`\`bash
docker-compose up --build
\`\`\`

## API
- http://REDACTED_SERVER_IP:4000
- http://REDACTED_SERVER_IP:4000/health
- http://REDACTED_SERVER_IP:4000/users
```

## Steg 2: Skapa saknade filer

```bash
# SSH till servern
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
cd ~/projects/fullstack-demo

# Skapa databas init-script
cat > db-init/01-schema.sql << 'EOF'
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email) VALUES
  ('Alice Johnson', 'alice@example.com'),
  ('Bob Smith', 'bob@example.com'),
  ('Charlie Brown', 'charlie@example.com')
ON CONFLICT DO NOTHING;
EOF

# Skapa .gitignore
cat > .gitignore << 'EOF'
node_modules/
*.log
.env
.DS_Store
EOF

# Skapa README
cat > README.md << 'EOF'
# Fullstack Demo

## Start
docker-compose up --build

## Endpoints
- http://REDACTED_SERVER_IP:4000
- http://REDACTED_SERVER_IP:4000/health
- http://REDACTED_SERVER_IP:4000/users
EOF
```

## Steg 3: Starta projektet

```bash
cd ~/projects/fullstack-demo

# Starta alla containers
docker-compose up --build

# Eller i bakgrunden:
docker-compose up -d --build

# Följ loggar:
docker-compose logs -f
```

**Första gången tar det 2-3 minuter** (laddar ner images, bygger, startar db).

## Steg 4: Testa API:et

### Via curl i SSH:
```bash
# Health check
curl http://localhost:4000/health

# Lista users
curl http://localhost:4000/users

# Skapa ny user
curl -X POST http://localhost:4000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"David Lee","email":"david@example.com"}'
```

### Via webbläsare:
- http://REDACTED_SERVER_IP:4000
- http://REDACTED_SERVER_IP:4000/health
- http://REDACTED_SERVER_IP:4000/users

## Utvecklingsworkflow

### Metod 1: VS Code Remote-SSH (REKOMMENDERAT)

Detta är det bästa sättet - du redigerar kod direkt på servern med full VS Code-funktionalitet!

**Setup:**
1. Installera "Remote - SSH" extension i VS Code
2. Anslut till Mittemellan (F1 → "Remote-SSH: Connect to Host")
3. Öppna mapp: `/var/services/homes/REDACTED_USERNAME/projects/fullstack-demo`
4. Redigera `src/server.js` direkt i VS Code
5. Spara - nodemon startar om servern automatiskt!
6. Testa i webbläsare

**Fördelar:**
- ✅ Hot reload fungerar perfekt
- ✅ IntelliSense och autocomplete
- ✅ Integrated terminal
- ✅ Git integration
- ✅ Debugging support
- ✅ Alla VS Code extensions fungerar

### Metod 2: Git push/pull workflow

Om du föredrar att utveckla lokalt:

```bash
# På servern - initiera git
cd ~/projects/fullstack-demo
git init
git add .
git commit -m "Initial commit"

# Skapa GitHub repo och koppla
git remote add origin https://github.com/dittnamn/fullstack-demo.git
git push -u origin main

# På din lokala dator - klona
git clone https://github.com/dittnamn/fullstack-demo.git
cd fullstack-demo

# Utveckla lokalt
# ... redigera filer ...
git add .
git commit -m "Add feature"
git push

# På servern - pull och restart
ssh REDACTED_USERNAME@REDACTED_SERVER_IP
cd ~/projects/fullstack-demo
git pull
docker-compose restart app
```

### Metod 3: Direkt volymmappning (ej rekommenderat för Windows)

Windows-mappning till Synology kan vara långsamt och komplicerat.

## Docker-nätverk förklaring

### Hur fungerar det?

**docker-compose.yml definierar:**
```yaml
networks:
  app-network:
    driver: bridge
```

**Båda containers kopplas till nätverket:**
- `app` kan nå `db` via hostname `db`
- `db` kan nå `app` via hostname `app`
- **INGEN annan** kan nå `db` (inte ens från host!)

### Databas-anslutning i kod:

```javascript
const pool = new Pool({
  host: 'db',  // Service-namnet från docker-compose!
  port: 5432,
  user: 'appuser',
  password: 'apppass123',
  database: 'appdb',
});
```

### Testa nätverket:

```bash
# Logga in i app-container
docker exec -it fullstack-app sh

# Testa anslutning till databas
ping db
nc -zv db 5432

# Testa från host (borde INTE fungera)
nc -zv localhost 5432  # Connection refused = BRA!
```

## Volymer förklaring

### Kod-volym (~/projects/fullstack-demo/src → /app/src)

**Varför?**
- Redigera kod på host-system
- Ändringar syns direkt i container
- Nodemon startar om vid ändringar

**I docker-compose.yml:**
```yaml
volumes:
  - ./src:/app/src
  - /app/node_modules  # Exkludera node_modules!
```

### Databas-volym (postgres-data)

**Varför?**
- Data överlever container-omstart
- Data överlever `docker-compose down`
- Data backas upp med Synology

**I docker-compose.yml:**
```yaml
volumes:
  postgres-data:
    driver: local

services:
  db:
    volumes:
      - postgres-data:/var/lib/postgresql/data
```

### Hantera volymer:

```bash
# Lista volymer
docker volume ls

# Inspektera volym
docker volume inspect fullstack-demo_postgres-data

# Ta bort volym (VARNING: Raderar data!)
docker-compose down -v

# Backup databas
docker exec fullstack-db pg_dump -U appuser appdb > backup.sql

# Återställ databas
cat backup.sql | docker exec -i fullstack-db psql -U appuser appdb
```

## Hantera projektet

### Vanliga kommandon:

```bash
# Starta
docker-compose up -d

# Stoppa
docker-compose down

# Restart bara app (efter kodändring)
docker-compose restart app

# Rebuild efter Dockerfile-ändring
docker-compose up -d --build

# Visa loggar
docker-compose logs -f app
docker-compose logs -f db

# Lista containers
docker-compose ps

# Kör kommando i container
docker-compose exec app sh
docker-compose exec db psql -U appuser appdb
```

### Databas-kommandon:

```bash
# Öppna psql i databas
docker-compose exec db psql -U appuser appdb

# I psql:
\dt              # Lista tabeller
\d users         # Beskriv tabell
SELECT * FROM users;
\q              # Avsluta
```

## Säkerhet

### Vad är säkert:

✅ Databas INTE åtkomlig utifrån (ingen port-exponering)
✅ Databas BARA åtkomlig via app-container på app-network
✅ Lösenord i environment variables (ej hårdkodade)

### För produktion:

⚠️ Använd secrets/environment-filer:
```bash
# .env-fil (lägg till i .gitignore!)
DB_USER=appuser
DB_PASSWORD=strongpassword123
DB_NAME=appdb
```

```yaml
# docker-compose.yml
services:
  app:
    env_file:
      - .env
```

⚠️ Använd Docker secrets för känslig data
⚠️ Sätt upp reverse proxy (nginx) med HTTPS
⚠️ Begränsa container-resurser

## Felsökning

### Databas ansluter inte:

```bash
# Kolla att db är healthy
docker-compose ps

# Kolla db-loggar
docker-compose logs db

# Testa manuellt
docker-compose exec db psql -U appuser appdb -c "SELECT 1"
```

### Hot reload fungerar inte:

- Använd VS Code Remote-SSH (inte lokal mappning)
- Kontrollera att `./src` är mappad i docker-compose.yml
- Kontrollera att nodemon är installerat

### Port redan används:

```bash
# Ändra port i docker-compose.yml
ports:
  - "4001:4000"  # Ändra till 4001 eller annan ledig port
```

## Nästa steg

1. ✅ Lägg till fler API-endpoints
2. ✅ Skapa frontend (React/Vue)
3. ✅ Lägg till authentication
4. ✅ Lägg till fler databas-tabeller
5. ✅ Sätt upp automated tests
6. ✅ CI/CD med GitHub Actions

---

**Skapad:** 2025-11-09
**Port:** 4000
**Databas:** PostgreSQL 15 (intern via Docker-nätverk)
**Utveckling:** VS Code Remote-SSH (rekommenderat)
