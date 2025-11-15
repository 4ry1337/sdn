#!/usr/bin/env python3
"""
Flow Table Monitoring and Analysis Test
Deep dive into OpenFlow flow tables for SDN observability.

This test demonstrates:
- Flow table population and growth
- Flow entry timeouts (idle/hard)
- Flow priority and matching
- Flow table capacity limits
- Flow statistics collection
- Flow entry patterns (exact match vs wildcards)

Topology:
    h1 --- s1 --- s2 --- h2
            |      |
           h3     h4

Usage:
    sudo python3 08_flow_table_monitoring.py
    sudo python3 08_flow_table_monitoring.py --flows 1000  # Stress test
"""

import time
import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info, warn, error


def flow_monitoring_topology(controller_ip='127.0.0.1', controller_port=6653):
    """Create simple topology for flow monitoring"""

    info('*** Creating flow monitoring network\n')
    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        autoSetMacs=True
    )

    info('*** Adding controller\n')
    c0 = net.addController('c0', controller=RemoteController, ip=controller_ip, port=controller_port)

    info('*** Building topology\n')
    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')

    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')
    h3 = net.addHost('h3', ip='10.0.0.3/24')
    h4 = net.addHost('h4', ip='10.0.0.4/24')

    net.addLink(h1, s1)
    net.addLink(h2, s2)
    net.addLink(h3, s1)
    net.addLink(h4, s2)
    net.addLink(s1, s2)

    info('*** Starting network\n')
    net.start()

    time.sleep(5)
    return net


def show_flow_tables(net, switches=None):
    """Display current flow tables"""

    if switches is None:
        switches = net.switches

    info('\n' + '='*70 + '\n')
    info('*** FLOW TABLE SNAPSHOT ***\n')
    info('='*70 + '\n')

    for switch in switches:
        info(f'\n{switch.name}:\n')

        # Get flow count
        result = switch.cmd('ovs-ofctl dump-flows', switch.name, '-O OpenFlow13 | grep -c "cookie"')
        flow_count = result.strip()
        info(f'  Total flows: {flow_count}\n')

        # Show flow table summary
        result = switch.cmd('ovs-ofctl dump-flows', switch.name, '-O OpenFlow13 --no-stats')
        flows = [f.strip() for f in result.split('\n') if 'cookie' in f]

        # Analyze flows
        priorities = {}
        protocols = {}
        for flow in flows[:10]:  # Show first 10
            # Extract priority
            if 'priority=' in flow:
                try:
                    priority = flow.split('priority=')[1].split(',')[0].split()[0]
                    priorities[priority] = priorities.get(priority, 0) + 1
                except:
                    pass

            # Extract protocol
            for proto in ['tcp', 'udp', 'icmp', 'arp']:
                if proto in flow.lower():
                    protocols[proto] = protocols.get(proto, 0) + 1

        info(f'  Priorities: {priorities}\n')
        info(f'  Protocols: {protocols}\n')

        # Show sample flows
        info(f'\n  Sample flows (first 3):\n')
        for i, flow in enumerate(flows[:3]):
            # Simplify output
            if 'actions=' in flow:
                match = flow.split('actions=')[0]
                action = flow.split('actions=')[1]
                info(f'    [{i+1}] {match}\n')
                info(f'        -> {action}\n')

    info('='*70 + '\n')


def analyze_flow_stats(switch):
    """Analyze detailed flow statistics"""

    info(f'\n*** Analyzing flow statistics for {switch.name}\n')

    # Get flows with stats
    result = switch.cmd('ovs-ofctl dump-flows', switch.name, '-O OpenFlow13')
    flows = result.split('\n')

    total_packets = 0
    total_bytes = 0
    active_flows = 0

    flow_stats = []

    for flow in flows:
        if 'n_packets=' in flow:
            try:
                packets = int(flow.split('n_packets=')[1].split(',')[0])
                bytes_count = int(flow.split('n_bytes=')[1].split(',')[0])

                if packets > 0:
                    active_flows += 1
                    total_packets += packets
                    total_bytes += bytes_count

                    # Extract duration
                    duration = flow.split('duration=')[1].split('s,')[0] if 'duration=' in flow else '0'

                    flow_stats.append({
                        'packets': packets,
                        'bytes': bytes_count,
                        'duration': float(duration)
                    })
            except:
                pass

    info(f'  Active flows (with traffic): {active_flows}\n')
    info(f'  Total packets: {total_packets:,}\n')
    info(f'  Total bytes: {total_bytes:,} ({total_bytes / 1024 / 1024:.2f} MB)\n')

    if flow_stats:
        # Sort by bytes
        flow_stats.sort(key=lambda x: x['bytes'], reverse=True)

        info(f'\n  Top flows by traffic:\n')
        for i, flow in enumerate(flow_stats[:5]):
            rate = flow['bytes'] / flow['duration'] if flow['duration'] > 0 else 0
            info(f'    [{i+1}] {flow["bytes"]:,} bytes, {flow["packets"]:,} packets, '
                 f'{rate / 1024:.1f} KB/s\n')

    return {
        'active_flows': active_flows,
        'total_packets': total_packets,
        'total_bytes': total_bytes
    }


