import { Link } from 'react-router-dom'
import './BackButton.css'

export default function BackButton({ to, children }) {
  return (
    <nav className="page-nav">
      <Link to={to} className="nav-back">
        {children}
      </Link>
    </nav>
  )
}
