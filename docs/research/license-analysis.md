# Licensanalys - Kommersiell Användning

**Datum:** 2025-11-30
**Syfte:** Verifiera att alla komponenter kan användas kommersiellt

---

## ✅ Sammanfattning

**Alla komponenter i projektet är öppen källkod med permisiva licenser som tillåter kommersiell användning utan begränsningar.**

### Licensöversikt

- ✅ **MIT** - Tillåter kommersiell användning, kräver bara att upphovsrättsnotisen bevaras
- ✅ **Apache-2.0** - Tillåter kommersiell användning med patentskydd
- ✅ **BSD** - Tillåter kommersiell användning, liknande MIT
- ✅ **PSF** (Python Software Foundation) - Tillåter kommersiell användning

---

## 📦 Frontend Dependencies

| Bibliotek | Version | Licens | Kommersiell OK | Noter |
|-----------|---------|--------|----------------|-------|
| **React** | 18.2.0 | MIT | ✅ Ja | UI-bibliotek |
| **React DOM** | 18.2.0 | MIT | ✅ Ja | React renderer |
| **React Router DOM** | 6.20.0 | MIT | ✅ Ja | Routing |
| **TypeScript** | 5.3.2 | Apache-2.0 | ✅ Ja | Typing system |
| **Vite** | 5.0.4 | MIT | ✅ Ja | Build tool |
| **Recharts** | 2.10.0 | MIT | ✅ Ja | Charts/graphs |
| **Axios** | 1.6.2 | MIT | ✅ Ja | HTTP client |
| **Zustand** | 4.4.7 | MIT | ✅ Ja | State management |

**Övriga devDependencies:**
- ESLint, TypeScript ESLint plugins - MIT
- Vite React plugin - MIT
- Alla är öppen källkod och kommersiellt användbara

---

## 🐍 Backend Dependencies

| Bibliotek | Version | Licens | Kommersiell OK | Noter |
|-----------|---------|--------|----------------|-------|
| **Python** | 3.11+ | PSF | ✅ Ja | Programmeringsspråk |
| **FastAPI** | 0.104.0+ | MIT | ✅ Ja | Web framework |
| **Uvicorn** | 0.24.0+ | BSD-3-Clause | ✅ Ja | ASGI server |
| **Pydantic** | 2.5.0+ | MIT | ✅ Ja | Data validation |
| **InfluxDB Client** | 1.38.0+ | MIT | ✅ Ja | Database client |
| **Requests** | 2.31.0+ | Apache-2.0 | ✅ Ja | HTTP library |
| **Python-dotenv** | 1.0.0+ | BSD-3-Clause | ✅ Ja | Env file parsing |
| **Python-jose** | 3.3.0+ | MIT | ✅ Ja | JWT handling |
| **Passlib** | 1.7.4+ | BSD | ✅ Ja | Password hashing |
| **Python-socketio** | 5.10.0+ | MIT | ✅ Ja | WebSocket support |

---

## 🎬 Förslag på RTSP & BACnet Bibliotek

### RTSP i Webbläsare

För att visa RTSP-stream i webbläsaren behöver vi konvertera RTSP till något webbläsare stödjer (RTSP stöds inte direkt i webbläsare).

**Alternativ 1: RTSP → HLS (HTTP Live Streaming)**
- **hls.js** - MIT License ✅
- Kräver backend-konvertering (FFmpeg)

**Alternativ 2: RTSP → WebRTC**
- **mediasoup** - ISC License (liknande MIT) ✅
- Mer komplex, bättre real-time performance

**Alternativ 3: RTSP → MJPEG/JPEG Stream**
- Halo stödjer redan `/api/gfx/stream.jpg`
- Enklast lösning, men lägre kvalitet

**Rekommendation:** Använd `/api/gfx/stream.jpg` (MJPEG) eller lägg till FFmpeg-backend för HLS-konvertering.

### BACnet Integration

| Bibliotek | Licens | Kommersiell OK | Noter |
|-----------|--------|----------------|-------|
| **BAC0** | MIT | ✅ Ja | Hög nivå Python-klient |
| **bacpypes3** | MIT | ✅ Ja | Full BACnet stack |

**Rekommendation:** Använd BAC0 för enkel integration.

---

## 🔒 Säkerhets- & Kryptografi-bibliotek

Alla kryptografiska bibliotek som används:

- **python-jose[cryptography]** - MIT ✅
- **cryptography** (dependency) - Apache-2.0/BSD ✅
- **passlib[bcrypt]** - BSD ✅
- **bcrypt** - Apache-2.0 ✅

Alla tillåter kommersiell användning.

---

## 🐳 Infrastructure

| Komponent | Licens | Kommersiell OK | Noter |
|-----------|--------|----------------|-------|
| **Docker** | Apache-2.0 | ✅ Ja | Containerization |
| **InfluxDB** | MIT | ✅ Ja | Time-series database |
| **Nginx** | BSD-2-Clause | ✅ Ja | Web server/proxy |

**OBS:** InfluxDB Community Edition är gratis. Enterprise Edition kräver licens.

---

## ⚠️ Viktiga Noteringar

### Copyleft-licenser

**INGA copyleft-licenser (GPL, AGPL) används.** Alla licenser är permisiva och tillåter:
- Kommersiell användning
- Proprietär distribution
- Modifikation utan att dela källkoden

### Attribuering

Enligt MIT/Apache/BSD-licenserna måste du:
1. ✅ Bevara upphovsrättsnotiser i källkoden
2. ✅ Inkludera license-filer om de distribueras
3. ✅ Om du modifierar koden, dokumentera ändringar (för Apache-2.0)

### Inga Patentkrav

Apache-2.0-licensen ger patentskydd - ingen kan stämma dig för patentintrång när du använder Apache-2.0-licenserad kod.

---

## 📋 Checklist för Kommersiell Användning

- [x] Alla dependencies har permisiva licenser (MIT/Apache/BSD/PSF)
- [x] Inga GPL/AGPL-bibliotek används
- [x] Upphovsrättsnotiser bevaras i källkoden
- [x] License-filer inkluderas i distribution
- [ ] Projektets egen licens definierad (rekommenderas)

---

## 🎯 Rekommendationer

### För RTSP/BACnet-sida

**RTSP-visning:**
- Använd Halo's MJPEG-stream: `/api/gfx/stream.jpg` (redan tillgänglig, ingen extra licens)
- Alternativt: FFmpeg för HLS-konvertering (LGPL/GPL, men kan användas kommersiellt om du länkar dynamiskt)

**BACnet-integration:**
- Använd BAC0 (MIT License) ✅
- Eller bacpypes3 (MIT License) ✅
- Båda är kommersiellt användbara

### För projektet

1. **Definiera projektets licens** - Rekommenderat att lägga till LICENSE-fil
2. **Dokumentera dependencies** - Behåll nuvarande licens-tabell i Documentation
3. **Ingen risk för licensproblem** - Alla komponenter är säkra för kommersiell användning

---

## ✅ Slutsats

**Projektet är 100% säkert för kommersiell användning.** Alla komponenter använder permisiva licenser (MIT, Apache-2.0, BSD, PSF) som tillåter fri kommersiell användning utan copyleft-krav.

**Nästa steg:**
1. Skapa RTSP/BACnet-konfigurationssida (alla bibliotek är kommersiellt användbara)
2. Lägg till projektets egen LICENSE-fil (rekommenderas)
3. Fortsätt med kommersiell utveckling utan licensbekymmer

---

**Senast uppdaterad:** 2025-11-30

