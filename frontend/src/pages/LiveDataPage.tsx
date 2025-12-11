import { useEffect, useRef, useState } from 'react';
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
  const [infoVisible, setInfoVisible] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    const indiaBounds: L.LatLngBoundsExpression = [[5, 75], [20, 85]];

    const map = L.map(mapContainer.current, {
      maxBounds: indiaBounds,
      maxBoundsViscosity: 1.0,
      minZoom: 5,
    }).setView([18, 80], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      noWrap: true,
    }).addTo(map);

    const stateFiles = [
      { name: "Andhra Pradesh", file: "/geojson/states/ANDHRA%20PRADESH_STATE.geojson", color: "#d62728" },
      { name: "Karnataka", file: "/geojson/states/KARNATAKA_STATE.geojson", color: "#1f77b4" },
      { name: "Kerala", file: "/geojson/states/KERALA_STATE.geojson", color: "#2ca02c" },
      { name: "Tamil Nadu", file: "/geojson/states/TAMIL%20NADU_STATE.geojson", color: "#ff7f0e" },
      { name: "Telangana", file: "/geojson/states/TELANGANA_STATE.geojson", color: "#9467bd" },
    ];

    stateFiles.forEach((st) => {
      fetch(st.file)
        .then((res) => res.json())
        .then((geo) => {
          L.geoJSON(geo, {
            style: { color: st.color, weight: 2, fillOpacity: 0.15 },
            onEachFeature: (_, layer) => { layer.bindPopup(st.name); },
          }).addTo(map);
        })
        .catch((err) => console.error("Error loading:", st.file, err));
    });

    return () => { map.remove(); };
  }, []);

  return (
    <div className="flex-1 flex flex-col w-full h-full mt-20">
      {/* Header */}
      <div className="px-6 md:px-12 py-4 border-b border-blue-500/20 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
          <div className="flex flex-col flex-1">
            {infoVisible ? (
              <>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Live Data</h1>
                <p className="text-blue-100/60 mb-2">DISASTER RESPONSE COORDINATION HUB</p>
                <p className="text-blue-200/80 text-sm md:text-base max-w-xl">
                  DRCH services are available in the southern zone of the following states:
                  <strong> Andhra Pradesh, Karnataka, Kerala, Tamil Nadu, and Telangana</strong>.
                  You can view the exact coverage area highlighted on the map below.
                </p>
              </>
            ) : (
              <h1 className="text-2xl font-bold text-white">Live Data</h1>
            )}
          </div>

          <div className="flex items-center gap-4">
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

            <button
              onClick={() => setInfoVisible(!infoVisible)}
              className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 rounded text-sm text-white transition"
            >
              {infoVisible ? 'Hide' : 'Expand'}
            </button>
          </div>
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
