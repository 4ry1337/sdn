"use client"

import React from "react"
import * as d3 from 'd3'
import { storage } from "@/shared/lib/storage"
import { ForceGraphParams } from './types'
import { D3Link, D3Node, useGraph } from '@/features/graph'

interface ForceGraphContextType {
  params: {
    value: ForceGraphParams
    update: ( params: Partial<ForceGraphParams> ) => void
    reset: () => void
  }
}

export const ForceGraphContext = React.createContext<ForceGraphContextType | undefined>( undefined )

export const ForceGraphProvider = ( {
  children,
  default_params,
}: {
  children: React.ReactNode,
  default_params: ForceGraphParams,
} ) => {
  const [ params, set_params ] = React.useState<ForceGraphParams>( default_params )
  const update_params = React.useCallback( ( params: Partial<ForceGraphParams> ) => {
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
    const saved_params = storage.get<ForceGraphParams>( 'graph_params' )
    update_params( { ...saved_params } )
  }, [] )

  // Debounced save of simulation params
  const save_params = React.useCallback( ( params: ForceGraphParams ) => {
    storage.set( 'graph_params', params )
  }, [] )
  React.useEffect( () => {
    const timeout_id = setTimeout( () => {
      save_params( params )
    }, 500 )
    return () => clearTimeout( timeout_id )
  }, [ params, save_params ] )

  const value: ForceGraphContextType = {
    params: {
      value: params,
      update: update_params,
      reset: reset_params,
    }
  }

  return (
    <ForceGraphContext.Provider value={value}>
      {children}
    </ForceGraphContext.Provider>
  )
}


export function useForceGraph() {
  const context = React.useContext( ForceGraphContext )
  if ( !context ) {
    throw new Error( '[FORCE GRAPH] useGraph must be used within ForceGraphProvider' )
  }
  return context
}
