# UI Guidelines - Halo 3C Dashboard

## Designfilosofi - Nordisk Minimalistisk Stil

### Principer

- **Luftigt, rent, tydligt** - Generös whitespace, minimal visuell brus
- **Få färger, neutrala paletter** - Begränsad färgpalett, naturliga toner
- **Tydlig visuell hierarki** - Tydlig skillnad mellan nivåer
- **Fokus på användbarhet** - Funktionalitet före dekor

## Färgpaletter

### Light Mode

```json
{
  "colors": {
    "primary": "#2563eb",
    "primaryHover": "#1d4ed8",
    "background": "#ffffff",
    "surface": "#f8fafc",
    "border": "#e2e8f0",
    "text": {
      "primary": "#0f172a",
      "secondary": "#475569",
      "muted": "#94a3b8"
    },
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "info": "#3b82f6"
  }
}
```

### Dark Mode

```json
{
  "colors": {
    "primary": "#3b82f6",
    "primaryHover": "#2563eb",
    "background": "#0f172a",
    "surface": "#1e293b",
    "border": "#334155",
    "text": {
      "primary": "#f1f5f9",
      "secondary": "#cbd5e1",
      "muted": "#64748b"
    },
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "info": "#3b82f6"
  }
}
```

## Design Tokens

### Typografi

```json
{
  "fontFamily": {
    "sans": ["Inter", "system-ui", "-apple-system", "sans-serif"],
    "mono": ["JetBrains Mono", "Consolas", "monospace"]
  },
  "fontSize": {
    "xs": "0.75rem",
    "sm": "0.875rem",
    "base": "1rem",
    "lg": "1.125rem",
    "xl": "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem"
  },
  "fontWeight": {
    "normal": 400,
    "medium": 500,
    "semibold": 600,
    "bold": 700
  },
  "lineHeight": {
    "tight": 1.25,
    "normal": 1.5,
    "relaxed": 1.75
  }
}
```

### Spacing

```json
{
  "spacing": {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem",
    "2xl": "3rem",
    "3xl": "4rem"
  }
}
```

### Border Radius

```json
{
  "borderRadius": {
    "none": "0",
    "sm": "0.125rem",
    "md": "0.375rem",
    "lg": "0.5rem",
    "xl": "0.75rem",
    "full": "9999px"
  }
}
```

### Shadows

```json
{
  "shadows": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  }
}
```

## Light/Dark Mode

### Implementation

- CSS-variabler eller styled-components theme provider
- Toggle i UI från dag 1
- Systempreferens som standard (prefers-color-scheme)
- Persisterad användarval i localStorage

### Regler

- Båda teman följer nordisk minimalistisk stil
- Konsistent färgpalett i båda teman
- God kontrast i båda teman (WCAG AA minimum)

## Ikoner

### Regler

- **Inga emojis någonstans** (UI, loggar, toast, docs)
- **Endast diskreta SVG-ikoner** från interna ikonbanken
- **Konsistent stil** - alla ikoner i samma stil
- **Temastyrda** - anpassar sig till light/dark mode

### Ikonbank

Ikoner lagras i `src/frontend/assets/icons/` som SVG-filer.

**Namngivning:**

- Kebab-case: `co2-icon.svg`, `temperature-icon.svg`
- Beskrivande namn: `info-icon.svg`, `alert-icon.svg`

**Stil:**

- Stroke-width: 1.5-2px
- Färg: Använder `currentColor` för temaanpassning
- Storlek: 16px, 20px, 24px vanligast

## Tillgänglighet (WCAG AA)

### Kontrast

- **Text:** Minst 4.5:1 kontrast mot bakgrund
- **Stor text:** Minst 3:1 kontrast
- **UI-komponenter:** Minst 3:1 kontrast
- **Validera alltid** kontrast i både light och dark mode

### Interaktion

- **Tydliga hover-states** - Synlig förändring vid hover
- **Tydliga focus-states** - Synlig outline vid fokus (keyboard navigation)
- **Disabled-states** - Tydlig visuell indikation
- **Keyboard navigation** - Alla funktioner tillgängliga via tangentbord

### Typografi

- **Läsbar storlek** - Minst 14px för body text
- **Tydlig hierarki** - Skillnad mellan rubriker och text
- **Lämplig radavstånd** - Minst 1.5 line-height

## Tabeller

### Funktionalitet

- **Full kolumnsortering** - Klickbar header för sortering
- **Filtrering per kolumn** - Textfilter eller dropdown-filter
- **Pagination eller infinite scroll** - För stora dataset
- **Responsiva** - Anpassar sig till små skärmar
- **Tydlig sorteringsindikation** - Visuell indikation av sorteringsriktning

### Design

