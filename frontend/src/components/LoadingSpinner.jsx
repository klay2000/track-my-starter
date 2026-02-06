import './LoadingSpinner.css'

export default function LoadingSpinner({ message }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      {message && <p>{message}</p>}
    </div>
  )
}
