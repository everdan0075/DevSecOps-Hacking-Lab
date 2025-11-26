/**
 * TutorialContext
 *
 * Global context for tutorial mode state
 * Features:
 * - Toggle between friendly (tutorial) and expert modes
 * - Persistent preference via localStorage
 * - Provides event explanation system
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface ExplanationData {
  type: string
  message: string
  timestamp: number
}

interface TutorialContextType {
  tutorialEnabled: boolean
  toggleTutorial: () => void
  showExplanation: (type: string, message: string) => void
  currentExplanation: ExplanationData | null
  clearExplanation: () => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

const TUTORIAL_STORAGE_KEY = 'devsecops_tutorial_mode'

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [tutorialEnabled, setTutorialEnabled] = useState<boolean>(true)
  const [currentExplanation, setCurrentExplanation] = useState<ExplanationData | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(TUTORIAL_STORAGE_KEY)
    if (stored !== null) {
      setTutorialEnabled(stored === 'true')
    }
  }, [])

  const toggleTutorial = useCallback(() => {
    setTutorialEnabled((prev) => {
      const newValue = !prev
      localStorage.setItem(TUTORIAL_STORAGE_KEY, String(newValue))
      return newValue
    })
  }, [])

  const showExplanation = useCallback((type: string, message: string) => {
    setCurrentExplanation({
      type,
      message,
      timestamp: Date.now(),
    })
  }, [])

  const clearExplanation = useCallback(() => {
    setCurrentExplanation(null)
  }, [])

  return (
    <TutorialContext.Provider
      value={{
        tutorialEnabled,
        toggleTutorial,
        showExplanation,
        currentExplanation,
        clearExplanation,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error('useTutorial must be used within TutorialProvider')
  }
  return context
}
