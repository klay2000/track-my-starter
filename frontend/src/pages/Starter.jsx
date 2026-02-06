import { useState, useEffect, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { TYPE_LABELS, NODE_COLORS } from '../constants/starters'
import { createMarkerIcon } from '../utils/markers'
import { buildNodeColors } from '../utils/tree'
import LoadingSpinner from '../components/LoadingSpinner'
import BackButton from '../components/BackButton'
import StarterMap from '../components/StarterMap'
import MapPopup from '../components/MapPopup'
import FamilyTree from '../components/FamilyTree'
import './Starter.css'

function FitBounds({ nodes, currentWords }) {
  const map = useMap()
  useEffect(() => {
    if (nodes.length === 0) return

    const currentNode = nodes.find((n) => n.is_target)
    if (currentNode) {
      map.setView(
        [currentNode.location.coordinates[1], currentNode.location.coordinates[0]],
        6
      )
    } else if (nodes.length === 1) {
      const node = nodes[0]
      map.setView([node.location.coordinates[1], node.location.coordinates[0]], 6)
    } else {
      const bounds = L.latLngBounds(
        nodes.map((n) => [n.location.coordinates[1], n.location.coordinates[0]])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, nodes, currentWords])
  return null
}

export default function Starter({ apiUrl }) {
  const { words } = useParams()
  const navigate = useNavigate()
  const [starter, setStarter] = useState(null)
  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  const nodeColors = useMemo(() => {
    if (!tree?.nodes) return {}
    return buildNodeColors(tree.nodes)
  }, [tree])

  useEffect(() => {
    if (!starter) {
      setLoading(true)
    }
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
        <LoadingSpinner message="Loading starter..." />
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

  const hasName = !!starter.name
  const displayName = starter.name || starter.words.join('-')
  const typeLabel = starter.starter_type === 'other' && starter.type_other
    ? starter.type_other
    : TYPE_LABELS[starter.starter_type]

  const position = [
    starter.location.coordinates[1],
    starter.location.coordinates[0]
  ]

  return (
    <div className="starter-page">
      <BackButton to="/">← Back to Home</BackButton>

      <header className="starter-header">
        <div className="starter-title">
          <h1>{displayName}</h1>
          <span className="badge">{typeLabel}</span>
        </div>
        {hasName && <p className="starter-words">{starter.words.join('-')}</p>}
        <p className="starter-meta">
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
        <div className="starter-map-section">
          <div className="starter-map">
            <StarterMap center={position} zoom={10}>
              {tree && <FitBounds nodes={tree.nodes} currentWords={words} />}
              {tree?.nodes.map((node) => {
                const nodeWords = node.words.join('-')
                const pos = [node.location.coordinates[1], node.location.coordinates[0]]
                const isCurrent = node.is_target
                const color = nodeColors[nodeWords] || NODE_COLORS[0]
                const icon = createMarkerIcon(color.fill, color.stroke, isCurrent)

                return (
                  <Marker key={nodeWords} position={pos} icon={icon}>
                    <Popup>
                      <MapPopup
                        name={node.name}
                        words={nodeWords}
                        typeLabel={TYPE_LABELS[node.starter_type] || 'Starter'}
                        color={color}
                        isCurrent={isCurrent}
                      />
                    </Popup>
                  </Marker>
                )
              })}
            </StarterMap>
          </div>
        </div>

        <div className="starter-tree">
          <div className="tree-container">
            {tree && <FamilyTree tree={tree} currentWords={words} nodeColors={nodeColors} />}
          </div>
          {tree?.truncated && (
            <p className="text-muted" style={{ textAlign: 'center', marginTop: 12 }}>
              Showing first 100 nodes
            </p>
          )}
        </div>
      </div>

    </div>
  )
}
