import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { useEffect } from 'react'

// Fix for default marker icon in Leaflet + React
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const getRiskColor = (risk) => {
  const r = risk?.toUpperCase() || 'MEDIUM';
  if (r === 'HIGH' || r === 'CRITICAL') return '#ff1744';
  if (r === 'MEDIUM') return '#ffa726';
  return '#00e676'; // Low
}

function ChangeView({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function ConflictMap({ location, lat, lng, risk, hotspots = [] }) {
  const position = [lat || 0, lng || 0]
  const riskColor = getRiskColor(risk)

  return (
    <div className="card map-card" style={{ position: 'relative' }}>
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
             <h3 style={{ margin: 0 }}>🛰️ Tactical Map</h3>
             <span className="risk-badge" style={{ background: riskColor }}>{risk || 'PENDING'}</span>
          </div>
          <span className="location-label" style={{ opacity: 0.8 }}>{location || 'Global View'}</span>
        </div>
      </div>

      <div className="map-container" style={{ position: 'relative' }}>
        <MapContainer 
          center={position} 
          zoom={4} 
          scrollWheelZoom={false}
          style={{ height: '400px', width: '100%', borderRadius: '12px' }}
        >
          {/* Map Controls */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Modern Dark">
              <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                 url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite imagery">
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain View">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Main Conflict Marker */}
          {(lat && lng) && (
            <Marker position={position}>
              <Popup>
                <div style={{ color: '#0f172a' }}>
                    <strong style={{ color: riskColor }}>RISK: {risk}</strong> <br />
                    <strong>{location}</strong>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Pulsing Hotspots */}
          {hotspots?.map((spot, idx) => (
            <CircleMarker
              key={`spot-${idx}`}
              center={[spot.lat, spot.lng]}
              radius={6 + (spot.intensity || 5) * 2.5}
              pathOptions={{
                fillColor: (spot.intensity || 5) > 7 ? '#ff1744' : '#ffa726',
                color: '#fff',
                fillOpacity: 0.5,
                weight: 2,
                className: 'pulse-marker' 
              }}
            >
              <Popup>
                <div style={{ color: '#0f172a' }}>
                    <strong>{spot.name}</strong> <br />
                    <span>Activity Intensity: {spot.intensity}/10</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          <ChangeView center={position} />
        </MapContainer>

        {/* Tactical Legend Overlay */}
        <div className="map-legend">
           <div className="legend-item">
              <div className="legend-dot" style={{ background: '#ff1744', boxShadow: '0 0 8px #ff1744' }}></div>
              <span>Severe Activity</span>
           </div>
           <div className="legend-item">
              <div className="legend-dot" style={{ background: '#ffa726', boxShadow: '0 0 8px #ffa726' }}></div>
              <span>Rising Tensions</span>
           </div>
           <div style={{ marginTop: '8px', opacity: 0.6, fontSize: '0.7rem' }}>
              Scale: 0-10 Intensity
           </div>
        </div>
      </div>
    </div>
  )
}
