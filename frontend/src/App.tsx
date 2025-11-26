/**
 * Main App Component
 *
 * Sets up routing and global providers with lazy loading and page transitions
 */

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { SecurityProvider } from './contexts/SecurityContext'
import { TutorialProvider } from './contexts/TutorialContext'
import { Layout } from './components/Layout'
import { LoadingSkeleton } from './components/LoadingSkeleton'

// Lazy load page components for code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })))
const Attacks = lazy(() => import('./pages/Attacks').then(m => ({ default: m.Attacks })))
const Monitoring = lazy(() => import('./pages/Monitoring').then(m => ({ default: m.Monitoring })))
const WafAnalytics = lazy(() => import('./pages/WafAnalytics').then(m => ({ default: m.WafAnalytics })))
const Siem = lazy(() => import('./pages/Siem').then(m => ({ default: m.Siem })))
const Docs = lazy(() => import('./pages/Docs').then(m => ({ default: m.Docs })))
const Architecture = lazy(() => import('./pages/Architecture').then(m => ({ default: m.Architecture })))
const BattleArena = lazy(() => import('./pages/BattleArena').then(m => ({ default: m.BattleArena })))

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Home />
            </Suspense>
          } />
          <Route path="attacks" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Attacks />
            </Suspense>
          } />
          <Route path="monitoring" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Monitoring />
            </Suspense>
          } />
          <Route path="waf" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <WafAnalytics />
            </Suspense>
          } />
          <Route path="siem" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Siem />
            </Suspense>
          } />
          <Route path="architecture" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Architecture />
            </Suspense>
          } />
          <Route path="battle" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <BattleArena />
            </Suspense>
          } />
          <Route path="docs" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Docs />
            </Suspense>
          } />
          <Route path="docs/:slug" element={
            <Suspense fallback={<LoadingSkeleton variant="page" />}>
              <Docs />
            </Suspense>
          } />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}

function App() {
  // Use basename only in production (GitHub Pages)
  const basename = import.meta.env.PROD ? '/DevSecOps-Hacking-Lab' : ''

  return (
    <SecurityProvider>
      <TutorialProvider>
        <BrowserRouter basename={basename}>
          <AnimatedRoutes />
        </BrowserRouter>
      </TutorialProvider>
    </SecurityProvider>
  )
}

export default App
