#!/usr/bin/env python3
"""
Traffic Load Test Script for SDN Observability Tool
Generates various traffic patterns to test bandwidth visualization

Usage:
    sudo python3 traffic_load_test.py

Requirements:
    - Mininet installed
    - Floodlight controller running on localhost:6653
"""

from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink
import time
import threading


def create_topology():
    """Create a test topology with multiple switches and hosts"""
    info('*** Creating network\n')
    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        link=TCLink,
        autoSetMacs=True
    )

    info('*** Adding controller\n')
    # Connect to Floodlight controller
    c0 = net.addController(
        'c0',
        controller=RemoteController,
        ip='127.0.0.1',
        port=6653
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
    # Links between hosts and switches
    net.addLink(h1, s1, bw=100)  # 100 Mbps links
    net.addLink(h2, s2, bw=100)
    net.addLink(h3, s3, bw=100)
    net.addLink(h4, s3, bw=100)

    # Links between switches (these will show high utilization)
    net.addLink(s1, s2, bw=100)
    net.addLink(s2, s3, bw=100)

    return net


def generate_low_traffic(host1, host2, duration=60):
    """Generate low traffic (10-20% utilization)"""
    info(f'*** Starting LOW traffic: {host1.name} -> {host2.name}\n')
    # 10 Mbps on a 100 Mbps link = 10% utilization
    host1.cmd(f'iperf -c {host2.IP()} -u -b 10M -t {duration} &')


def generate_medium_traffic(host1, host2, duration=60):
    """Generate medium traffic (40-60% utilization)"""
    info(f'*** Starting MEDIUM traffic: {host1.name} -> {host2.name}\n')
    # 50 Mbps on a 100 Mbps link = 50% utilization
    host1.cmd(f'iperf -c {host2.IP()} -u -b 50M -t {duration} &')


def generate_high_traffic(host1, host2, duration=60):
    """Generate high traffic (80-95% utilization)"""
    info(f'*** Starting HIGH traffic: {host1.name} -> {host2.name}\n')
    # 85 Mbps on a 100 Mbps link = 85% utilization
    host1.cmd(f'iperf -c {host2.IP()} -u -b 85M -t {duration} &')


def generate_tcp_traffic(host1, host2, duration=60):
    """Generate TCP traffic (will vary based on congestion)"""
    info(f'*** Starting TCP traffic: {host1.name} -> {host2.name}\n')
    host1.cmd(f'iperf -c {host2.IP()} -t {duration} &')


def run_traffic_scenario_1(net):
    """
    Scenario 1: Varying utilization levels
    - Low traffic on one link
    - Medium traffic on another
    - High traffic on another
    """
    info('\n*** Scenario 1: Varying Utilization Levels\n')

    h1, h2, h3, h4 = net.get('h1', 'h2', 'h3', 'h4')

    # Start iperf servers on receiving hosts
    h2.cmd('iperf -s -u &')
    h3.cmd('iperf -s -u &')
    h4.cmd('iperf -s &')

    time.sleep(2)

    # Generate different traffic levels
    generate_low_traffic(h1, h2, duration=120)
    time.sleep(1)
    generate_medium_traffic(h1, h3, duration=120)
    time.sleep(1)
    generate_high_traffic(h1, h4, duration=120)

    info('*** Traffic running for 120 seconds...\n')
    info('*** Check OpenVis - links should show GREEN, YELLOW, and RED colors!\n')
    time.sleep(120)


def run_traffic_scenario_2(net):
    """
    Scenario 2: Burst traffic pattern
    - Start with low traffic
    - Burst to high traffic
    - Back to low
    """
    info('\n*** Scenario 2: Burst Traffic Pattern\n')

    h1, h2 = net.get('h1', 'h2')

    h2.cmd('iperf -s -u &')
    time.sleep(2)

    info('*** Phase 1: Low traffic (30s)\n')
    generate_low_traffic(h1, h2, duration=30)
    time.sleep(30)

    h1.cmd('killall iperf')
    time.sleep(2)

    info('*** Phase 2: HIGH BURST (30s)\n')
    generate_high_traffic(h1, h2, duration=30)
    time.sleep(30)

    h1.cmd('killall iperf')
    time.sleep(2)

    info('*** Phase 3: Back to low (30s)\n')
    generate_low_traffic(h1, h2, duration=30)
    time.sleep(30)


def run_traffic_scenario_3(net):
    """
    Scenario 3: Bidirectional traffic
    - Traffic in both directions to show aggregate bandwidth
    """
    info('\n*** Scenario 3: Bidirectional Traffic\n')

    h1, h2 = net.get('h1', 'h2')

    # Start iperf servers on both hosts
    h1.cmd('iperf -s -u &')
    h2.cmd('iperf -s -u &')
    time.sleep(2)

    info('*** Starting bidirectional medium traffic (60s)\n')
    # 40 Mbps in each direction = 80% total utilization
    h1.cmd(f'iperf -c {h2.IP()} -u -b 40M -t 60 &')
    h2.cmd(f'iperf -c {h1.IP()} -u -b 40M -t 60 &')

    time.sleep(60)


def run_traffic_scenario_4(net):
    """
    Scenario 4: Multi-flow convergence
    - Multiple hosts sending to one host (elephant flows)
    """
    info('\n*** Scenario 4: Multi-flow Convergence (Elephant Flows)\n')

    h1, h2, h3, h4 = net.get('h1', 'h2', 'h3', 'h4')

    h4.cmd('iperf -s -u &')
    time.sleep(2)

    info('*** All hosts sending to h4 - creating congestion!\n')
    # Three hosts sending 40 Mbps each to h4
    h1.cmd(f'iperf -c {h4.IP()} -u -b 40M -t 60 &')
    time.sleep(1)
    h2.cmd(f'iperf -c {h4.IP()} -u -b 40M -t 60 &')
    time.sleep(1)
    h3.cmd(f'iperf -c {h4.IP()} -u -b 40M -t 60 &')

    time.sleep(60)


def run_interactive_mode(net):
    """
    Interactive mode - provides CLI with helper commands
    """
    info('\n*** Interactive Mode\n')
    info('*** Available commands:\n')
    info('    lowtraffic h1 h2    - Generate low traffic from h1 to h2\n')
    info('    medtraffic h1 h2    - Generate medium traffic from h1 to h2\n')
    info('    hightraffic h1 h2   - Generate high traffic from h1 to h2\n')
    info('    stoptraffic         - Stop all iperf traffic\n')
    info('    pingall             - Test connectivity\n')
    info('\n')

    CLI(net)


def cleanup_iperf():
    """Kill all iperf processes"""
    import os
    os.system('killall iperf 2>/dev/null')


def main():
    """Main function"""
    setLogLevel('info')

    net = create_topology()

    info('*** Starting network\n')
    net.start()

    # Wait for controller connection
    info('*** Waiting for switches to connect to controller...\n')
    time.sleep(10)

    # Test connectivity
    info('*** Testing connectivity with pingall\n')
    net.pingAll()

    # Show menu
    info('\n' + '='*60 + '\n')
    info('*** Traffic Load Test Menu\n')
    info('='*60 + '\n')
    info('1. Scenario 1: Varying Utilization (Low/Medium/High)\n')
    info('2. Scenario 2: Burst Pattern (Low -> High -> Low)\n')
    info('3. Scenario 3: Bidirectional Traffic\n')
    info('4. Scenario 4: Multi-flow Convergence (Elephant Flows)\n')
    info('5. Run ALL scenarios sequentially\n')
    info('6. Interactive Mode (Mininet CLI)\n')
    info('0. Exit\n')
    info('='*60 + '\n')

    try:
        choice = input('Select option: ')

        if choice == '1':
            run_traffic_scenario_1(net)
        elif choice == '2':
            run_traffic_scenario_2(net)
        elif choice == '3':
            run_traffic_scenario_3(net)
        elif choice == '4':
            run_traffic_scenario_4(net)
        elif choice == '5':
            info('\n*** Running all scenarios sequentially...\n')
            run_traffic_scenario_1(net)
            cleanup_iperf()
            time.sleep(5)
            run_traffic_scenario_2(net)
            cleanup_iperf()
            time.sleep(5)
            run_traffic_scenario_3(net)
            cleanup_iperf()
            time.sleep(5)
            run_traffic_scenario_4(net)
        elif choice == '6':
            run_interactive_mode(net)
        elif choice == '0':
            info('*** Exiting...\n')
        else:
            info('*** Invalid choice\n')

    except KeyboardInterrupt:
        info('\n*** Interrupted by user\n')
    finally:
        info('*** Cleaning up...\n')
        cleanup_iperf()
        net.stop()


if __name__ == '__main__':
    main()
