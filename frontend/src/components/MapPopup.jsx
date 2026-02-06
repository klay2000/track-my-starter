import { useNavigate } from 'react-router-dom'
import './MapPopup.css'

export default function MapPopup({ name, words, typeLabel, color, isCurrent }) {
  const navigate = useNavigate()
  const hasName = !!name
  const displayName = name || words

  return (
    <div className="map-popup">
      <span className="popup-type" style={{ background: color?.stroke }}>
        {isCurrent ? 'Current' : typeLabel}
      </span>
      <p className="popup-name">{displayName}</p>
      {hasName && <p className="popup-words">{words}</p>}
      {!isCurrent && (
        <button
          className="popup-link"
          onClick={() => navigate(`/${words}`)}
        >
          View Details →
        </button>
      )}
    </div>
  )
}
