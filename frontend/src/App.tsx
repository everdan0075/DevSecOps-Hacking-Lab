/**
 * Main App Component
 *
 * Sets up routing and global providers
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'

// Placeholder pages (will be implemented in Phase 2)
function AttacksPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-matrix mb-4">Attack Scenarios</h1>
      <p className="text-gray-400">Coming soon in Phase 2...</p>
    </div>
  )
}

function MonitoringPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-matrix mb-4">Security Monitoring</h1>
      <p className="text-gray-400">Coming soon in Phase 2...</p>
    </div>
  )
}

function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-matrix mb-4">Documentation</h1>
      <p className="text-gray-400">Coming soon in Phase 2...</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter basename="/DevSecOps-Hacking-Lab">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="attacks" element={<AttacksPage />} />
          <Route path="monitoring" element={<MonitoringPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="docs/:slug" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
