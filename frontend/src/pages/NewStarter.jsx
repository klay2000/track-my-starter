import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Marker, useMapEvents } from 'react-leaflet'
import { STARTER_TYPES } from '../constants/starters'
import { createMarkerIcon } from '../utils/markers'
import BackButton from '../components/BackButton'
import ErrorMessage from '../components/ErrorMessage'
import StarterMap from '../components/StarterMap'
import './NewStarter.css'

const locationMarkerIcon = createMarkerIcon('#d4a574', '#b07d4f')

function LocationPicker({ onLocationSelect, selectedLocation }) {
  useMapEvents({
    click(e) {
      onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
  })

  return selectedLocation ? (
    <Marker
      position={[selectedLocation.lat, selectedLocation.lng]}
      icon={locationMarkerIcon}
    />
  ) : null
}

export default function NewStarter({ apiUrl }) {
  const { words: parentWords } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [starterType, setStarterType] = useState('sourdough')
  const [typeOther, setTypeOther] = useState('')
  const [location, setLocation] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [parentStarter, setParentStarter] = useState(null)

  useEffect(() => {
    if (parentWords) {
      fetch(`${apiUrl}/api/starters/${parentWords}`)
        .then((res) => {
          if (!res.ok) throw new Error('Parent starter not found')
          return res.json()
        })
        .then((parent) => {
          setParentStarter(parent)
          setStarterType(parent.starter_type)
          if (parent.starter_type === 'other' && parent.type_other) {
            setTypeOther(parent.type_other)
          }
        })
        .catch((err) => setError(err.message))
    }
  }, [apiUrl, parentWords])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const url = parentWords
      ? `${apiUrl}/api/starters/${parentWords}/descendants`
      : `${apiUrl}/api/starters`

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || null,
          starter_type: starterType,
          type_other: starterType === 'other' ? typeOther : null,
          lat: location.lat,
          lng: location.lng,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || 'Failed to create starter')
      }

      const starter = await res.json()
      navigate(`/${starter.words.join('-')}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
      setShowConfirm(false)
    }
  }

  const isValid = location && starterType && (starterType !== 'other' || typeOther)

  return (
    <div className="new-starter-page">
      <BackButton to={parentWords ? `/${parentWords}` : '/'}>
        ← {parentWords ? 'Back to Parent' : 'Back to Home'}
      </BackButton>

      <div className="new-starter-layout">
        <div className="new-starter-form">
          <header className="form-header">
            <h1>{parentWords ? 'Add Descendant' : 'Add New Starter'}</h1>
            {parentStarter && (
              <p className="parent-info">
                Descendant of <strong>{parentStarter.name || parentStarter.words.join('-')}</strong>
              </p>
            )}
          </header>

          <ErrorMessage message={error} />

          <div className="form-group">
            <label htmlFor="name">Name <span className="optional">(optional)</span></label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Old Faithful, Grandma's Recipe"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Starter Type</label>
            <select
              id="type"
              value={starterType}
              onChange={(e) => setStarterType(e.target.value)}
              disabled={!!parentWords}
              className={parentWords ? 'disabled' : ''}
            >
              {STARTER_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {parentWords && (
              <span className="field-hint">Inherited from parent</span>
            )}
          </div>

          {starterType === 'other' && (
            <div className="form-group">
              <label htmlFor="typeOther">Specify Type</label>
              <input
                type="text"
                id="typeOther"
                value={typeOther}
                onChange={(e) => setTypeOther(e.target.value)}
                placeholder="e.g., Tibicos, Viili"
                disabled={!!parentWords}
                className={parentWords ? 'disabled' : ''}
              />
            </div>
          )}

          <div className="form-group">
            <label>
              Location
              {location ? (
                <span className="location-selected">
                  {location.lat.toFixed(2)}°, {location.lng.toFixed(2)}°
                </span>
              ) : (
                <span className="location-hint">Click on the map</span>
              )}
            </label>
          </div>

          <button
            className="btn btn-large submit-btn"
            disabled={!isValid}
            onClick={() => setShowConfirm(true)}
          >
            Create Starter
          </button>
        </div>

        <div className="new-starter-map">
          <StarterMap center={[30, 0]} zoom={2}>
            <LocationPicker
              onLocationSelect={setLocation}
              selectedLocation={location}
            />
          </StarterMap>
          {!location && (
            <div className="map-hint">
              Click anywhere on the map to set your location
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Confirm Creation</h2>
            <p>
              This action is <strong>permanent</strong>. Once created, this starter
              cannot be edited or deleted.
            </p>
            <p>Are you sure you want to continue?</p>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                className="btn"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Yes, Create Starter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
