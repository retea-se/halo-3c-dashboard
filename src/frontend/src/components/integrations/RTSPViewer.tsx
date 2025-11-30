/**
 * RTSPViewer - Komponent för att visa RTSP/MJPEG video stream från Halo
 */
import React, { useState, useEffect } from 'react';

interface RTSPViewerProps {
  streamUrl?: string | null;
  mjpegUrl?: string | null;
  enabled?: boolean;
  onError?: (error: string) => void;
}

export const RTSPViewer: React.FC<RTSPViewerProps> = ({
  streamUrl,
  mjpegUrl,
  enabled = false,
  onError,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset error state when URLs change
  useEffect(() => {
    setImageError(false);
    setIsLoading(true);
  }, [mjpegUrl, streamUrl, enabled]);

  // Använd MJPEG URL om tillgänglig (fungerar i alla webbläsare)
  const imageUrl = mjpegUrl || streamUrl;

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
    if (onError) {
      onError('Kunde inte ladda video stream');
    }
  };

  if (!enabled) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        RTSP är inte aktiverad
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Ingen stream URL tillgänglig
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 9',
        backgroundColor: 'var(--color-background)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            zIndex: 1,
          }}
        >
          Laddar stream...
        </div>
      )}

      {imageError ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            padding: 'var(--spacing-md)',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 'var(--spacing-sm)' }}>⚠️</div>
          <div>Kunde inte ladda video stream</div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-tertiary)',
              marginTop: 'var(--spacing-xs)',
            }}
          >
            Kontrollera att RTSP är aktiverad och att enheten är ansluten
          </div>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt="RTSP Stream"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: isLoading ? 'none' : 'block',
          }}
        />
      )}
    </div>
  );
};

