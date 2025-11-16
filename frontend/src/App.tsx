/**
 * Main App Component
 *
 * Sets up routing and global providers
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SecurityProvider } from './contexts/SecurityContext'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Attacks } from './pages/Attacks'
import { Monitoring } from './pages/Monitoring'
import { Docs } from './pages/Docs'

function App() {
  // Use basename only in production (GitHub Pages)
  const basename = import.meta.env.PROD ? '/DevSecOps-Hacking-Lab' : ''

  return (
    <SecurityProvider>
      <BrowserRouter basename={basename}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="attacks" element={<Attacks />} />
            <Route path="monitoring" element={<Monitoring />} />
            <Route path="docs" element={<Docs />} />
            <Route path="docs/:slug" element={<Docs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SecurityProvider>
  )
}

export default App
