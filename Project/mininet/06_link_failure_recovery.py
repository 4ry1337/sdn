#!/usr/bin/env python3
"""
Link Failure and Recovery Test
Tests SDN network resilience and path reconvergence.

This test demonstrates:
- Link failure simulation (using tc or ifconfig down)
- Automatic path recalculation by controller
- Traffic rerouting through alternate paths
- Link recovery and rebalancing
- Real-time link state monitoring

Topology (Redundant Paths):
         h1
         |
        s1 -------- s2
        |  \      /  |
        |    \  /    |
        |     \/     |
        |     /\     |
        |   /    \   |
        | /        \ |
        s3 -------- s4
         |           |
        h2          h3

Links s1-s2 and s3-s4 provide redundant paths.
When one fails, traffic should reroute automatically.

Usage:
    sudo python3 06_link_failure_recovery.py

    # In CLI, test link failure:
    mininet> link s1 s2 down
    mininet> pingall
    mininet> link s1 s2 up
"""

import time
import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info, warn
from mininet.link import TCLink


def link_failure_topology(controller_ip='127.0.0.1', controller_port=6653, auto_test=False):
    """Create a redundant topology for link failure testing"""

    info('*** Creating network with redundant paths\n')
    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        link=TCLink,
        autoSetMacs=True
    )

    info('*** Adding controller\n')
    c0 = net.addController(
        'c0',
        controller=RemoteController,
        ip=controller_ip,
        port=controller_port
    )

    info('*** Building redundant mesh topology\n')
    # Create switches
    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')
    s3 = net.addSwitch('s3', protocols='OpenFlow13')
    s4 = net.addSwitch('s4', protocols='OpenFlow13')

    # Create hosts
    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')
    h3 = net.addHost('h3', ip='10.0.0.3/24')

    # Host connections
    net.addLink(h1, s1, bw=100)
    net.addLink(h2, s3, bw=100)
    net.addLink(h3, s4, bw=100)

    # Create redundant mesh between switches
    # Primary paths
    link_s1_s2 = net.addLink(s1, s2, bw=100)
    link_s3_s4 = net.addLink(s3, s4, bw=100)

    # Secondary/backup paths
    net.addLink(s1, s3, bw=100)
    net.addLink(s2, s4, bw=100)

    # Cross connections for full redundancy
    net.addLink(s1, s4, bw=50)  # Lower bandwidth backup
    net.addLink(s2, s3, bw=50)  # Lower bandwidth backup

    info('*** Starting network\n')
    net.start()

    info('*** Waiting for network stabilization (5s)...\n')
    time.sleep(5)

    info('\n' + '='*70 + '\n')
    info('*** LINK FAILURE AND RECOVERY TEST ***\n')
    info('='*70 + '\n')
    info('Topology: Redundant mesh with 4 switches, 3 hosts\n')
    info('Multiple paths exist between all nodes\n')
    info('\nController: http://localhost:8080\n')
    info('OpenVis: http://localhost:3000\n')
    info('\nTest Scenarios:\n')
    info('  1. Initial connectivity: pingall\n')
    info('  2. Break primary link:   link s1 s2 down\n')
    info('  3. Watch OpenVis - link should turn gray/disappear\n')
    info('  4. Test rerouting:       pingall (should still work)\n')
    info('  5. Monitor flow tables:  sh ovs-ofctl dump-flows s1 -O OpenFlow13\n')
    info('  6. Restore link:         link s1 s2 up\n')
    info('  7. Watch rebalancing:    links should show updated traffic\n')
    info('='*70 + '\n\n')

    # Test initial connectivity
    info('*** Testing initial connectivity\n')
    net.pingAll()

    if auto_test:
        run_link_failure_test(net, link_s1_s2)
    else:
        info('\n*** Entering CLI mode\n')
        info('*** Try link failure scenarios manually\n')
        CLI(net)

    info('*** Stopping network\n')
    net.stop()


