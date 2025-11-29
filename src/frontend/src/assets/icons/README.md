# Icon Bank - Halo 3C Dashboard

Denna mapp innehåller alla SVG-ikoner för Halo 3C Dashboard.

## Icon Guidelines

- **Format:** SVG med `stroke` för outline-icons, `fill` för filled icons
- **ViewBox:** Standard `0 0 24 24` för konsistens
- **Stil:** Nordisk minimalistisk - rena linjer, inga gradients
- **Färger:** Använd `currentColor` för att möjliggöra theme-stöd

## Tillgängliga Ikoner

- `dashboard-icon.svg` - Dashboard (grid layout)
- `events-icon.svg` - Events (bell/notification)
- `sensor-info-icon.svg` - Sensor info (info circle)
- `halo-icon.svg` - Halo logo (koncentriska cirklar)
- `sun.svg` - Sun (light mode toggle)
- `moon.svg` - Moon (dark mode toggle)
- `info-icon.svg` - Info (information circle)
- `beacon-icon.svg` - Beacon (radar/ping icon)

## Lägga Till Nya Ikoner

1. Skapa SVG-fil i denna mapp
2. Lägg till mapping i `src/frontend/src/components/ui/Icon.tsx` iconMap
3. Använd ikonen med: `<Icon name="icon-name" />`

## Designprinciper

- Konsistent stroke-width (2px standard)
- Rundade linjeskärningar (stroke-linecap="round")
- Minimalistisk stil
- WCAG AA kontrast när används med theme colors


