"use client"

import React from 'react'
import { useSearch } from './context'
import { useGraph } from '@/features/graph'
import { D3Node } from '@/features/graph/types'
import { remove_prefix } from '@/shared/lib/utils'

export function SearchBar() {
  const { searchTerm, setSearchTerm, setHighlightedNodeId } = useSearch()
  const { nodes } = useGraph()
  const [ suggestions, setSuggestions ] = React.useState<D3Node[]>( [] )
  const [ showSuggestions, setShowSuggestions ] = React.useState( false )
  const searchRef = React.useRef<HTMLDivElement>( null )

  React.useEffect( () => {
    if ( searchTerm.trim() === '' ) {
      setSuggestions( [] )
      setShowSuggestions( false )
      setHighlightedNodeId( null )
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = nodes.filter( node => {
      const nodeId = remove_prefix( node.id ).toLowerCase()
      const label = node.label?.toLowerCase() || ''

      if ( nodeId.includes( term ) || label.includes( term ) ) {
        return true
      }

      if ( node.type === 'host' ) {
        const mac = node.metadata?.mac?.some( m => m.toLowerCase().includes( term ) )
        const ipv4 = node.metadata?.ipv4?.some( ip => ip.toLowerCase().includes( term ) )
        const ipv6 = node.metadata?.ipv6?.some( ip => ip.toLowerCase().includes( term ) )
        return mac || ipv4 || ipv6
      }

      return false
    } )

    setSuggestions( filtered.slice( 0, 10 ) )
    setShowSuggestions( filtered.length > 0 )
  }, [ searchTerm, nodes, setHighlightedNodeId ] )

  React.useEffect( () => {
    function handleClickOutside( event: MouseEvent ) {
      if ( searchRef.current && !searchRef.current.contains( event.target as Node ) ) {
        setShowSuggestions( false )
      }
    }

    document.addEventListener( 'mousedown', handleClickOutside )
    return () => document.removeEventListener( 'mousedown', handleClickOutside )
  }, [] )

  const handleSelectNode = ( nodeId: string ) => {
    setHighlightedNodeId( nodeId )
    setShowSuggestions( false )
  }

  const handleClear = () => {
    setSearchTerm( '' )
    setHighlightedNodeId( null )
    setSuggestions( [] )
    setShowSuggestions( false )
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchTerm}
          onChange={( e ) => setSearchTerm( e.target.value )}
          onFocus={() => suggestions.length > 0 && setShowSuggestions( true )}
          placeholder="Search by DPID, MAC, IP..."
          className="w-full pl-10 pr-10 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map( ( node ) => (
            <button
              key={node.id}
              onClick={() => handleSelectNode( node.id )}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{
                  backgroundColor:
                    node.type === 'controller' ? '#22c55e' :
                    node.type === 'switch' ? '#3b82f6' :
                    node.type === 'host' ? '#a855f7' : '#6b7280'
                }}
              />
              <div className="flex-1 truncate">
                <div className="font-medium">{node.label || remove_prefix( node.id )}</div>
                <div className="text-xs text-muted-foreground">
                  {node.type === 'host' && node.metadata?.ipv4 && node.metadata.ipv4.length > 0 && (
                    <span>{node.metadata.ipv4[ 0 ]}</span>
                  )}
                  {node.type === 'switch' && (
                    <span>DPID: {remove_prefix( node.id )}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{node.type}</span>
            </button>
          ) )}
        </div>
      )}
    </div>
  )
}