def run_link_failure_test(net, test_link):
    """Run automated link failure test"""

    info('\n*** Starting Automated Link Failure Test\n\n')

    # Phase 1: Baseline
    info('*** Phase 1: Baseline connectivity\n')
    loss_baseline = net.pingAll()
    info(f'  Baseline packet loss: {loss_baseline}%\n\n')

    # Start background traffic
    h1, h2, h3 = net.get('h1', 'h2', 'h3')
    info('*** Starting iperf servers\n')
    h2.cmd('iperf -s -u -p 5001 &')
    h3.cmd('iperf -s -p 5002 &')
    time.sleep(1)

    info('*** Starting background traffic flows\n')
    h1.cmd('iperf -c 10.0.0.2 -u -b 10M -t 60 -p 5001 > /tmp/iperf_h1h2.log 2>&1 &')
    h1.cmd('iperf -c 10.0.0.3 -b 5M -t 60 -p 5002 > /tmp/iperf_h1h3.log 2>&1 &')
    info('  h1 -> h2: 10 Mbps UDP\n')
    info('  h1 -> h3: 5 Mbps TCP\n')
    time.sleep(2)

    # Phase 2: Link failure
    info('\n*** Phase 2: Simulating link failure (s1-s2)\n')
    net.configLinkStatus('s1', 's2', 'down')
    info('  Link s1-s2 is now DOWN\n')
    info('  Traffic should reroute through alternate paths...\n')

    time.sleep(5)  # Wait for reconvergence

    info('\n*** Testing connectivity during failure\n')
    loss_failure = net.pingAll()
    info(f'  Packet loss during failure: {loss_failure}%\n')

    if loss_failure > 0:
        warn('  WARNING: Some packet loss detected during rerouting\n')
    else:
        info('  ✓ Perfect rerouting - no packet loss!\n')

    # Phase 3: Monitor flow tables
    info('\n*** Phase 3: Checking flow table updates\n')
    s1 = net.get('s1')
    flows = s1.cmd('ovs-ofctl dump-flows s1 -O OpenFlow13 | grep -v NXST')
    info(f'  Flow entries on s1:\n')
    for line in flows.split('\n')[:5]:  # Show first 5 flows
        if line.strip():
            info(f'    {line}\n')

    # Phase 4: Link recovery
    info('\n*** Phase 4: Restoring link (s1-s2)\n')
    net.configLinkStatus('s1', 's2', 'up')
    info('  Link s1-s2 is now UP\n')

    time.sleep(5)  # Wait for reconvergence

    info('\n*** Testing connectivity after recovery\n')
    loss_recovery = net.pingAll()
    info(f'  Packet loss after recovery: {loss_recovery}%\n\n')

    # Summary
    info('='*70 + '\n')
    info('*** LINK FAILURE TEST SUMMARY ***\n')
    info('='*70 + '\n')
    info(f'Baseline connectivity:        {loss_baseline}% loss\n')
    info(f'During link failure (s1-s2):  {loss_failure}% loss\n')
    info(f'After link recovery:          {loss_recovery}% loss\n')
    info('='*70 + '\n')

    if loss_failure == 0 and loss_recovery == 0:
        info('\n*** ✓ SUCCESS: Network maintained full connectivity!\n')
        info('*** Path rerouting and recovery worked perfectly.\n\n')
    else:
        warn('\n*** Partial success: Some packet loss during failure/recovery\n')
        warn('*** This is normal for initial flow setup delays\n\n')

    # Clean up background processes
    info('*** Stopping background traffic\n')
    h1.cmd('killall iperf')
    h2.cmd('killall iperf')
    h3.cmd('killall iperf')

    info('*** Press Enter to enter CLI or Ctrl-C to exit...\n')
    try:
        input()
        CLI(net)
    except KeyboardInterrupt:
        info('\n')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Link Failure and Recovery Test')
    parser.add_argument(
        '--controller', '-c',
        default='127.0.0.1',
        help='Controller IP address (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=6653,
        help='Controller port (default: 6653)'
    )
    parser.add_argument(
        '--auto', '-a',
        action='store_true',
        help='Run automated test scenario'
    )
    args = parser.parse_args()

    setLogLevel('info')
    link_failure_topology(
        controller_ip=args.controller,
        controller_port=args.port,
        auto_test=args.auto
    )
