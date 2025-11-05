import { NetworkNode } from '@/entities/node';
import { NetworkLink } from '@/entities/link';
import { transformSwitchToNode, transformDeviceToNode } from './node-transformer';
import { transformLink } from './link-transformer';
import { logger } from '@/shared/lib/logger';

export interface TopologyData {
  nodes: NetworkNode[];
  links: NetworkLink[];
}

export async function fetchAndMergeTopology(apiClient: {
  getSwitches: () => Promise<any>;
  getLinks: () => Promise<any>;
  getDevices: () => Promise<any>;
}): Promise<TopologyData> {
  const startTime = performance.now();

  try {
    // Fetch all data in parallel
    const [switchesData, linksData, devicesData] = await Promise.allSettled([
      apiClient.getSwitches(),
      apiClient.getLinks(),
      apiClient.getDevices(),
    ]);

    // Process switches
    const switches = switchesData.status === 'fulfilled' ? switchesData.value : [];
    const nodes: NetworkNode[] = Array.isArray(switches)
      ? switches.map(transformSwitchToNode)
      : [];

    logger.debug('Transformed switches to nodes', {
      component: 'topology-merger',
      switchCount: nodes.length,
    });

    // Process links
    const links = linksData.status === 'fulfilled' ? linksData.value : [];
    const networkLinks: NetworkLink[] = Array.isArray(links)
      ? links.map(transformLink)
      : [];

    logger.debug('Transformed links', {
      component: 'topology-merger',
      linkCount: networkLinks.length,
    });

    // Process devices (hosts)
    const devices = devicesData.status === 'fulfilled' ? devicesData.value : { devices: [] };
    const deviceArray = Array.isArray(devices) ? devices : devices.devices || [];
    const hostNodes: NetworkNode[] = deviceArray.map(transformDeviceToNode);

    // Add host-to-switch links
    const hostLinks: NetworkLink[] = [];
    deviceArray.forEach((device: any) => {
      if (device.attachmentPoint && device.attachmentPoint.length > 0) {
        const ap = device.attachmentPoint[0];
        const mac = device.mac?.[0] || 'unknown';
        
        hostLinks.push({
          id: `link-host-${mac}-${ap.switch}-${ap.port}`,
          source: `host-${mac}`,
          target: `switch-${ap.switch}`,
          sourcePort: '0',
          targetPort: String(ap.port),
          bandwidth: 1000000000,
          utilization: 0,
          latency: 0,
          packetLoss: 0,
          status: 'active',
        });
      }
    });

    logger.debug('Created host links', {
      component: 'topology-merger',
      hostCount: hostNodes.length,
      hostLinkCount: hostLinks.length,
    });

    const allNodes = [...nodes, ...hostNodes];
    const allLinks = [...networkLinks, ...hostLinks];

    const duration = performance.now() - startTime;
    logger.info('Topology merged successfully', {
      component: 'topology-merger',
      duration,
      nodeCount: allNodes.length,
      linkCount: allLinks.length,
    });

    return {
      nodes: allNodes,
      links: allLinks,
    };
  } catch (error) {
    logger.error('Failed to merge topology', {
      component: 'topology-merger',
    }, error as Error);

    // Return empty topology on error
    return {
      nodes: [],
      links: [],
    };
  }
}

// Hash topology for change detection
export function hashTopology(topology: TopologyData): string {
  const nodeIds = topology.nodes.map(n => n.id).sort().join(',');
  const linkIds = topology.links.map(l => l.id).sort().join(',');
  return `${nodeIds}::${linkIds}`;
}

// Detect topology changes
export function detectTopologyChanges(
  oldHash: string,
  newHash: string
): { changed: boolean; type?: string } {
  if (oldHash === newHash) {
    return { changed: false };
  }

  // Basic change detection
  const oldParts = oldHash.split('::');
  const newParts = newHash.split('::');

  if (oldParts[0] !== newParts[0]) {
    return { changed: true, type: 'nodes' };
  }

  if (oldParts[1] !== newParts[1]) {
    return { changed: true, type: 'links' };
  }

  return { changed: true, type: 'unknown' };
}
