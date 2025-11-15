"use client"

import React from "react"
import { storage } from "@/shared/lib/storage"
import { GraphFilters } from './types'

interface GraphContextType {
  filters: {
    value: GraphFilters
    update: ( params: Partial<GraphFilters> ) => void
    reset: () => void
  }
}

export const GraphViewerContext = React.createContext<GraphContextType | undefined>( undefined )

export const GraphViewerProvider = ( {
  children,
  default_filters,
}: {
  children: React.ReactNode,
  default_filters: GraphFilters
} ) => {
  const [ filters, set_filters ] = React.useState<GraphFilters>( default_filters )
  const update_filter = React.useCallback( ( filters: Partial<GraphFilters> ) => {
    set_filters( prev => {
      const updated = { ...prev, ...filters }
      storage.set( 'graph_filters', updated )
      return updated
    } )
  }, [] )
  const reset_filter = React.useCallback( () => {
    set_filters( default_filters )
    storage.set( 'graph_filters', default_filters )
  }, [ default_filters ] )

  React.useEffect( () => {
    const saved_filters = storage.get<GraphFilters>( 'graph_filters' )
    update_filter( { ...saved_filters } )
  }, [] )

  const value: GraphContextType = {
    filters: {
      value: filters,
      update: update_filter,
      reset: reset_filter,
    }
  }

  return (
    <GraphViewerContext.Provider value={value}>
      {children}
    </GraphViewerContext.Provider>
  )
}

export function useGraphViewer() {
  const context = React.useContext( GraphViewerContext )
  if ( !context ) {
    throw new Error( '[GRAPH VIEWER] useGraph must be used within GraphViewerProvider' )
  }
  return context
}
