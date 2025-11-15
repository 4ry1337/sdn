"use client"

import React from 'react'

interface SearchContextValue {
  searchTerm: string
  setSearchTerm: ( term: string ) => void
  highlightedNodeId: string | null
  setHighlightedNodeId: ( id: string | null ) => void
}

const SearchContext = React.createContext<SearchContextValue | undefined>( undefined )

export function SearchProvider( { children }: { children: React.ReactNode } ) {
  const [ searchTerm, setSearchTerm ] = React.useState( '' )
  const [ highlightedNodeId, setHighlightedNodeId ] = React.useState<string | null>( null )

  const value = React.useMemo(
    () => ( {
      searchTerm,
      setSearchTerm,
      highlightedNodeId,
      setHighlightedNodeId,
    } ),
    [ searchTerm, highlightedNodeId ]
  )

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = React.useContext( SearchContext )
  if ( context === undefined ) {
    throw new Error( 'useSearch must be used within a SearchProvider' )
  }
  return context
}
