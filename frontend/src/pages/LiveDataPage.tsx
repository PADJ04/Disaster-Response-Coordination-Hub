import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BackProps } from '../types';

export default function LiveDataPage({ onBack }: BackProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([20.5937, 78.9629], 5);

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current);



    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-full animate-fade-in bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="px-6 md:px-12 py-8 border-b border-blue-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Live Data</h1>
            <p className="text-blue-100/60">Real-time incident tracking and response coordination</p>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-blue-400/30 hover:border-blue-300/60 rounded-lg transition-all text-sm font-medium text-blue-100 backdrop-blur-sm"
          >
            Back
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={mapContainer}
          className="w-full h-full rounded-none"
          style={{ minHeight: '600px' }}
        />
      </div>
    </div>
  );
}
