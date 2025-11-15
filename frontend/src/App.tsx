/**
 * Main App Component
 *
 * Sets up routing and global providers
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Attacks } from './pages/Attacks'
import { Monitoring } from './pages/Monitoring'

function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-matrix mb-4">Documentation</h1>
      <p className="text-gray-400">Coming soon in Phase 3...</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/DevSecOps-Hacking-Lab">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="attacks" element={<Attacks />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/:slug" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
