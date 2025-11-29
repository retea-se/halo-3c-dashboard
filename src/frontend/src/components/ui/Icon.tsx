/**
 * Icon - Icon wrapper komponent för SVG-ikoner
 * Laddar SVG-filer från assets/icons/ directory
 */
import React, { useState, useEffect } from 'react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}

// Icon name mapping - mappar logiska namn till filnamn
const iconMap: Record<string, string> = {
  'dashboard-icon': 'dashboard-icon.svg',
  'events-icon': 'events-icon.svg',
  'sensor-info-icon': 'sensor-info-icon.svg',
  'halo-icon': 'halo-icon.svg',
  'sun': 'sun.svg',
  'moon': 'moon.svg',
  'info-icon': 'info-icon.svg',
  'beacon-icon': 'beacon-icon.svg',
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, className, color, style }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Hämta filnamn från icon map eller använd direkt
    // Om namnet redan slutar med .svg, använd det direkt
    const filename = iconMap[name] || (name.endsWith('.svg') ? name : `${name}.svg`);

    // Ladda SVG via fetch från public/icons
    const loadSvg = async () => {
      try {
        setLoading(true);
        // Ladda SVG från public/icons (statiska filer som kan cachas)
        const svgPath = `/icons/${filename}`;
        const response = await fetch(svgPath);

        if (response.ok) {
          const svgText = await response.text();
          setSvgContent(svgText);
        } else {
          console.warn(`Icon "${name}" (${filename}) not found at ${svgPath}`);
        }
      } catch (err) {
        console.warn(`Failed to load icon "${name}":`, err);
      } finally {
        setLoading(false);
      }
    };

    loadSvg();
  }, [name]);

  // Om ikon laddades, rendera den
  if (svgContent && !loading) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          width: size,
          height: size,
          color: color || 'currentColor',
          ...style,
        }}
        dangerouslySetInnerHTML={{
          __html: svgContent
            .replace(/<svg/, `<svg width="${size}" height="${size}"`)
            .replace(/stroke="currentColor"/g, `stroke="${color || 'currentColor'}"`)
            .replace(/fill="currentColor"/g, `fill="${color || 'currentColor'}"`),
        }}
      />
    );
  }

  // Placeholder om ikon saknas eller laddas
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color || 'currentColor'}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        opacity: loading ? 0.3 : 0.5,
        ...style,
      }}
      aria-label={`Icon: ${name}${loading ? ' (loading)' : ' (placeholder)'}`}
    >
      {/* Placeholder - diskret visuell indikator */}
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="12" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  );
};
