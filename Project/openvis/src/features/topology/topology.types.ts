import { Node, Link } from '@/entities/graph';

export interface D3Node extends Node {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
  metadata?: Record<string, unknown>;
}

export interface GraphParams {
  centerForce: number;
  repelForce: number;
  linkForce: number;
  linkDistance: number;
}

export interface GraphFilters {
  showControllers: boolean;
  showSwitches: boolean;
  showHosts: boolean;
}

