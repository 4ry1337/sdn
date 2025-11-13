'use client'

import React from 'react'
import { toast } from 'sonner'
import { Controller, ControllerType } from "@/entities/controller"
import { Node, Link } from "@/entities/graph"
import { storage } from '@/shared/lib/storage'
import { D3Link, D3Node } from "./types"
import { ConnectControllerFormValues } from './connect_controller'

interface GraphContextType {
  nodes: D3Node[]
  links: D3Link[]
  graph: {
    controllers: Map<string, Controller>
    connect: ( values: ConnectControllerFormValues ) => Promise<void>
    disconnect: ( url: string ) => void
    retry: ( url: string ) => Promise<void>
  }
}

export const GraphContext = React.createContext<GraphContextType | undefined>( undefined )

export function GraphProvider( { children, ...props }: React.ComponentProps<"div"> ) {
  const [ initialized, set_initialized ] = React.useState( false )

  const [ controllers, set_controllers ] = React.useState<Map<string, Controller>>( new Map() )
  const [ nodes, set_nodes ] = React.useState<D3Node[]>( [] )
  const [ links, set_links ] = React.useState<D3Link[]>( [] )

  const save_controllers = React.useCallback( ( controllers: Map<string, Controller> ) => {
    const controllersArray = Array.from( controllers.values() ).map( c => ( {
      url: c.url,
      interval: c.interval,
    } ) )
    storage.set( 'controllers', controllersArray )
  }, [] )

  const connect_controller = React.useCallback( async ( values: ConnectControllerFormValues ) => {
    if ( controllers.has( values.url ) ) {
      toast.error( `Already connected to ${values.url}` )
      return
    }

    set_controllers( prev => {
      const next = new Map( prev )
      next.set( values.url, {
        url: values.url,
        interval: values.interval,
        status: 'connecting',
        eventSource: null,
        type: values.type
      } )
      return next
    } )

    try {
      await check_controller_health( values.url, values.type )
    } catch ( error ) {
      const message = error instanceof Error ? error.message : 'Health check failed'
      toast.error( message )
      set_controllers( prev => {
        const next = new Map( prev )
        next.set( values.url, {
          url: values.url,
          interval: values.interval,
          status: 'unreachable',
          type: values.type,
          eventSource: null,
        } )
        save_controllers( next )
        return next
      } )
      throw error
    }

    const eventSource = new EventSource( `/api/topology/${values.type}/stream?url=${encodeURIComponent( values.url )}&i=${values.interval}` )

    eventSource.addEventListener( 'topology', ( e ) => {
      try {
        const topology = JSON.parse( e.data )
        set_nodes( prev_nodes => {
          set_links( prev_links => {
            const result = new_topology( values.url, { nodes: prev_nodes, links: prev_links }, topology )
            set_nodes( result.nodes )
            return result.links
          } )
          return prev_nodes
        } )
      } catch ( error ) {
        console.error( '[GRAPH] Failed to parse topology event:', error )
      }
    } )

    eventSource.addEventListener( 'error', ( e: MessageEvent ) => {
      try {
        const errorData = JSON.parse( e.data )
        toast.warning( `${values.url}: ${errorData.message}` )
        if ( errorData.code === 'MAX_ERRORS_REACHED' || errorData.code === 'INITIAL_CONNECTION_FAILED' ) {
          set_controllers( prev => {
            const next = new Map( prev )
            const controller = next.get( values.url )
            if ( controller ) {
              controller.status = 'error'
              next.set( values.url, controller )
              save_controllers( next )
            }
            return next
          } )
          eventSource.close()
        }
      } catch ( error ) {
        console.error( '[GRAPH] Failed to parse error event:', error )
      }
    } )

    set_controllers( prev => {
      const next = new Map( prev )
      next.set( values.url, {
        url: values.url,
        interval: values.interval,
        type: values.type,
        status: 'connected',
        eventSource,
      } )
      save_controllers( next )
      return next
    } )

    toast.success( `Connected to ${values.url}` )
  }, [ controllers, links, save_controllers ] )

  const disconnect_controller = React.useCallback( ( url: string ) => {
    const controller = controllers.get( url )
    if ( !controller ) return

    controller.eventSource?.close()

    set_controllers( prev => {
      const next = new Map( prev )
      next.delete( url )
      save_controllers( next )
      return next
    } )

    set_nodes( prev => prev.filter( n => !n.id.startsWith( url ) ) )
    set_links( prev => prev.filter( l => !( l.source as D3Node ).id.startsWith( url ) && !( l.target as D3Node ).id.startsWith( url ) ) )

    toast.info( `Disconnected from ${url}` )
  }, [ controllers, save_controllers ] )

  const retry_controller = React.useCallback( async ( url: string ) => {
    const controller = controllers.get( url )
    if ( !controller ) return
    set_controllers( prev => {
      const next = new Map( prev )
      const ctrl = next.get( url )
      if ( ctrl ) {
        ctrl.status = 'connecting'
        next.set( url, ctrl )
      }
      return next
    } )
    await connect_controller( { url: url, interval: controller.interval, type: controller.type } )
      .catch( ( error ) => console.error( `Failed to retry ${url}:`, error ) )
  }, [ controllers, connect_controller ] )


  React.useEffect( () => {
    if ( initialized ) return
    set_initialized( true )
    const saved_controllers = storage.get<Array<{ url: string; interval: number }>>( 'controllers' )
    if ( saved_controllers && saved_controllers.length > 0 ) {
      saved_controllers.forEach( async ( { url, interval } ) =>
        await connect_controller( { url, interval, type: "floodlight" } )
          .catch( ( error ) => console.log( `Failed to restore controller ${url}:`, error ) ) )
    }
  }, [ initialized, connect_controller ] )

  React.useEffect( () => {
    const retryInterval = setInterval( () => {
      controllers.forEach( async ( controller ) => {
        if ( controller.status === 'unreachable' ) {
          try {
            await check_controller_health( controller.url, controller.type )
            console.log( `[GRAPH][RETRY] Controller ${controller.url} is back online, reconnecting...` )
            await retry_controller( controller.url )
            toast.success( `Reconnected to ${controller.url}` )
          } catch ( error ) {
            console.log( `[GRAPH][RETRY] Controller ${controller.url} still unreachable` )
            console.error( error )
          }
        }
      } )
    }, 30000 )
    return () => clearInterval( retryInterval )
  }, [ controllers, retry_controller ] )

  const value: GraphContextType = {
    nodes,
    links,
    graph: {
      controllers,
      connect: connect_controller,
      disconnect: disconnect_controller,
      retry: retry_controller,
    },
  }

  return (
    <GraphContext.Provider value={value} {...props} >
      {children}
    </GraphContext.Provider>
  )
}

