"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light"

type ThemeProviderProps = {
  children: React.ReactNode
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

// Helper function to check if user is authenticated
function isUserAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for access token in localStorage
  const accessToken = localStorage.getItem('accessToken')
  if (accessToken) return true
  
  // Check for access token in cookies
  const hasTokenCookie = document.cookie.split(';').some(cookie => 
    cookie.trim().startsWith('accessToken=')
  )
  if (hasTokenCookie) return true
  
  return false
}

// Helper function to get initial theme
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return "light"
  
  // Only restore theme if user is authenticated
  if (!isUserAuthenticated()) return "light"
  
  const savedTheme = localStorage.getItem('theme') as Theme
  return savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light"
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    // Restore theme from localStorage after mount (client-side only)
    const restored = getInitialTheme()
    if (restored !== "light") {
      setTheme(restored)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  // Custom setTheme function that persists to localStorage
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme)
    
    // Only persist theme if user is authenticated
    if (isUserAuthenticated()) {
      localStorage.setItem('theme', newTheme)
    }
  }

  const value = {
    theme,
    setTheme: handleSetTheme,
  }

  return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
