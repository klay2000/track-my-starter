import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import FamilyTree from '../components/FamilyTree'
import 'leaflet/dist/leaflet.css'
import './Starter.css'

// Custom marker icon
const markerIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <circle cx="12" cy="12" r="10" fill="#d4a574" stroke="#b07d4f" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="#b07d4f"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

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

function MapController({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 10)
  }, [map, center])
  return null
}

export default function Starter({ apiUrl }) {
  const { words } = useParams()
  const [starter, setStarter] = useState(null)
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)

    Promise.all([
      fetch(`${apiUrl}/api/starters/${words}`).then((res) => {
        if (!res.ok) throw new Error('Starter not found')
        return res.json()
      }),
      fetch(`${apiUrl}/api/starters/${words}/tree`).then((res) => res.json()),
    ])
      .then(([starterData, treeData]) => {
        setStarter(starterData)
        setTree(treeData)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [apiUrl, words])

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="starter-page">
        <div className="starter-loading">
          <div className="loading-spinner" />
          <p>Loading starter...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="starter-page">
        <div className="starter-error">
          <h1>Starter not found</h1>
          <p>The starter you're looking for doesn't exist.</p>
          <Link to="/" className="btn">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const displayName = starter.name || TYPE_LABELS[starter.starter_type] || 'Starter'
  const typeLabel = starter.starter_type === 'other' && starter.type_other
    ? starter.type_other
    : TYPE_LABELS[starter.starter_type]

  const position = [
    starter.location.coordinates[1],
    starter.location.coordinates[0]
  ]

  return (
    <div className="starter-page">
      <nav className="starter-nav">
        <Link to="/" className="nav-back">
          ← Back to Map
        </Link>
      </nav>

      <header className="starter-header">
        <span className="badge">{typeLabel}</span>
        <h1>{displayName}</h1>
        <p className="starter-words">{starter.words.join('-')}</p>
        <div className="starter-actions">
          <button onClick={copyUrl} className="btn btn-secondary">
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <Link to={`/${words}/new`} className="btn">
            Add Descendant
          </Link>
        </div>
      </header>

      <div className="starter-content">
        <section className="starter-section">
          <h2>Location</h2>
          <div className="starter-map">
            <MapContainer
              center={position}
              zoom={10}
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position} icon={markerIcon} />
              <MapController center={position} />
            </MapContainer>
          </div>
        </section>

        <section className="starter-section starter-section-tree">
          <h2>Family Tree</h2>
          <div className="tree-container">
            {tree && <FamilyTree tree={tree} currentWords={words} />}
          </div>
          {tree?.truncated && (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: 12 }}>
              Showing first 100 nodes
            </p>
          )}
        </section>
      </div>

      <footer className="starter-footer">
        <p>
          Created {new Date(starter.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
          {starter.parent_words && (
            <>
              {' · Descended from '}
              <Link to={`/${starter.parent_words.join('-')}`}>
                {starter.parent_words.join('-')}
              </Link>
            </>
          )}
        </p>
      </footer>
    </div>
  )
}
