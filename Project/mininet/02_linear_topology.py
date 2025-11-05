#!/usr/bin/python

"""
Linear Mininet topology with configurable size
for testing FloodAna SDN visualizer.

Topology:
    h1 --- s1 --- s2 --- s3 --- ... --- sN --- hN

Usage:
    sudo python 02_linear_topology.py
    sudo python 02_linear_topology.py --switches 5
    sudo python 02_linear_topology.py --controller 192.168.1.100 --port 6653
"""

import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def linearTopology(num_switches=4, controller_ip='127.0.0.1', controller_port=6653):
    """Create a linear topology with N switches"""
    
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

    info('*** Adding switches\n')
    switches = []
    for i in range(1, num_switches + 1):
        switch = net.addSwitch('s%d' % i, protocols='OpenFlow13')
        switches.append(switch)
        info('  Added switch s%d\n' % i)

    info('*** Adding hosts\n')
    hosts = []
    for i in range(1, num_switches + 1):
        host = net.addHost('h%d' % i, ip='10.0.0.%d/24' % i)
        hosts.append(host)
        info('  Added host h%d (10.0.0.%d)\n' % (i, i))

    info('*** Creating links\n')
    # Connect each host to its switch
    for i in range(num_switches):
        net.addLink(hosts[i], switches[i])
        info('  h%d --- s%d\n' % (i+1, i+1))
    
    # Connect switches in a line
    for i in range(num_switches - 1):
        net.addLink(switches[i], switches[i + 1])
        info('  s%d --- s%d\n' % (i+1, i+2))

    info('*** Starting network\n')
    net.start()

    info('*** Network topology: Linear with %d switches\n' % num_switches)
    info('*** Controller: Floodlight at %s:%d\n' % (controller_ip, controller_port))
    info('*** Web UI: http://localhost:3000\n')
    info('*** Floodlight API: http://localhost:8080\n')
    info('\n')
    info('*** Test commands:\n')
    info('  mininet> pingall               # Test connectivity\n')
    info('  mininet> h1 ping h%d           # Ping across network\n' % num_switches)
    info('  mininet> iperf h1 h%d          # Test bandwidth\n' % num_switches)
    info('\n')
    info('*** Running CLI. Press Ctrl-D to exit\n')

    CLI(net)

    info('*** Stopping network\n')
    net.stop()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Linear Mininet topology for FloodAna')
    parser.add_argument(
        '--switches', '-s',
        type=int,
        default=4,
        help='Number of switches (default: 4)'
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
    args = parser.parse_args()
    
    setLogLevel('info')
    info('*** Starting linear topology with %d switches\n' % args.switches)
    info('*** Controller at %s:%d\n' % (args.controller, args.port))
    linearTopology(
        num_switches=args.switches,
        controller_ip=args.controller,
        controller_port=args.port
    )