- Zebra-stripes (alternerande radfärger) för bättre läsbarhet
- Hover-effekt på rader
- Tydliga kolumnheaders med sorteringsikoner

## Tooltip & Popover

### Tooltip (Hover)

- **Utlösare:** Hover över informationsikon
- **Innehåll:** Kort förklaring (1-2 meningar)
- **Position:** Ovanför eller vid sidan, aldrig täcker viktig information
- **Delay:** 300-500ms för att undvika oavsiktlig aktivering
- **Stil:** Minimalistisk, diskret

### Popover (Klick)

- **Utlösare:** Klick på informationsikon
- **Innehåll:**
  - Display-namn
  - Förklaring
  - Normalintervall
  - Varningstecken
  - Länk till sensorinformationssida
- **Position:** Centrerad eller vid ikonen, aldrig täcker viktig information
- **Stängning:** Klick utanför, ESC-tangent, eller stäng-knapp
- **Stil:** Card-liknande, nordisk minimalistisk

### Designregler

- **Aldrig täcka viktig information** - Popover positioneras intelligent
- **Kontraster valideras** - Alltid WCAG AA i light/dark mode
- **Responsiv** - Anpassar sig på små skärmar
- **Tillgänglig** - Keyboard-navigering och screen reader-vänlig

## SensorInfo-sida

### Layout

- **Grid-layout** för sensor-kort
- **Kategori-filtrering** - Filter-dropdown eller tabs
- **Sökruta** - Sök efter sensornamn

### Sensor-kort

Varje sensor visas som ett kort med:

- **Ikon** - SVG-ikon från ikonbanken
- **Namn** - Display-namn
- **Kort text** - Short description
- **Kategori-badge** - Färgkodad kategori-indikator

### Detaljsida

Per sensor (`/sensors/info/{sensorId}`):

- **Header** - Ikon, namn, kategori
- **Beskrivning** - Long description
- **Graf** - Historik med pedagogiska nivåmarkörer
- **Normalintervall** - Visuellt markerat
- **FAQ-sektion** - Vanliga frågor och svar
- **Event-sammanhang** - Relaterade events och tröskelvärden

### FAQ-sektion

- **Kollapsbara sektioner** - Accordion-stil
- **Tydlig typografi** - Fråga i bold, svar i normal text
- **Länkar** - Länkar till relaterade sensorer där relevant

## Grafer med Pedagogiska Nivåmarkörer

### Bakgrundsmarkörer

- **Diskreta färglager** i bakgrunden för olika intervall
- **Ej störande** - Tydliga men inte distraktiva
- **Temastyrda** - Anpassar sig till light/dark mode
- **Tooltip** - Förklarar vad varje nivå betyder vid hover

### Färgkodning

Exempel för CO2:

- **Grön (0-800 ppm):** "God luft"
- **Gul (800-1500 ppm):** "Måttlig luftkvalitet"
- **Orange (1500-2000 ppm):** "Behöver ventileras"
- **Röd (>2000 ppm):** "Kritisk nivå"

### Implementation

- Recharts med custom background layers
- Gradient eller halvtransparenta färger
- Metadata från `sensor_metadata.json` för intervall-definitioner

## Toast-notifieringar

### Design

- **Minimalistisk** - Ingen emoji, diskret stil
- **Severity-baserad styling:**
  - INFO: Blå/neutral
  - WARNING: Gul/orange
  - CRITICAL: Röd
- **Position:** Övre höger eller övre vänster
- **Auto-dismiss:** Efter 5 sekunder (konfigurerbart)
- **Manuell stängning:** X-knapp alltid tillgänglig

### Innehåll

- **Severity-icon** - Diskret ikon
- **Titel** - Kort sammanfattning
- **Beskrivning** - Ytterligare detaljer (optional)
- **Länk** - Länk till sensorinfo eller event-detaljer

## Event-länkning till Sensorinfo

### Event-visning

Vid event/alarm:

- **Sensor-referens** - "Detta larm uppstod eftersom värdet för [sensor] passerade [gräns]"
- **Direktlänk** - Klickbar länk till sensorinformationssida
- **Visa tröskelvärde** - Vad var tröskelvärdet?
- **Visa aktuellt värde** - Vad var värdet när alarmet triggades?

## Best Practices

1. **Konsistens** - Använd alltid design tokens
2. **Tillgänglighet först** - WCAG AA minimum alltid
3. **Responsiv** - Fungerar på alla skärmstorlekar
4. **Temastyrda** - Fungerar i både light och dark mode
5. **Inga emojis** - Endast SVG-ikoner
6. **Tydlig feedback** - Användaren ska alltid veta vad som händer
7. **Pedagogisk** - Förklara, inte bara visa

---

**Uppdaterad:** 2025-01-27

