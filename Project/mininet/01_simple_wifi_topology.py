#!/usr/bin/python

"""
Simple Mininet topology with 3 switches and 4 hosts
for testing FloodAna SDN visualizer.

Topology:
    h1 --- s1 --- s2 --- s3 --- h4
            |            |
           h2           h3

Usage:
    sudo python 01_simple_wifi_topology.py
"""

from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def simpleTopology():
    """Create a simple topology with 3 switches and 4 hosts"""
    
    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        autoSetMacs=True
    )

    info('*** Adding controller\n')
    # Connect to Floodlight controller in Docker
    controller = net.addController(
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
    # Host to switch links
    net.addLink(h1, s1)
    net.addLink(h2, s1)
    net.addLink(h3, s3)
    net.addLink(h4, s3)
    
    # Switch to switch links
    net.addLink(s1, s2)
    net.addLink(s2, s3)

    info('*** Starting network\n')
    net.start()

    info('*** Network topology:\n')
    info('  h1 (10.0.0.1) --- s1 --- s2 --- s3 --- h4 (10.0.0.4)\n')
    info('                     |            |\n')
    info('                    h2           h3\n')
    info('                 (10.0.0.2)   (10.0.0.3)\n')
    info('\n')
    info('*** Controller: Floodlight at 127.0.0.1:6653\n')
    info('*** Web UI: http://localhost:3000\n')
    info('*** Floodlight API: http://localhost:8080\n')
    info('\n')
    info('*** Test commands:\n')
    info('  mininet> pingall               # Test connectivity\n')
    info('  mininet> h1 ping h4            # Ping between hosts\n')
    info('  mininet> iperf h1 h4           # Test bandwidth\n')
    info('  mininet> dpctl dump-flows      # Show flow tables\n')
    info('\n')
    info('*** Running CLI. Press Ctrl-D to exit\n')

    # Start CLI
    CLI(net)

    info('*** Stopping network\n')
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    simpleTopology()
