import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useFetch } from '../hooks/useFetch'
import { TYPE_LABELS, TYPE_COLORS } from '../constants/starters'
import { createMarkerIcon } from '../utils/markers'
import LoadingSpinner from '../components/LoadingSpinner'
import StarterMap from '../components/StarterMap'
import MapPopup from '../components/MapPopup'
import './Explore.css'

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
  const { data: starters, loading, error } = useFetch(`${apiUrl}/api/starters`)
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="explore-page">
        <LoadingSpinner message="Loading starters..." />
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
        <StarterMap center={[20, 0]} zoom={2}>
          {starters.length > 0 && <FitBounds starters={starters} />}
          {starters.map((starter) => {
            const position = [
              starter.location.coordinates[1],
              starter.location.coordinates[0],
            ]
            const wordsStr = starter.words.join('-')
            const typeLabel = TYPE_LABELS[starter.starter_type] || starter.starter_type
            const color = TYPE_COLORS[starter.starter_type] || TYPE_COLORS.other
            const icon = createMarkerIcon(color.fill, color.stroke)

            return (
              <Marker key={wordsStr} position={position} icon={icon}>
                <Popup>
                  <MapPopup
                    name={starter.name}
                    words={wordsStr}
                    typeLabel={typeLabel}
                    color={color}
                  />
                </Popup>
              </Marker>
            )
          })}
        </StarterMap>
      </div>
    </div>
  )
}
