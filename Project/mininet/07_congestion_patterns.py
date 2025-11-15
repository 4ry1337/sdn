#!/usr/bin/env python3
"""
Network Congestion Pattern Test
Tests various traffic patterns and congestion scenarios for SDN observability.

This test demonstrates:
- Elephant flows (large, long-lived flows)
- Mice flows (small, bursty flows)
- Hotspot congestion (many-to-one traffic)
- Broadcast storms
- Traffic shaping and QoS visualization

Topology:
    Servers (elephant flows)
           h1, h2
             |  |
            s1--s2 (bottleneck)
             |  |
           h3, h4
    Clients (mice flows)

Usage:
    sudo python3 07_congestion_patterns.py --pattern elephant
    sudo python3 07_congestion_patterns.py --pattern hotspot
    sudo python3 07_congestion_patterns.py --pattern mixed
"""

import time
import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info, warn
from mininet.link import TCLink


def congestion_topology(controller_ip='127.0.0.1', controller_port=6653):
    """Create topology for congestion testing"""

    info('*** Creating congestion test network\n')
    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        link=TCLink,
        autoSetMacs=True
    )

    info('*** Adding controller\n')
    c0 = net.addController('c0', controller=RemoteController, ip=controller_ip, port=controller_port)

    info('*** Building topology\n')
    # Core switches with bottleneck link
    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')

    # Edge switches
    s3 = net.addSwitch('s3', protocols='OpenFlow13')
    s4 = net.addSwitch('s4', protocols='OpenFlow13')

    # Server hosts (traffic sources)
    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')

    # Client hosts (traffic sinks)
    h3 = net.addHost('h3', ip='10.0.0.3/24')
    h4 = net.addHost('h4', ip='10.0.0.4/24')

    # Additional hosts for complex patterns
    h5 = net.addHost('h5', ip='10.0.0.5/24')
    h6 = net.addHost('h6', ip='10.0.0.6/24')

    # High bandwidth access links
    net.addLink(h1, s1, bw=1000)  # 1 Gbps
    net.addLink(h2, s1, bw=1000)
    net.addLink(h3, s2, bw=1000)
    net.addLink(h4, s2, bw=1000)

    # Additional clients on edge switches
    net.addLink(h5, s3, bw=100)
    net.addLink(h6, s4, bw=100)

    # Core infrastructure
    net.addLink(s1, s3, bw=500)
    net.addLink(s2, s4, bw=500)

    # BOTTLENECK: Limited bandwidth between core switches
    net.addLink(s1, s2, bw=100, delay='5ms')  # 100 Mbps bottleneck with latency
    net.addLink(s3, s4, bw=200)

    info('*** Starting network\n')
    net.start()

    time.sleep(5)

    return net


def elephant_flow_pattern(net, duration=30):
    """Generate elephant flows (large, long-lived)"""

    info('\n' + '='*70 + '\n')
    info('*** ELEPHANT FLOW PATTERN ***\n')
    info('='*70 + '\n')
    info('Simulating large file transfers that saturate links\n')
    info('Watch OpenVis - links should turn RED showing high utilization\n')
    info('='*70 + '\n\n')

    h1, h2, h3, h4 = net.get('h1', 'h2', 'h3', 'h4')

    # Start iperf servers
    info('*** Starting iperf servers\n')
    h3.cmd('iperf -s -p 5001 &')
    h4.cmd('iperf -s -p 5002 &')
    time.sleep(1)

    # Generate elephant flows (TCP, will fill bandwidth)
    info(f'*** Generating elephant flows ({duration}s)\n')
    info('  h1 -> h3: TCP bulk transfer (elephant)\n')
    info('  h2 -> h4: TCP bulk transfer (elephant)\n\n')

    h1.cmd(f'iperf -c 10.0.0.3 -p 5001 -t {duration} -i 5 &')
    h2.cmd(f'iperf -c 10.0.0.4 -p 5002 -t {duration} -i 5 &')

    info('*** Elephant flows running - bottleneck link should be RED in OpenVis\n')
    info(f'*** Monitoring for {duration} seconds...\n\n')

    time.sleep(duration)

    info('*** Elephant flows completed\n')
    cleanup_traffic(net)


def hotspot_pattern(net, duration=30):
    """Generate hotspot congestion (many-to-one)"""

    info('\n' + '='*70 + '\n')
    info('*** HOTSPOT CONGESTION PATTERN ***\n')
    info('='*70 + '\n')
    info('Multiple sources sending to single destination (incast)\n')
    info('Common in data center scenarios (e.g., reduce operations)\n')
    info('Watch OpenVis - links converging on h3 should be RED\n')
    info('='*70 + '\n\n')

    h1, h2, h3, h4, h5, h6 = net.get('h1', 'h2', 'h3', 'h4', 'h5', 'h6')

    # Start iperf server on hotspot destination
    info('*** Starting iperf server on h3 (hotspot destination)\n')
    h3.cmd('iperf -s -p 5001 &')
    time.sleep(1)

    # All other hosts send to h3
    info(f'*** All hosts sending to h3 ({duration}s)\n')
    senders = [h1, h2, h4, h5, h6]
    for i, host in enumerate(senders):
        info(f'  {host.name} -> h3: 20 Mbps UDP\n')
        host.cmd(f'iperf -c 10.0.0.3 -u -b 20M -p 5001 -t {duration} &')
        time.sleep(0.5)  # Stagger start slightly

    info('\n*** Hotspot pattern running - convergent links should be RED\n')
    info(f'*** Total offered load: {len(senders) * 20} Mbps to single destination\n')
    info(f'*** Monitoring for {duration} seconds...\n\n')

    time.sleep(duration)

    info('*** Hotspot pattern completed\n')
    cleanup_traffic(net)