def flow_stress_test(net, num_flows=100):
    """Generate many flows to stress test flow tables"""

    info('\n' + '='*70 + '\n')
    info(f'*** FLOW TABLE STRESS TEST ({num_flows} flows) ***\n')
    info('='*70 + '\n')

    h1, h2, h3, h4 = net.get('h1', 'h2', 'h3', 'h4')
    s1 = net.get('s1')

    # Baseline
    info('*** Baseline flow count\n')
    show_flow_tables(net, [s1])

    # Generate diverse flows using different ports
    info(f'\n*** Generating {num_flows} unique flows\n')
    info('  Using UDP with varying destination ports...\n')

    # Start servers
    for port in range(5001, 5001 + min(num_flows, 100)):
        h2.cmd(f'nc -u -l -p {port} > /dev/null 2>&1 &')

    time.sleep(1)

    # Generate flows
    for i in range(num_flows):
        port = 5001 + (i % 100)
        # Send small packet to create flow entry
        h1.cmd(f'echo "flow_{i}" | nc -u -w 0 10.0.0.2 {port} &')

        if (i + 1) % 20 == 0:
            info(f'  Generated {i + 1}/{num_flows} flows\n')
            time.sleep(0.5)

    info('\n*** Waiting for flow entries to populate (3s)...\n')
    time.sleep(3)

    # Show updated flow table
    info('*** Flow table after stress test\n')
    show_flow_tables(net, [s1])

    # Analyze stats
    stats = analyze_flow_stats(s1)

    info('\n*** Flow stress test complete\n')

    # Cleanup
    h2.cmd('killall nc 2>/dev/null')
    h1.cmd('killall nc 2>/dev/null')

    return stats


def flow_timeout_test(net):
    """Test flow timeout behavior (idle and hard timeouts)"""

    info('\n' + '='*70 + '\n')
    info('*** FLOW TIMEOUT TEST ***\n')
    info('='*70 + '\n')
    info('Testing idle timeout behavior\n')
    info('Flows should expire after inactivity period\n')
    info('='*70 + '\n\n')

    h1, h2 = net.get('h1', 'h2')
    s1 = net.get('s1')

    # Initial ping to create flow
    info('*** Creating initial flows with ping\n')
    h1.cmd('ping -c 3 10.0.0.2')

    show_flow_tables(net, [s1])

    # Monitor flow count over time
    info('\n*** Monitoring flow count over 30 seconds\n')
    info('  (Flows with idle_timeout should expire)\n\n')

    for i in range(6):
        result = s1.cmd('ovs-ofctl dump-flows s1 -O OpenFlow13 | grep -c "cookie"')
        flow_count = result.strip()
        info(f'  t={i*5}s: {flow_count} flows\n')
        time.sleep(5)

    info('\n*** Flow timeout test complete\n')


def run_flow_monitoring(controller_ip='127.0.0.1', controller_port=6653, stress_flows=0):
    """Main flow monitoring test"""

    net = flow_monitoring_topology(controller_ip, controller_port)

    info('\n' + '='*70 + '\n')
    info('*** FLOW TABLE MONITORING TEST ***\n')
    info('='*70 + '\n')
    info('Controller: http://localhost:8080\n')
    info('OpenVis: http://localhost:3000\n')
    info('\nThis test explores OpenFlow flow tables\n')
    info('='*70 + '\n')

    # Initial connectivity
    info('\n*** Testing initial connectivity\n')
    net.pingAll()

    # Show initial flow tables
    show_flow_tables(net)

    # Analyze stats
    s1 = net.get('s1')
    analyze_flow_stats(s1)

    if stress_flows > 0:
        # Run stress test
        flow_stress_test(net, stress_flows)
    else:
        # Run timeout test
        flow_timeout_test(net)

    info('\n*** Entering CLI for manual exploration\n')
    info('*** Useful commands:\n')
    info('  sh ovs-ofctl dump-flows s1 -O OpenFlow13\n')
    info('  sh ovs-ofctl dump-flows s1 -O OpenFlow13 --no-stats\n')
    info('  sh ovs-dpctl show\n')
    info('\n')

    CLI(net)

    info('*** Stopping network\n')
    net.stop()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Flow Table Monitoring Test')
    parser.add_argument(
        '--controller', '-c',
        default='127.0.0.1',
        help='Controller IP (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=6653,
        help='Controller port (default: 6653)'
    )
    parser.add_argument(
        '--flows', '-f',
        type=int,
        default=0,
        help='Number of flows for stress test (default: 0 = timeout test)'
    )
    args = parser.parse_args()

    setLogLevel('info')
    run_flow_monitoring(
        controller_ip=args.controller,
        controller_port=args.port,
        stress_flows=args.flows
    )
