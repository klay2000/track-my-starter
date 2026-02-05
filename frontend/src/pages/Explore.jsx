import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Explore.css'

const TYPE_COLORS = {
  sourdough: { fill: '#f59e0b', stroke: '#d97706' },
  friendship_bread: { fill: '#ec4899', stroke: '#db2777' },
  kefir_milk: { fill: '#06b6d4', stroke: '#0891b2' },
  kefir_water: { fill: '#10b981', stroke: '#059669' },
  kombucha: { fill: '#8b5cf6', stroke: '#7c3aed' },
  ginger_bug: { fill: '#f97316', stroke: '#ea580c' },
  jun: { fill: '#84cc16', stroke: '#65a30d' },
  other: { fill: '#6b7280', stroke: '#4b5563' },
}

function createMarkerIcon(fillColor, strokeColor) {
  return new L.Icon({
    iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
        <circle cx="12" cy="12" r="10" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2"/>
        <circle cx="12" cy="12" r="4" fill="${strokeColor}"/>
      </svg>
    `),
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

const TYPE_LABELS = {
  sourdough: 'Sourdough',
  friendship_bread: 'Friendship Bread',
  kefir_milk: 'Kefir (Milk)',
  kefir_water: 'Kefir (Water)',
  kombucha: 'Kombucha',
  ginger_bug: 'Ginger Bug',
  jun: 'Jun',
  other: 'Other',
}

function FitBounds({ starters }) {
  const map = useMap()

  useEffect(() => {
    if (starters.length === 0) return

    const bounds = L.latLngBounds(
      starters.map((s) => [
        s.location.coordinates[1],
        s.location.coordinates[0],
      ])
    )
    map.fitBounds(bounds, { padding: [50, 50] })
  }, [map, starters])

  return null
}

export default function Explore({ apiUrl }) {
  const [starters, setStarters] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch(`${apiUrl}/api/starters`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load starters')
        return res.json()
      })
      .then((data) => {
        setStarters(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [apiUrl])

  if (loading) {
    return (
      <div className="explore-page">
        <div className="explore-loading">
          <div className="loading-spinner" />
          <p>Loading starters...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="explore-page">
        <div className="explore-error">
          <h1>Something went wrong</h1>
          <p>{error}</p>
          <Link to="/" className="btn">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="explore-page">
      <nav className="explore-nav">
        <Link to="/" className="nav-back">
          ← Back to Home
        </Link>
        <div className="explore-count">
          {starters.length} starter{starters.length !== 1 ? 's' : ''}
        </div>
      </nav>

      <div className="explore-map">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {starters.length > 0 && <FitBounds starters={starters} />}
          {starters.map((starter) => {
            const position = [
              starter.location.coordinates[1],
              starter.location.coordinates[0],
            ]
            const wordsStr = starter.words.join('-')
            const typeLabel = TYPE_LABELS[starter.starter_type] || starter.starter_type
            const hasName = !!starter.name
            const displayName = starter.name || wordsStr
            const color = TYPE_COLORS[starter.starter_type] || TYPE_COLORS.other
            const icon = createMarkerIcon(color.fill, color.stroke)

            return (
              <Marker key={wordsStr} position={position} icon={icon}>
                <Popup>
                  <div className="explore-popup">
                    <span className="popup-type" style={{ background: color.stroke }}>{typeLabel}</span>
                    <p className="popup-name">{displayName}</p>
                    {hasName && <p className="popup-words">{wordsStr}</p>}
                    <button
                      className="popup-link"
                      onClick={() => navigate(`/${wordsStr}`)}
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}
