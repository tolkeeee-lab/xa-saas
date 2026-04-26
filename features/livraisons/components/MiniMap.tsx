'use client';

type Props = {
  lat: number;
  lng: number;
  label?: string;
};

/**
 * Lightweight map using OpenStreetMap iframe embed.
 * No external library dependencies.
 */
export default function MiniMap({ lat, lng, label = 'Position actuelle' }: Props) {
  const delta = 0.01;
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="aspect-video rounded-2xl overflow-hidden border border-xa-border relative">
        <iframe
          src={src}
          title={label}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-sm text-xa-primary underline underline-offset-2 py-1"
      >
        📍 Ouvrir dans Google Maps
      </a>
    </div>
  );
}
