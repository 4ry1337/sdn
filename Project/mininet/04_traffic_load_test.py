"""
Traffic Load Simulation for Mininet
Tests SDN controller and network performance under load.

Topology (default 4 hosts, 2 switches):
    h1 --- s1 --- s2 --- h2
    h3 ---|      |--- h4

Usage:
    sudo python 04_traffic_load_test.py
    sudo python 04_traffic_load_test.py --hosts 6 --duration 30
    sudo python 04_traffic_load_test.py --hosts 4 --bandwidth 50M --flows 4
    sudo python 04_traffic_load_test.py --controller 192.168.1.100 --port 6653
"""

import argparse
import time
import subprocess
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info, error
from random import sample

def trafficLoadTopology(num_hosts=4, controller_ip='127.0.0.1', controller_port=6653,
                       bandwidth='10M', duration=20, num_flows=None, auto_traffic=True):
    """Create a simple topology for traffic load testing"""

    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        autoSetMacs=True
    )

    info('*** Adding controller\n')
    controller = net.addController(
        'c0',
        controller=RemoteController,
        ip=controller_ip,
        port=controller_port
    )

    info('*** Building simple topology with %d hosts\n' % num_hosts)

    # Create a simple 2-switch linear topology
    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')

    # Connect switches in a line
    net.addLink(s1, s2)

    info('*** Adding hosts\n')
    hosts = []
    switches = [s1, s2]

    for i in range(1, num_hosts + 1):
        host = net.addHost('h%d' % i, ip='10.0.0.%d/24' % i)
        hosts.append(host)
        # Distribute hosts evenly across switches
        switch = switches[(i - 1) % len(switches)]
        net.addLink(host, switch)
        info('  Added h%d (10.0.0.%d) connected to %s\n' % (i, i, switch.name))

    info('*** Starting network\n')
    net.start()

    # Wait for network to stabilize
    info('*** Waiting for network to stabilize...\n')
    time.sleep(2)

    info('*** Network ready!\n')
    info('*** Topology: %d hosts distributed across 2 switches (s1---s2)\n' % num_hosts)
    info('*** Controller: Floodlight at %s:%d\n' % (controller_ip, controller_port))
    info('*** Web UI: http://localhost:3000\n')
    info('*** Floodlight API: http://localhost:8080\n')
    info('\n')

    if auto_traffic:
        info('*** Starting automated traffic generation\n')
        info('*** Configuration:\n')
        info('    - Bandwidth per flow: %s\n' % bandwidth)
        info('    - Duration: %d seconds\n' % duration)
        info('    - Number of flows: %s\n' % (num_flows if num_flows else 'auto'))
        info('\n')

        generate_traffic_load(net, hosts, bandwidth, duration, num_flows)
    else:
        info('*** Manual mode - use CLI to generate traffic\n')
        info('*** Example commands:\n')
        info('  mininet> iperf h1 h2           # Test bandwidth between two hosts\n')
        info('  mininet> h1 ping h2            # Test connectivity\n')
        info('  mininet> pingall               # Test all connectivity\n')
        info('\n')
        CLI(net)

    info('*** Stopping network\n')
    net.stop()


