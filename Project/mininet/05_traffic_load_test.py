"""
Comprehensive traffic load test with multiple scenarios for OpenVis.
Tests various traffic patterns to validate bandwidth visualization.

Topology:
    h1 --- s1 --- s2 --- s3 --- h3
                          |
                         h4

Usage:
    sudo python 05_traffic_load_test.py
    sudo python 05_traffic_load_test.py --scenario 1
    sudo python 05_traffic_load_test.py --controller 192.168.1.100
"""

import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink
import time
import os


def createTopology(controller_ip='127.0.0.1', controller_port=6653, link_bw=100):
    """Create test topology"""

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

    info('*** Adding switches\n')
    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')
    s3 = net.addSwitch('s3', protocols='OpenFlow13')

    info('*** Adding hosts\n')
    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')
    h3 = net.addHost('h3', ip='10.0.0.3/24')
    h4 = net.addHost('h4', ip='10.0.0.4/24')

    info('*** Creating links\n')
    net.addLink(h1, s1, bw=link_bw)
    net.addLink(h2, s2, bw=link_bw)
    net.addLink(h3, s3, bw=link_bw)
    net.addLink(h4, s3, bw=link_bw)
    net.addLink(s1, s2, bw=link_bw)
    net.addLink(s2, s3, bw=link_bw)

    info('*** Starting network\n')
    net.start()

    info('*** Waiting for controller...\n')
    time.sleep(10)

    info('*** Testing connectivity\n')
    net.pingAll()

    return net


def scenario1(net, link_bw=100):
    """Varying utilization: low, medium, high traffic simultaneously"""
    info('\n=== Scenario 1: Varying Utilization ===\n')

    h1, h2, h3, h4 = net.get('h1', 'h2', 'h3', 'h4')

    # Start servers
    h2.cmd('iperf -s -u &')
    h3.cmd('iperf -s -u &')
    h4.cmd('iperf -s -u &')
    time.sleep(2)

    # Calculate rates
    low = int(link_bw * 0.15)    # 15% - GREEN
    medium = int(link_bw * 0.55) # 55% - YELLOW
    high = int(link_bw * 0.85)   # 85% - RED

    info('  h1 -> h2: %d Mbps (LOW - GREEN)\n' % low)
    info('  h1 -> h3: %d Mbps (MEDIUM - YELLOW)\n' % medium)
    info('  h1 -> h4: %d Mbps (HIGH - RED)\n' % high)
    info('  Duration: 120 seconds\n\n')

    h1.cmd('iperf -c 10.0.0.2 -u -b %dM -t 120 &' % low)
    h1.cmd('iperf -c 10.0.0.3 -u -b %dM -t 120 &' % medium)
    h1.cmd('iperf -c 10.0.0.4 -u -b %dM -t 120 &' % high)

    time.sleep(120)


def scenario2(net, link_bw=100):
    """Burst pattern: low -> high -> low"""
    info('\n=== Scenario 2: Burst Pattern ===\n')

    h1, h2 = net.get('h1', 'h2')
    h2.cmd('iperf -s -u &')
    time.sleep(2)

    low = int(link_bw * 0.15)
    high = int(link_bw * 0.90)

    info('  Phase 1: Low traffic (30s)\n')
    h1.cmd('iperf -c 10.0.0.2 -u -b %dM -t 30 &' % low)
    time.sleep(30)

    info('  Phase 2: HIGH BURST (30s)\n')
    h1.cmd('iperf -c 10.0.0.2 -u -b %dM -t 30 &' % high)
    time.sleep(30)

    info('  Phase 3: Back to low (30s)\n')
    h1.cmd('iperf -c 10.0.0.2 -u -b %dM -t 30 &' % low)
    time.sleep(30)


