import { SimulationNodeDatum } from 'd3';

export type NodeType = 'switch' | 'host' | 'controller';
export type NodeStatus = 'active' | 'inactive' | 'error';

export interface Port {
  portNumber: string;
  name: string;
  state: 'up' | 'down';
  hwAddr: string;
  config: number;
  currentFeatures: number;
  statistics?: PortStatistics;
}

export interface PortStatistics {
  rxPackets: number;
  txPackets: number;
  rxBytes: number;
  txBytes: number;
  rxDropped: number;
  txDropped: number;
  rxErrors: number;
  txErrors: number;
  timestamp: number;
}

export interface NodeStatistics {
  flowCount?: number;
  packetCount?: number;
  byteCount?: number;
  portCount?: number;
}

export interface NetworkNode extends SimulationNodeDatum {
  id: string;
  type: NodeType;
  label: string;
  dpid?: string;
  mac?: string;
  ip?: string;
  status: NodeStatus;
  ports: Port[];
  statistics: NodeStatistics;
  metadata?: Record<string, unknown>;
}