def generate_traffic_load(net, hosts, bandwidth, duration, num_flows):
    """Generate high traffic load between multiple host pairs"""

    if num_flows is None:
        # Default: create a small number of flows for simple testing
        num_flows = max(2, len(hosts) // 2)

    info('*** Setting up iperf servers on all hosts\n')
    # Start iperf servers on all hosts (different ports to allow multiple concurrent flows)
    for i, host in enumerate(hosts):
        port = 5001 + i
        host.cmd('iperf -s -p %d &' % port)
        info('  Started iperf server on %s (port %d)\n' % (host.name, port))

    time.sleep(1)  # Let servers start

    # TODO(human): Implement traffic flow selection strategy
    # This is where you decide which host pairs will exchange traffic.
    # Consider different strategies:
    # 1. Random pairs: sample(pairs, num_flows) for random selection
    # 2. All-to-all: every host talks to every other host
    # 3. Hotspot: many hosts send to one or few destinations
    # 4. Clustered: hosts in groups talk more within groups
    #
    # The function should return a list of (source_host, dest_host, port) tuples
    # where port is the iperf server port on the destination (5001 + dest_index)
    #
    # Example return format: [(hosts[0], hosts[1], 5002), (hosts[2], hosts[3], 5004)]

    traffic_flows = select_traffic_flows(hosts, num_flows)

    info('*** Starting %d concurrent traffic flows\n' % len(traffic_flows))

    # Start traffic generation using popen (thread-safe for Mininet)
    processes = []

    for src, dst, port in traffic_flows:
        info('  Flow: %s -> %s (%s for %ds)\n' % (src.name, dst.name, bandwidth, duration))

        # Use popen instead of cmd for concurrent execution
        cmd = 'iperf -c %s -p %d -b %s -t %d' % (dst.IP(), port, bandwidth, duration)
        proc = src.popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        processes.append((src.name, dst.name, proc))

    info('\n*** Traffic generation in progress...\n')
    info('*** Monitor the network in OpenVis: http://localhost:3000\n')
    info('*** Check Floodlight stats: http://localhost:8080/ui/pages/index.html\n')
    info('\n')

    # Wait for all flows to complete and collect results
    info('*** Waiting for traffic flows to complete...\n')
    results = []
    for src_name, dst_name, proc in processes:
        stdout, stderr = proc.communicate()
        proc.wait()
        results.append((src_name, dst_name, stdout.decode('utf-8')))

    info('*** Traffic generation completed!\n')
    info('*** Results summary:\n')

    # Parse and display results
    for src_name, dst_name, result in results:
        # Extract bandwidth from iperf output
        lines = result.split('\n')
        for line in lines:
            if 'Mbits/sec' in line or 'Kbits/sec' in line:
                info('  %s -> %s: %s\n' % (src_name, dst_name, line.strip()))
                break

    info('\n*** Press Enter to continue or Ctrl-C to exit...\n')
    try:
        input()
        info('*** Entering CLI mode for additional testing\n')
        CLI(net)
    except KeyboardInterrupt:
        info('\n*** Exiting...\n')


def select_traffic_flows(hosts, num_flows):
    """
    Select which host pairs will exchange traffic.

    Args:
        hosts: List of Mininet host objects
        num_flows: Desired number of concurrent traffic flows

    Returns:
        List of tuples: (source_host, dest_host, dest_port)
    """
    traffic_flows = []

    # Create all possible pairs (excluding self-connections)
    all_pairs = []
    for i, src in enumerate(hosts):
        for j, dst in enumerate(hosts):
            if i != j:  # Avoid host talking to itself
                dest_port = 5001 + j  # Port matches destination host index
                all_pairs.append((src, dst, dest_port))

    # Limit to requested number of flows
    num_flows = min(num_flows, len(all_pairs))

    # Randomly select flows for diverse traffic patterns
    # This tests controller's ability to handle varied flow table entries
    traffic_flows = sample(all_pairs, num_flows)

    return traffic_flows


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='High Traffic Load Simulation for Mininet')
    parser.add_argument(
        '--hosts', '-n',
        type=int,
        default=4,
        help='Number of hosts (default: 4)'
    )
    parser.add_argument(
        '--controller', '-c',
        default='127.0.0.1',
        help='Floodlight controller IP address (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--port', '-p',
        type=int,
        default=6653,
        help='Floodlight controller port (default: 6653)'
    )
    parser.add_argument(
        '--bandwidth', '-b',
        default='10M',
        help='Bandwidth per flow (e.g., 10M, 100M, 1G) (default: 10M)'
    )
    parser.add_argument(
        '--duration', '-d',
        type=int,
        default=20,
        help='Traffic duration in seconds (default: 20)'
    )
    parser.add_argument(
        '--flows', '-f',
        type=int,
        default=None,
        help='Number of concurrent flows (default: auto-calculated)'
    )
    parser.add_argument(
        '--manual', '-m',
        action='store_true',
        help='Manual mode - open CLI instead of auto-generating traffic'
    )
    args = parser.parse_args()

    setLogLevel('info')
    info('*** High Traffic Load Simulation\n')
    info('*** Hosts: %d, Bandwidth: %s, Duration: %ds\n' %
         (args.hosts, args.bandwidth, args.duration))
    info('*** Controller at %s:%d\n' % (args.controller, args.port))
    info('\n')

    trafficLoadTopology(
        num_hosts=args.hosts,
        controller_ip=args.controller,
        controller_port=args.port,
        bandwidth=args.bandwidth,
        duration=args.duration,
        num_flows=args.flows,
        auto_traffic=not args.manual
    )
