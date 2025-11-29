# Chrome DevTools MCP - Installation och Konfiguration

## Översikt

Chrome DevTools MCP möjliggör avancerad felsökning, prestandaanalys och automatisering av webbläsare direkt via Model Context Protocol (MCP).

## Förutsättningar

- **Node.js** version 20.19 eller senare (verifierat: v22.17.0)
- **Google Chrome** installerad
- **npm** installerat

## Installation

Chrome DevTools MCP är redan konfigurerat i projektet via `mcp.json` och `.vscode/mcp.json`.

### Konfigurationsfiler

1. **`mcp.json`** (projektrot) - för workspace-konfiguration
2. **`.vscode/mcp.json`** - för VS Code/Cursor

Båda filerna innehåller (med headless-läge för bättre stabilitet):
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "-y",
        "chrome-devtools-mcp@latest",
        "--headless=true",
        "--isolated=true"
      ],
      "startup_timeout_ms": 30000
    }
  }
}
```

**Headless-läge**: Chrome körs utan grafiskt gränssnitt, vilket är mer stabilt och lämpar sig för automatisering.

## Windows-specifik konfiguration

För vissa MCP-klienter på Windows kan det krävas en `cmd`-wrapper. Om standardkonfigurationen inte fungerar, prova:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "chrome-devtools-mcp@latest"],
      "startup_timeout_ms": 20000
    }
  }
}
```

## Verifiera installation

### 1. Testa att paketet kan köras

```powershell
npx -y chrome-devtools-mcp@latest --version
```

Förväntat resultat: `0.10.2` (eller senare version)

### 2. Testa via MCP Inspector

```powershell
npx -y @modelcontextprotocol/inspector
```

### 3. Testa i Cursor/VS Code

1. Starta om Cursor/VS Code för att ladda MCP-konfigurationen
2. Öppna MCP-panelen och verifiera att `chrome-devtools` är tillgänglig
3. Testa med en enkel prompt:
   ```
   Navigera till https://example.com och ta en screenshot
   ```

## Användning

### Grundläggande funktioner

Chrome DevTools MCP stödjer:

- **Navigation**: Navigera till webbplatser
- **Screenshots**: Ta skärmdumpar av sidor
- **Network monitoring**: Övervaka nätverksrequests
- **Console logs**: Läsa console-meddelanden
- **Performance tracing**: Analysera prestanda
- **Element interaction**: Klicka, skriva, välja element
- **Accessibility snapshots**: Få tillgång till sidans struktur

### Exempelkommandon

```
Navigera till https://example.com och ta en screenshot
Kontrollera prestandan för https://developers.chrome.com
Visa mig alla network requests för https://example.com
```

## Felsökning

### Problem: ERR_MODULE_NOT_FOUND

Om du får felmeddelanden om saknade moduler:

1. Rensa npx-cache:
   ```powershell
   Remove-Item -Recurse -Force "$env:LOCALAPPDATA\npm-cache\_npx" -ErrorAction SilentlyContinue
   ```

2. Prova en specifik version:
   ```json
   "args": ["-y", "chrome-devtools-mcp@0.10.2", "--headless=true", "--isolated=true"]
   ```

3. Verifiera att versionen fungerar:
   ```powershell
   npx -y chrome-devtools-mcp@0.10.2 --version
   ```

### Problem: Timeout vid start

Öka `startup_timeout_ms` till 30000 eller 60000.

### Problem: Chrome startar inte

Kontrollera att Chrome är installerad och tillgänglig i PATH. Du kan också starta Chrome manuellt med remote debugging:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:TEMP\chrome-profile-stable"
```

## Ytterligare resurser

- [Chrome DevTools MCP GitHub](https://github.com/ChromeDevTools/chrome-devtools-mcp)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Projektets MCP Setup Guide](../background/synology/MCP_SETUP.md)

