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
  if (r === 'HIGH' || r === 'CRITICAL') return '#c31e00';
  if (r === 'MEDIUM') return '#ffa000';
  return '#00de72'; // Low
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
    <div className="intel-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '24px', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000, pointerEvents: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ 
            background: 'rgba(27, 28, 29, 0.85)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid rgba(255,255,255,0.06)',
            pointerEvents: 'auto',
            backdropFilter: 'blur(16px)'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
               <h4 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                 GEOSPATIAL INTEL
               </h4>
               <span className="risk-badge" style={{
                 padding: '4px 8px',
                 fontSize: '0.65rem',
                 background: `${riskColor}33`,
                 color: riskColor,
                 borderColor: `${riskColor}66`,
                 borderWidth: '1px',
                 borderStyle: 'solid'
               }}>
                 {risk || 'PENDING'}
               </span>
            </div>
          </div>
          
          <div style={{ 
            background: 'rgba(27, 28, 29, 0.85)', 
            padding: '12px 16px', 
            borderRadius: 'var(--radius-lg)', 
            border: '1px solid rgba(255,255,255,0.06)',
            pointerEvents: 'auto',
            backdropFilter: 'blur(16px)',
            fontSize: '0.8rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.08em'
          }}>
            📍 {typeof location === 'string' ? location : 'GLOBAL VIEW'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer 
          center={position} 
          zoom={4} 
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: 'var(--surface-dim)' }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Modern Dark">
              <TileLayer
                 attribution='&copy; CARTO'
                 url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {(lat && lng) && (
            <Marker position={position}>
              <Popup>
                <div style={{ fontFamily: 'var(--font-body)', padding: '4px' }}>
                    <strong style={{ color: riskColor, fontFamily: 'var(--font-display)' }}>RISK: {risk}</strong> <br />
                    <span style={{ fontSize: '0.9rem' }}>{location}</span>
                </div>
              </Popup>
            </Marker>
          )}

          {hotspots?.map((spot, idx) => (
            <CircleMarker
              key={`spot-${idx}`}
              center={[spot.lat, spot.lng]}
              radius={6 + (spot.intensity || 5) * 2.5}
              pathOptions={{
                fillColor: (spot.intensity || 5) > 7 ? 'var(--risk-high)' : 'var(--risk-medium)',
                color: '#fff',
                fillOpacity: 0.4,
                weight: 1.5,
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'var(--font-body)', padding: '4px' }}>
                    <strong style={{ fontFamily: 'var(--font-display)' }}>{spot.name}</strong> <br />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>INTENSITY: {spot.intensity}/10</span>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          <ChangeView center={position} />
        </MapContainer>

        {/* Tactical Legend */}
        <div style={{ 
          position: 'absolute', 
          bottom: '24px', 
          right: '24px', 
          zIndex: 1000,
          background: 'rgba(27, 28, 29, 0.85)',
          padding: '16px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.65rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.08em' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--risk-high)', boxShadow: '0 0 12px var(--risk-high)' }}></div>
              <span>ESCALATING</span>
           </div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.65rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.08em' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--risk-medium)', boxShadow: '0 0 12px var(--risk-medium)' }}></div>
              <span>RISING TENSION</span>
           </div>
        </div>
      </div>
    </div>
  )
}
