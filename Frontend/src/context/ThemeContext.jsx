import { createContext, useContext, useEffect, useRef, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('noir-theme') || 'dark'
  })

  // Colours fade only when the shopper switches theme, not on first load.
  const firstRun = useRef(true)
  useEffect(() => {
    const root = document.documentElement
    if (!firstRun.current) root.classList.add('theme-switching')
    firstRun.current = false
    root.setAttribute('data-theme', theme)
    localStorage.setItem('noir-theme', theme)
    const id = setTimeout(() => root.classList.remove('theme-switching'), 350)
    return () => clearTimeout(id)
  }, [theme])

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