export function useGraph() {
  const context = React.useContext( GraphContext )
  if ( !context ) {
    throw new Error( '[GRAPH] useGraph must be used within TopologyViewerProvider' )
  }
  return context
}

const graph_changed = (
  existing: { nodes: D3Node[]; links: D3Link[] },
  incoming: { nodes: Node[]; links: Link[] }
): boolean => {
  const existing_nodes = new Set( existing.nodes.map( n => n.id ) )
  const incoming_nodes = new Set( incoming.nodes.map( n => n.id ) )
  const existing_links = new Set( existing.links.map( l => `${l.source_id}->${l.target_id}` ) )
  const incoming_links = new Set( incoming.links.map( l => `${l.source_id}->${l.target_id}` ) )

  if ( existing_nodes.size !== incoming_nodes.size ) return true
  if ( existing_links.size !== incoming_links.size ) return true

  for ( const id of existing_nodes ) {
    if ( !incoming_nodes.has( id ) ) return true
  }
  for ( const id of existing_links ) {
    if ( !incoming_links.has( id ) ) return true
  }

  return false
}

const check_controller_health = async ( url: string, type: ControllerType ): Promise<void> => {
  const response = await fetch( `/api/topology/${type}/health?url=${encodeURIComponent( url )}` )
  if ( !response.ok ) {
    const error = await response.json()
    throw new Error( error.error?.message || 'Health check failed' )
  }
}

const new_topology = ( url: string, existing: { nodes: D3Node[], links: D3Link[] }, incoming: { nodes: Node[]; links: Link[] } ): { nodes: D3Node[], links: D3Link[] } => {
  if ( !graph_changed( existing, incoming ) ) return existing

  const external_nodes = existing.nodes.filter( n => !n.id.startsWith( url ) )
  const internal_nodes = existing.nodes.filter( n => n.id.startsWith( url ) )

  const internal_nodes_map = new Map( internal_nodes.map( n => [ n.id, n ] ) )
  const merged_nodes = incoming.nodes.map( newNode => {
    const existing = internal_nodes_map.get( newNode.id )
    if ( existing ) {
      return {
        ...newNode,
        x: existing.x,
        y: existing.y,
        vx: existing.vx,
        vy: existing.vy,
        fx: existing.fx,
        fy: existing.fy,
      }
    }
    return newNode
  } )
  const new_nodes = [
    ...external_nodes,
    ...merged_nodes
  ]

  const external_links = existing.links.filter( l => !l.source_id.startsWith( url ) )
  const new_nodes_map = new Map( new_nodes.map( n => [ n.id, n ] ) )
  const merged_links = incoming.links.map( link => {
    let source = new_nodes_map.get( link.source_id )
    let target = new_nodes_map.get( link.target_id )
    if ( !source || !target ) {
      return null
    }
    return {
      ...link, // Preserve all link properties including bandwidth metrics
      source,
      target,
    } as D3Link
  } ).filter( link => link !== null )

  const new_links = [
    ...external_links,
    ...merged_links
  ]

  return {
    nodes: new_nodes,
    links: new_links
  }
}
