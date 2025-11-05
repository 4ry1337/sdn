import { NetworkLink, LinkStatus } from '@/entities/link';

// Floodlight API response types
interface FloodlightLink {
  'src-switch': string;
  'src-port': number | string;
  'dst-switch': string;
  'dst-port': number | string;
  type?: string;
  direction?: string;
}

interface FloodlightBandwidthStats {
  dpid: string;
  port: number | string;
  'bits-per-second-rx': number;
  'bits-per-second-tx': number;
  timestamp?: number;
}

export function transformLink(linkData: FloodlightLink): NetworkLink {
  const srcDpid = linkData['src-switch'];
  const dstDpid = linkData['dst-switch'];
  const srcPort = String(linkData['src-port']);
  const dstPort = String(linkData['dst-port']);

  return {
    id: `link-${srcDpid}-${srcPort}-${dstDpid}-${dstPort}`,
    source: `switch-${srcDpid}`,
    target: `switch-${dstDpid}`,
    sourcePort: srcPort,
    targetPort: dstPort,
    bandwidth: 1000000000, // 1 Gbps default
    utilization: 0,
    latency: 0,
    packetLoss: 0,
    status: 'active' as LinkStatus,
    bitsPerSecondRx: 0,
    bitsPerSecondTx: 0,
  };
}

export function updateLinkBandwidth(
  link: NetworkLink,
  bandwidthStats: FloodlightBandwidthStats[]
): NetworkLink {
  // Find stats for the source port
  const stats = bandwidthStats.find(
    (s) =>
      s.dpid === extractDpid(link.source as string) &&
      String(s.port) === link.sourcePort
  );

  if (!stats) return link;

  const bitsPerSecondRx = Number(stats['bits-per-second-rx'] || 0);
  const bitsPerSecondTx = Number(stats['bits-per-second-tx'] || 0);
  
  // Calculate utilization percentage (assuming 1 Gbps link)
  const totalBits = bitsPerSecondRx + bitsPerSecondTx;
  const utilization = Math.min(100, (totalBits / link.bandwidth) * 100);

  return {
    ...link,
    bitsPerSecondRx,
    bitsPerSecondTx,
    utilization: Math.round(utilization * 100) / 100, // Round to 2 decimals
    metrics: {
      ...link.metrics,
      bandwidth: {
        value: totalBits,
        unit: 'bps',
        timestamp: Date.now(),
        label: 'Bandwidth',
      },
    },
  };
}

export function calculateLinkLatency(link: NetworkLink, latencyMs: number): NetworkLink {
  return {
    ...link,
    latency: latencyMs,
    metrics: {
      ...link.metrics,
      latency: {
        value: latencyMs,
        unit: 'ms',
        timestamp: Date.now(),
        label: 'Latency',
      },
    },
  };
}

// Helper to extract DPID from node ID
function extractDpid(nodeId: string): string {
  return nodeId.replace('switch-', '').replace('host-', '');
}
