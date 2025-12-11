import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BackProps } from '../types';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function LiveDataPage({ onBack }: BackProps) {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const indiaBounds: L.LatLngBoundsExpression = [[8.4, 68.7], [35.5, 97.4]];

    const map = L.map(mapContainer.current, {
      maxBounds: indiaBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 5,
    }).setView([13.2, 80.315], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      noWrap: true,
    }).addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-full mt-20">
      {/* Header */}
      <div className="px-6 md:px-12 py-8 border-b border-blue-500/20 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Live Data</h1>
            <p className="text-blue-100/60">
              Real-time incident tracking and response coordination
            </p>
          </div>

          <button
            onClick={onBack}
            className="px-6 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 
                       hover:from-blue-500/30 hover:to-cyan-500/30 
                       border border-blue-400/30 hover:border-blue-300/60 
                       rounded-lg transition-all text-sm font-medium text-blue-100 
                       backdrop-blur-sm"
          >
            Back
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="flex-1 w-full"
        style={{ height: "100%", minHeight: "500px" }}
      />
    </div>
  );
}
