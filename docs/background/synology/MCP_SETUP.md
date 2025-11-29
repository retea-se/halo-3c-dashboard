# MCP Setup (Workspace)

Den här guiden beskriver hur MCP‑servrarna i det här workspace:et konfigureras och körs. Konfigurationen ligger i `mcp.json` på rot‑nivå och kan användas av MCP‑kompatibla klienter som stödjer workspace‑konfig (t.ex. många CLI/IDE‑integrationer). Om din klient inte läser `mcp.json` per workspace, kopiera relevanta block till klientens användarkonfiguration.

## Översikt

Aktiva servrar i `mcp.json`:
- `chrome-devtools` – Browserdebugg/automation via Chrome DevTools MCP (npx)
- `github` – Officiell GitHub MCP (remote HTTP)
- `homey` – Homey MCP (remote HTTP, lokalt exponerad)
- `sequential-thinking` – För strukturerad problemlösning (npx)
- `docker` – Docker MCP (tredjepart, via SSH till Synology)
- `postgres` – Postgres MCP (tredjepart, valfri – använd bara om databas finns)
- `fetch` – Enkel HTTP‑tester (tredjepart)

Se filen `mcp.json:1` för exakt konfiguration.

## Förutsättningar per server

### Chrome DevTools MCP
- Kräver: Node.js 20+, Chrome installerad.
- Startas via npx: `chrome-devtools-mcp@latest`.
- Windows‑tips: En del klienter kräver cmd‑wrap och högre timeout. Exempel (i klientens egen config):
  - command: `cmd`
  - args: `["/c","npx","-y","chrome-devtools-mcp@latest"]`
  - startup_timeout_ms: `20000`

### GitHub MCP (remote HTTP)
- URL: `https://api.githubcopilot.com/mcp/`
- Autentisering: Beroende på klient.
  - OAuth (om klient stöder det) eller
  - PAT (Personal Access Token). Vissa klienter kan definiera `headers.Authorization` eller inputs.
- Exempel med PAT i klienter som stödjer headers/inputs:
  ```json
  {
    "mcpServers": {
      "github": {
        "type": "http",
        "url": "https://api.githubcopilot.com/mcp/",
        "headers": { "Authorization": "Bearer ${input:github_mcp_pat}" }
      }
    },
    "inputs": [
      { "type": "promptString", "id": "github_mcp_pat", "description": "GitHub PAT", "password": true }
    ]
  }
  ```

### Homey MCP (remote HTTP)
- URL i `mcp.json`: `http://localhost:8765/`
- Kräver att servern körs lokalt eller via port‑forward.
- Snabbstart med Docker (kräver `HOMEY_TOKEN`):
  ```bash
  docker run --rm -e HOMEY_TOKEN=xxxxx -p 8765:8765 ghcr.io/maerestijnde/mcp-homey:latest
  ```
- Alternativ: Se även projektdokumentationen i `projects/homey/docs/INTEGRATIONS_HOMEY.md`.

### Docker MCP (tredjepart)
- Paket: `@thelord/mcp-server-docker-npx` (via npx).
- Konfigurerad med `DOCKER_HOST=ssh://REDACTED_USERNAME@REDACTED_SERVER_IP` för att nå Docker på Synology över SSH.
- Krav:
  - Publik nyckel måste vara upplagd på Synology‑kontot (`REDACTED_USERNAME`).
  - Testa anslutning: `ssh REDACTED_USERNAME@REDACTED_SERVER_IP`.
  - Testa Docker över SSH lokalt: `docker -H ssh://REDACTED_USERNAME@REDACTED_SERVER_IP info`.
  - Om SSH inte stöds av servern i din miljö, exponera Docker‑daemon via TCP/TLS eller kör MCP‑servern nära daemonen.

### Postgres MCP (tredjepart, valfri)
- Paket: `@henkey/postgres-mcp-server` (via npx).
- Använd endast om Postgres faktiskt körs (andra projekt). `projects/homey/compose.yaml` använder SQLite som default.
- Exempel‑DSN i `mcp.json`: `postgresql://appuser:apppass123@REDACTED_SERVER_IP:5433/appdb`.
- Rekommendationer:
  - Använd hemligheter/inputs i klienten istället för att hårdkoda lösenord i repo.
  - Verifiera nätverksåtkomst och port (5433 i exemplet).

### Fetch MCP (tredjepart)
- Paket: `mcp-fetch-server` (npx). Enkel HTTP‑test.
- Alternativ: Chrome DevTools MCP ger rikare nätverksinsikter (requests, headers, loggar, screenshots, tracing).

## Testa och felsök

### MCP Inspector
- Installera och kör: `npx -y @modelcontextprotocol/inspector`
- Peka Inspector mot lokala servrar (t.ex. Homey STDIO/HTTP) för snabb validering.

### Vanliga kontroller
- GitHub: verifiera OAuth/PAT i din klient.
- Homey: `HOMEY_TOKEN` måste vara giltig; kontrolleras av servern vid start.
- Docker: `ssh` fungerar och kontot har Docker‑åtkomst.
- Postgres: DSN korrekt, port nåbar, rätt behörigheter.

## Klientspecifikt
- VS Code Copilot/Chat: kan använda `.vscode/mcp.json` eller användarinställningar; kopiera block från `mcp.json` om nödvändigt.
- Claude Desktop: använder `claude_desktop_config.json` i användarprofilen; kopiera relevanta `mcpServers` och inputs/headers.

Behöver du en klientspecifik variant? Säg till vilken klient du använder så lägger vi till rätt exempel.