def mixed_pattern(net, duration=40):
    """Generate mixed traffic: elephants + mice"""

    info('\n' + '='*70 + '\n')
    info('*** MIXED TRAFFIC PATTERN ***\n')
    info('='*70 + '\n')
    info('Combination of elephant flows and bursty mice flows\n')
    info('Realistic scenario: background transfers + interactive traffic\n')
    info('='*70 + '\n\n')

    h1, h2, h3, h4, h5, h6 = net.get('h1', 'h2', 'h3', 'h4', 'h5', 'h6')

    # Start servers
    info('*** Starting iperf servers\n')
    for i, host in enumerate([h3, h4, h5, h6]):
        host.cmd(f'iperf -s -p {5001 + i} &')
    time.sleep(1)

    # Elephant flows (background)
    info('*** Starting elephant flows (background)\n')
    info('  h1 -> h3: TCP bulk (elephant)\n')
    h1.cmd(f'iperf -c 10.0.0.3 -p 5001 -t {duration} &')

    time.sleep(2)

    # Mice flows (bursty, short-lived)
    info('*** Starting mice flows (bursty)\n')
    info('  h2, h5, h6 -> various: Short bursts\n\n')

    # Simulate bursty mice flows
    for i in range(duration // 5):
        info(f'  Burst {i+1}/{duration//5}\n')
        h2.cmd('iperf -c 10.0.0.4 -p 5002 -t 2 -u -b 30M &')
        time.sleep(1)
        h5.cmd('iperf -c 10.0.0.6 -p 5004 -t 1 -u -b 15M &')
        time.sleep(2)
        h6.cmd('iperf -c 10.0.0.3 -p 5001 -t 1 -u -b 10M &')
        time.sleep(2)

    info('\n*** Mixed pattern completed\n')
    cleanup_traffic(net)


def oscillating_pattern(net, duration=40):
    """Generate oscillating traffic that creates dynamic congestion"""

    info('\n' + '='*70 + '\n')
    info('*** OSCILLATING TRAFFIC PATTERN ***\n')
    info('='*70 + '\n')
    info('Traffic that ramps up and down periodically\n')
    info('Tests dynamic observability - links should pulse RED/GREEN\n')
    info('='*70 + '\n\n')

    h1, h2, h3, h4 = net.get('h1', 'h2', 'h3', 'h4')

    # Start servers
    h3.cmd('iperf -s -u -p 5001 &')
    h4.cmd('iperf -s -u -p 5002 &')
    time.sleep(1)

    cycles = 4
    for cycle in range(cycles):
        # Ramp up
        info(f'*** Cycle {cycle + 1}/{cycles}: Ramping UP\n')
        bandwidth = 80  # 80 Mbps
        h1.cmd(f'iperf -c 10.0.0.3 -u -b {bandwidth}M -p 5001 -t 5 &')
        h2.cmd(f'iperf -c 10.0.0.4 -u -b {bandwidth}M -p 5002 -t 5 &')
        time.sleep(5)

        # Ramp down (quiet period)
        info(f'*** Cycle {cycle + 1}/{cycles}: Ramping DOWN\n')
        time.sleep(5)

    info('*** Oscillating pattern completed\n')
    cleanup_traffic(net)


def cleanup_traffic(net):
    """Stop all iperf processes"""
    for host in net.hosts:
        host.cmd('killall iperf 2>/dev/null')
    time.sleep(1)


def run_congestion_test(pattern='mixed', controller_ip='127.0.0.1', controller_port=6653):
    """Run congestion test with specified pattern"""

    net = congestion_topology(controller_ip, controller_port)

    info('\n' + '='*70 + '\n')
    info('*** CONGESTION PATTERN TEST ***\n')
    info('='*70 + '\n')
    info(f'Pattern: {pattern}\n')
    info('Controller: http://localhost:8080\n')
    info('OpenVis: http://localhost:3000\n')
    info('\nBottleneck: s1-s2 link (100 Mbps)\n')
    info('Watch link colors change in real-time!\n')
    info('='*70 + '\n')

    time.sleep(2)

    # Run selected pattern
    patterns = {
        'elephant': elephant_flow_pattern,
        'hotspot': hotspot_pattern,
        'mixed': mixed_pattern,
        'oscillating': oscillating_pattern
    }

    if pattern in patterns:
        patterns[pattern](net)
    else:
        warn(f'Unknown pattern: {pattern}\n')
        warn(f'Available: {", ".join(patterns.keys())}\n')

    info('\n*** Test complete. Entering CLI for manual exploration.\n')
    CLI(net)

    info('*** Stopping network\n')
    net.stop()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Network Congestion Pattern Test')
    parser.add_argument(
        '--pattern', '-p',
        choices=['elephant', 'hotspot', 'mixed', 'oscillating'],
        default='mixed',
        help='Traffic pattern to generate (default: mixed)'
    )
    parser.add_argument(
        '--controller', '-c',
        default='127.0.0.1',
        help='Controller IP (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--port',
        type=int,
        default=6653,
        help='Controller port (default: 6653)'
    )
    args = parser.parse_args()

    setLogLevel('info')
    run_congestion_test(
        pattern=args.pattern,
        controller_ip=args.controller,
        controller_port=args.port
    )
