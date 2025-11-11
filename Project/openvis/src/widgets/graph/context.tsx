"use client"

import React from "react"
import { GraphFilters, GraphParams } from "./types"
import { storage } from "@/shared/lib/storage"

interface GraphViewerContextType {
  params: {
    value: GraphParams
    update: ( params: Partial<GraphParams> ) => void
    reset: () => void
  }
  filters: {
    value: GraphFilters
    update: ( params: Partial<GraphFilters> ) => void
    reset: () => void
  }
}

export const GraphViewerContext = React.createContext<GraphViewerContextType | undefined>( undefined )

export const GraphViewerProvider = ( {
  children,
  default_filters,
  default_params,
}: {
  children: React.ReactNode,
  default_params: GraphParams,
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

  const [ params, set_params ] = React.useState<GraphParams>( default_params )
  const update_params = React.useCallback( ( params: Partial<GraphParams> ) => {
    set_params( prev => {
      const updated = { ...prev, ...params }
      storage.set( 'graph_params', updated )
      return updated
    } )
  }, [] )
  const reset_params = React.useCallback( () => {
    set_params( default_params )
    storage.set( 'graph_params', default_params )
  }, [ default_params ] )

  React.useEffect( () => {
    const saved_filters = storage.get<GraphFilters>( 'graph_filters' )
    update_filter( { ...saved_filters } )
    const saved_params = storage.get<GraphParams>( 'graph_params' )
    update_params( { ...saved_params } )
  }, [] )

  // Debounced save of simulation params
  const save_params = React.useCallback( ( params: GraphParams ) => {
    storage.set( 'graph_params', params )
  }, [] )
  React.useEffect( () => {
    const timeout_id = setTimeout( () => {
      save_params( params )
    }, 500 )
    return () => clearTimeout( timeout_id )
  }, [ params, save_params ] )

  const value: GraphViewerContextType = {
    params: {
      value: params,
      update: update_params,
      reset: reset_params,
    },
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
