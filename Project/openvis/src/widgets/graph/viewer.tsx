"use client"

import React from "react"
import * as d3 from 'd3'
import { D3Link, D3Node, useGraph } from "@/features/graph"
import { useGraphViewer } from "./context"
import { remove_prefix } from "@/shared/lib/utils"
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

export function GraphViewer() {
  const { params, filters } = useGraphViewer()
  const svg_ref = React.useRef<SVGSVGElement | null>( null )
  const simulation_ref = React.useRef<d3.Simulation<D3Node, D3Link> | null>( null )
  const { nodes, links } = useGraph()
  React.useEffect( () => {
    if ( !svg_ref.current || nodes.length === 0 ) return
    const svg = d3.select( svg_ref.current )

    const width = svg_ref.current.clientWidth || 800
    const height = svg_ref.current.clientHeight || 600

    svg.selectAll( '*' ).remove()

    const container = svg.append( 'g' ).attr( 'class', 'zoom-container' )

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

    const link = container.append( 'g' )
      .attr( 'class', 'links' )
      .selectAll( 'line' )
      .data( links )
      .join( 'line' )
      .attr( 'class', 'graph-link' )
      .attr( 'stroke', 'var(--primary)' )

    const node = container.append( 'g' )
      .attr( 'class', 'nodes' )
      .selectAll<SVGGElement, D3Node>( 'g' )
      .data( nodes )
      .join( 'g' )
      .attr( 'id', d => `node-${d.id.replace( /:/g, '-' )}` )
      .attr( 'class', 'node' )

    node.style( 'opacity', d => {
      if ( d.type === 'controller' && !filters.value.showControllers ) return 0
      if ( d.type === 'switch' && !filters.value.showSwitches ) return 0
      if ( d.type === 'host' && !filters.value.showHosts ) return 0
      return 1
    } )

    node.append( 'circle' )
      .attr( 'r', 20 )
      .attr( 'fill', d => {
        switch ( d.type ) {
          case 'controller': return '#22c55e' // green
          case 'switch': return '#3b82f6' // blue
          case 'host': return '#a855f7' // purple
          default: return '#6b7280' // gray
        }
      } )

    node.append( 'text' )
      .text( d => remove_prefix( d.label || d.id ) )
      .attr( 'x', 0 )
      .attr( 'y', 30 )
      .attr( 'text-anchor', 'middle' )
      .attr( 'font-size', '12px' )
      .attr( 'fill', 'var(--foreground)' )


    const drag = d3.drag<SVGGElement, D3Node>()
      .on( 'start', ( event, d ) => {
        if ( !event.active ) simulation.alphaTarget( 0.3 ).restart()
        d.fx = d.x
        d.fy = d.y
        link.filter( l => ( l.source as D3Node ).id === d.id || ( l.target as D3Node ).id === d.id )
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
        link.classed( 'graph-link-highlighted', false )
      } )

    node.call( drag )

    simulation.on( 'tick', () => {
      link
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
    <ContextMenu>
      <ContextMenuTrigger className="relative overflow-hidden flex flex-1 text-sm">
        <svg ref={svg_ref} className="w-full h-full" />
      </ContextMenuTrigger>
      <ContextMenuContent>
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
      </ContextMenuContent>
    </ContextMenu>
  )
}
