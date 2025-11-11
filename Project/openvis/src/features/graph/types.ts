import { Link, Node } from '@/entities/graph'
import { SimulationLinkDatum, SimulationNodeDatum } from 'd3'

export type D3Node = Node & SimulationNodeDatum

export type D3Link = Link & SimulationLinkDatum<D3Node> 
