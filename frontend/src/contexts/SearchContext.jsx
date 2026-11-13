import { createContext, useContext, useMemo, useState } from 'react'

const SearchContext = createContext(null)

/**
 * Holds the global topbar search query. Only meaningful on the POS screen,
 * where it live-filters the product grid. Other screens navigate with ?q=.
 */
export function SearchProvider({ children }) {
  const [query, setQuery] = useState('')
  const value = useMemo(() => ({ query, setQuery }), [query])
  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error('useSearch must be used within SearchProvider')
  return ctx
}
