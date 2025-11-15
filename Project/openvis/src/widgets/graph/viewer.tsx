"use client"

import React from "react"
import * as d3 from 'd3'
import { D3Link, D3Node, useGraph } from "@/features/graph"
import { useForceGraph } from "../force-graph/context"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu"
import { ConnectControllerForm } from "@/features/graph/connect_controller"
import './graph.css'
import { ControllerContextMenu, HostContextMenu, LinkContextMenu, SwitchContextMenu } from '../context-menus'
import { NodeType } from '@/entities/graph'
import { useGraphViewer } from './context'

export function GraphViewer() {
  const svg_ref = React.useRef<SVGSVGElement | null>( null )
  const simulation_ref = React.useRef<d3.Simulation<D3Node, D3Link> | null>( null )

  const { params } = useForceGraph()
  const { filters } = useGraphViewer()
  const { nodes, links } = useGraph()

  const [ context_menu, set_context_menu ] = React.useState<{
    type: NodeType | 'link' | null
    data: D3Link | D3Node | null
  }>( {
    type: null,
    data: null,
  } )

  React.useEffect( () => {
    if ( !svg_ref.current ) return
    const svg = d3.select( svg_ref.current )
    svg.selectAll( '*' ).remove()
    if ( nodes.length === 0 ) return
    const width = svg_ref.current.clientWidth || 800
    const height = svg_ref.current.clientHeight || 600

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent( [ 0.1, 4 ] )
      .on( 'zoom', ( event ) => {
        container.attr( 'transform', event.transform )
      } )
    svg.call( zoom )

    const simulation = d3.forceSimulation<D3Node>( nodes )
      .force( 'charge', d3.forceManyBody().strength( -1 * params.value.repelForce ) )
      .force( 'link', d3.forceLink<D3Node, D3Link>( links )
        .id( d => d.id )
        .distance( params.value.linkDistance )
        .strength( params.value.linkForce )
      )
      .force( 'center', d3.forceCenter( width / 2, height / 2 ).strength( params.value.centerForce ) )
      .force( 'collision', d3.forceCollide<D3Node>().radius( 30 ) )

    simulation_ref.current = simulation

    const container = svg.append( 'g' ).attr( 'class', 'zoom-container' )

    const link_group = container.append( 'g' )
      .attr( 'class', 'links' )
      .selectAll( 'g' )
      .data( links )
      .join( 'g' )

    link_group.append( 'line' )
      .attr( 'class', 'graph-link' )
      .attr( 'stroke', d => {
        const utilization = d.metrics?.utilization ?? 0
        if ( utilization === 0 ) return 'var(--foreground)'

        const maxUtil = Math.max( ...links.map( l => l.metrics?.utilization ?? 0 ) )
        const normalizedUtil = maxUtil > 0 ? utilization / maxUtil : 0

        const green = { r: 34, g: 197, b: 94 }
        const red = { r: 239, g: 68, b: 68 }
        const r = Math.round( green.r + ( red.r - green.r ) * normalizedUtil )
        const g = Math.round( green.g + ( red.g - green.g ) * normalizedUtil )
        const b = Math.round( green.b + ( red.b - green.b ) * normalizedUtil )
        return `rgb(${r},${g},${b})`
      } )

    link_group.append( 'line' )
      .attr( 'class', 'graph-link-overlay' )
      .on( 'mouseenter', ( _event, d ) => {
        set_context_menu( { type: 'link', data: d } )
      } )

    const node = container.append( 'g' )
      .attr( 'class', 'nodes' )
      .selectAll<SVGGElement, D3Node>( 'g' )
      .data( nodes )
      .join( 'g' )
      .attr( 'class', 'graph-node' )
      .style( 'opacity', d => {
        if ( d.type === 'controller' && !filters.value.showControllers ) return 0
        if ( d.type === 'switch' && !filters.value.showSwitches ) return 0
        if ( d.type === 'host' && !filters.value.showHosts ) return 0
        return 1
      } )
      .on( 'mouseenter', ( _event, d ) => {
        set_context_menu( { type: d.type, data: d } )
      } )

    node.append( 'circle' )
      .attr( 'class', 'graph-node-circle' )
      .attr( 'r', 20 )
      .attr( 'fill', d => {
        switch ( d.type ) {
          case 'controller': return '#22c55e'
          case 'switch': return '#3b82f6'
          case 'host': return '#a855f7'
          default: return '#6b7280'
        }
      } )
      .attr( 'stroke', 'white' )

    node.append( 'text' )
      .attr( 'class', 'graph-node-text' )
      .attr( 'y', 35 )
      .text( d => d.label || d.id )

    const drag = d3.drag<SVGGElement, D3Node>()
      .on( 'start', ( event, d ) => {
        if ( !event.active ) simulation.alphaTarget( 0.3 ).restart()
        d.fx = d.x
        d.fy = d.y
        link_group.selectAll<SVGLineElement, D3Link>( '.graph-link' )
          .filter( l => ( l.source as D3Node ).id === d.id || ( l.target as D3Node ).id === d.id )
          .classed( 'graph-link-highlighted', true )
      } )
      .on( 'drag', ( event, d ) => {
        d.fx = event.x
        d.fy = event.y
      } )
      .on( 'end', ( event, d ) => {
        if ( !event.active ) simulation.alphaTarget( 0 )
        d.fx = null
        d.fy = null
        link_group.selectAll( '.graph-link' ).classed( 'graph-link-highlighted', false )
      } )
    node.call( drag )

    simulation.on( 'tick', () => {
      link_group.selectAll<SVGLineElement, D3Link>( 'line' )
        .attr( 'x1', d => ( d.source as D3Node ).x ?? 0 )
        .attr( 'y1', d => ( d.source as D3Node ).y ?? 0 )
        .attr( 'x2', d => ( d.target as D3Node ).x ?? 0 )
        .attr( 'y2', d => ( d.target as D3Node ).y ?? 0 )
      node.attr( 'transform', d => `translate(${d.x ?? 0},${d.y ?? 0})` )
    } )
    return () => {
      simulation.stop()
    }
  }, [ nodes, links, params, filters ] )

  return (
    <ContextMenu onOpenChange={( open ) => {
      if ( !open ) set_context_menu( { type: null, data: null } )
      return !open
    }}>
      <ContextMenuTrigger className="relative overflow-hidden flex flex-1 text-sm">
        <svg ref={svg_ref} className="w-full h-full" />
      </ContextMenuTrigger>
      <ContextMenuContent>
        {context_menu.type === 'link' && context_menu.data && (
          <LinkContextMenu link={context_menu.data as D3Link} />
        )}
        {context_menu.type === 'controller' && context_menu.data && (
          <ControllerContextMenu node={context_menu.data as D3Node} />
        )}
        {context_menu.type === 'switch' && context_menu.data && (
          <SwitchContextMenu node={context_menu.data as D3Node} />
        )}
        {context_menu.type === 'host' && context_menu.data && (
          <HostContextMenu node={context_menu.data as D3Node} />
        )}
        {context_menu.type === null && (
          <ContextMenuSub>
            <ContextMenuSubTrigger>Add controller</ContextMenuSubTrigger>
            <ContextMenuSubContent>
              <ContextMenuSub>
                <ContextMenuSubTrigger>Floodlight</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ConnectControllerForm className="px-2 py-1.5" />
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuSubContent>
          </ContextMenuSub>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
}
