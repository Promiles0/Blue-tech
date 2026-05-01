import { createContext, useContext, useState } from 'react'

const UIContext = createContext(null)

export function UIProvider({ children }) {
  const [cartOpen, setCartOpen]               = useState(false)
  const [paletteOpen, setPaletteOpen]         = useState(false)
  const [mobileNavOpen, setMobileNavOpen]     = useState(false)
  const [quickViewProduct, setQuickViewProduct] = useState(null)

  return (
    <UIContext.Provider value={{
      cartOpen, setCartOpen,
      paletteOpen, setPaletteOpen,
      mobileNavOpen, setMobileNavOpen,
      quickViewProduct, setQuickViewProduct,
    }}>
      {children}
    </UIContext.Provider>
  )
}

export function useUI() {
  const ctx = useContext(UIContext)
  if (!ctx) throw new Error('useUI must be inside UIProvider')
  return ctx
}