def scenario3(net, link_bw=100):
    """Bidirectional traffic"""
    info('\n=== Scenario 3: Bidirectional Traffic ===\n')

    h1, h2 = net.get('h1', 'h2')

    h1.cmd('iperf -s -u &')
    h2.cmd('iperf -s -u &')
    time.sleep(2)

    rate = int(link_bw * 0.45)  # 45% each direction = 90% total
    info('  %d Mbps in each direction (90%% total utilization)\n' % rate)
    info('  Duration: 60 seconds\n\n')

    h1.cmd('iperf -c 10.0.0.2 -u -b %dM -t 60 &' % rate)
    h2.cmd('iperf -c 10.0.0.1 -u -b %dM -t 60 &' % rate)

    time.sleep(60)


def scenario4(net, link_bw=100):
    """Multi-flow convergence (elephant flows)"""
    info('\n=== Scenario 4: Multi-flow Convergence ===\n')

    h1, h2, h3, h4 = net.get('h1', 'h2', 'h3', 'h4')

    h4.cmd('iperf -s -u &')
    time.sleep(2)

    rate = int(link_bw * 0.4)
    info('  All hosts -> h4 (%d Mbps each)\n' % rate)
    info('  Creates congestion and packet loss\n')
    info('  Duration: 60 seconds\n\n')

    h1.cmd('iperf -c 10.0.0.4 -u -b %dM -t 60 &' % rate)
    h2.cmd('iperf -c 10.0.0.4 -u -b %dM -t 60 &' % rate)
    h3.cmd('iperf -c 10.0.0.4 -u -b %dM -t 60 &' % rate)

    time.sleep(60)


def trafficLoadTest(controller_ip='127.0.0.1', controller_port=6653,
                    link_bw=100, scenario=0):
    """Run traffic load tests"""

    net = createTopology(controller_ip, controller_port, link_bw)

    if scenario == 0:
        # Show menu
        info('\n' + '='*60 + '\n')
        info('Traffic Load Test Scenarios\n')
        info('='*60 + '\n')
        info('1. Varying Utilization (low/medium/high)\n')
        info('2. Burst Pattern (low -> high -> low)\n')
        info('3. Bidirectional Traffic\n')
        info('4. Multi-flow Convergence\n')
        info('5. Run ALL scenarios\n')
        info('6. Interactive CLI\n')
        info('='*60 + '\n')

        try:
            choice = input('Select scenario: ')
            scenario = int(choice)
        except (ValueError, EOFError):
            scenario = 6

    try:
        if scenario == 1:
            scenario1(net, link_bw)
        elif scenario == 2:
            scenario2(net, link_bw)
        elif scenario == 3:
            scenario3(net, link_bw)
        elif scenario == 4:
            scenario4(net, link_bw)
        elif scenario == 5:
            info('\n*** Running all scenarios...\n')
            scenario1(net, link_bw)
            os.system('killall iperf 2>/dev/null')
            time.sleep(5)
            scenario2(net, link_bw)
            os.system('killall iperf 2>/dev/null')
            time.sleep(5)
            scenario3(net, link_bw)
            os.system('killall iperf 2>/dev/null')
            time.sleep(5)
            scenario4(net, link_bw)
        else:
            info('\n*** Interactive CLI mode\n')
            CLI(net)

    except KeyboardInterrupt:
        info('\n*** Interrupted\n')
    finally:
        info('*** Cleaning up\n')
        os.system('killall iperf 2>/dev/null')
        net.stop()


def main():
    parser = argparse.ArgumentParser(description='Traffic load test for OpenVis')
    parser.add_argument('--controller', default='127.0.0.1',
                        help='Controller IP (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=6653,
                        help='Controller port (default: 6653)')
    parser.add_argument('--bandwidth', type=int, default=100,
                        help='Link bandwidth in Mbps (default: 100)')
    parser.add_argument('--scenario', type=int, default=0,
                        help='Scenario to run: 1-6 (default: 0=menu)')

    args = parser.parse_args()

    setLogLevel('info')
    trafficLoadTest(args.controller, args.port, args.bandwidth, args.scenario)


if __name__ == '__main__':
    main()
