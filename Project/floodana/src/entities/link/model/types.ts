import { SimulationLinkDatum } from 'd3';
import { NetworkNode } from '@/entities/node/model/types';

export type LinkStatus = 'active' | 'down';

export interface MetricData {
  [metricName: string]: MetricValue;
}

export interface MetricValue {
  value: number;
  unit: string;
  timestamp: number;
  label?: string;
}

export interface NetworkLink extends SimulationLinkDatum<NetworkNode> {
  id: string;
  source: string | NetworkNode;
  target: string | NetworkNode;
  sourcePort: string;
  targetPort: string;
  bandwidth: number;
  utilization: number;
  latency: number;
  packetLoss: number;
  status: LinkStatus;
  metrics?: MetricData;
  bitsPerSecondRx?: number;
  bitsPerSecondTx?: number;
  packetsPerSecondRx?: number;
  packetsPerSecondTx?: number;
}
