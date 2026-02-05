import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Explore from './pages/Explore'
import Starter from './pages/Starter'
import NewStarter from './pages/NewStarter'

const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home apiUrl={API_URL} />} />
        <Route path="/explore" element={<Explore apiUrl={API_URL} />} />
        <Route path="/new" element={<NewStarter apiUrl={API_URL} />} />
        <Route path="/:words" element={<Starter apiUrl={API_URL} />} />
        <Route path="/:words/new" element={<NewStarter apiUrl={API_URL} />} />
      </Routes>
    </div>
  )
}

export default App
