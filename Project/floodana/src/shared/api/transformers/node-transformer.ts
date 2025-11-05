import { NetworkNode, Port, PortStatistics, NodeStatus } from '@/entities/node';

// Floodlight API response types
interface FloodlightSwitch {
  dpid: string;
  harole?: string;
  inetAddress?: string;
  connectedSince?: number;
  ports?: FloodlightPort[];
}

interface FloodlightPort {
  portNumber: number | string;
  name?: string;
  hardwareAddress?: string;
  state?: number;
  config?: number;
  currentFeatures?: number;
}

interface FloodlightDevice {
  mac: string[];
  ipv4: string[];
  vlan: string[];
  attachmentPoint: Array<{
    switch: string;
    port: number;
  }>;
  lastSeen?: number;
}

export function transformSwitchToNode(switchData: FloodlightSwitch): NetworkNode {
  const dpid = switchData.dpid || 'unknown';
  
  return {
    id: `switch-${dpid}`,
    type: 'switch',
    label: `SW-${dpid.slice(-4)}`,
    dpid,
    status: 'active' as NodeStatus,
    ports: (switchData.ports || []).map(transformPort),
    statistics: {
      portCount: switchData.ports?.length || 0,
    },
    metadata: {
      harole: switchData.harole,
      inetAddress: switchData.inetAddress,
      connectedSince: switchData.connectedSince,
    },
  };
}

export function transformPort(portData: FloodlightPort): Port {
  return {
    portNumber: String(portData.portNumber),
    name: portData.name || `port-${portData.portNumber}`,
    state: portData.state === 0 ? 'up' : 'down',
    hwAddr: portData.hardwareAddress || '00:00:00:00:00:00',
    config: portData.config || 0,
    currentFeatures: portData.currentFeatures || 0,
  };
}

export function transformDeviceToNode(deviceData: FloodlightDevice): NetworkNode {
  const mac = deviceData.mac?.[0] || 'unknown';
  const ip = deviceData.ipv4?.[0];
  
  return {
    id: `host-${mac}`,
    type: 'host',
    label: ip ? `Host-${ip.split('.').pop()}` : `Host-${mac.slice(-4)}`,
    mac,
    ip,
    status: 'active' as NodeStatus,
    ports: [],
    statistics: {},
    metadata: {
      vlan: deviceData.vlan?.[0],
      attachmentPoint: deviceData.attachmentPoint,
      lastSeen: deviceData.lastSeen,
    },
  };
}

export function updatePortStatistics(
  node: NetworkNode,
  portStats: Record<string, any>
): NetworkNode {
  const updatedPorts = node.ports.map((port) => {
    const stats = portStats[port.portNumber];
    if (!stats) return port;

    const statistics: PortStatistics = {
      rxPackets: Number(stats.receivePackets || stats.rxPackets || 0),
      txPackets: Number(stats.transmitPackets || stats.txPackets || 0),
      rxBytes: Number(stats.receiveBytes || stats.rxBytes || 0),
      txBytes: Number(stats.transmitBytes || stats.txBytes || 0),
      rxDropped: Number(stats.receiveDropped || stats.rxDropped || 0),
      txDropped: Number(stats.transmitDropped || stats.txDropped || 0),
      rxErrors: Number(stats.receiveErrors || stats.rxErrors || 0),
      txErrors: Number(stats.transmitErrors || stats.txErrors || 0),
      timestamp: Date.now(),
    };

    return {
      ...port,
      statistics,
    };
  });

  return {
    ...node,
    ports: updatedPorts,
  };
}
