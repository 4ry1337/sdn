#!/usr/bin/python

"""
Tree Mininet topology with configurable depth and fanout
for testing FloodAna SDN visualizer.

Topology:
                    s1 (root)
                  /  |  \
                s2  s3  s4 (depth 1)
               / |
             s5 s6 (depth 2)
            (with hosts at each switch)

Usage:
    sudo python 03_tree_topology.py
    sudo python 03_tree_topology.py --depth 3 --fanout 3
    sudo python 03_tree_topology.py --controller 192.168.1.100 --port 6653
"""

import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def treeTopology(depth=2, fanout=2, controller_ip='127.0.0.1', controller_port=6653):
    """Create a tree topology with specified depth and fanout"""
    
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

    info('*** Building tree topology (depth=%d, fanout=%d)\n' % (depth, fanout))
    
    switches = []
    hosts = []
    host_counter = 1
    switch_counter = 1
    
    # Create switches and hosts level by level
    def add_tree_level(parent_switch, current_depth):
        nonlocal switch_counter, host_counter
        
        if current_depth > depth:
            return []
        
        children = []
        for _ in range(fanout):
            # Add switch
            switch = net.addSwitch('s%d' % switch_counter, protocols='OpenFlow13')
            switches.append(switch)
            
            # Add host for this switch
            host = net.addHost('h%d' % host_counter, ip='10.0.0.%d/24' % host_counter)
            hosts.append(host)
            
            # Link host to switch
            net.addLink(host, switch)
            
            # Link switch to parent (if not root)
            if parent_switch is not None:
                net.addLink(parent_switch, switch)
            
            switch_counter += 1
            host_counter += 1
            children.append(switch)
            
            # Recursively add children if not at max depth
            if current_depth < depth:
                add_tree_level(switch, current_depth + 1)
        
        return children
    
    # Build the tree starting with root
    info('*** Adding switches and hosts\n')
    root = net.addSwitch('s1', protocols='OpenFlow13')
    switches.append(root)
    
    # Add host for root
    root_host = net.addHost('h1', ip='10.0.0.1/24')
    hosts.append(root_host)
    net.addLink(root_host, root)
    
    switch_counter = 2
    host_counter = 2
    
    # Build tree from root
    add_tree_level(root, 1)

    info('*** Starting network\n')
    net.start()

    info('*** Network topology: Tree (depth=%d, fanout=%d)\n' % (depth, fanout))
    info('*** Total switches: %d\n' % len(switches))
    info('*** Total hosts: %d\n' % len(hosts))
    info('*** Controller: Floodlight at %s:%d\n' % (controller_ip, controller_port))
    info('*** Web UI: http://localhost:3000\n')
    info('*** Floodlight API: http://localhost:8080\n')
    info('\n')
    info('*** Test commands:\n')
    info('  mininet> pingall               # Test connectivity\n')
    info('  mininet> h1 ping h%d           # Ping across network\n' % len(hosts))
    info('  mininet> iperf h1 h%d          # Test bandwidth\n' % len(hosts))
    info('\n')
    info('*** Running CLI. Press Ctrl-D to exit\n')

    CLI(net)

    info('*** Stopping network\n')
    net.stop()

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Tree Mininet topology for FloodAna')
    parser.add_argument(
        '--depth', '-d',
        type=int,
        default=2,
        help='Tree depth (default: 2)'
    )
    parser.add_argument(
        '--fanout', '-f',
        type=int,
        default=2,
        help='Number of children per switch (default: 2)'
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
    info('*** Starting tree topology (depth=%d, fanout=%d)\n' % (args.depth, args.fanout))
    info('*** Controller at %s:%d\n' % (args.controller, args.port))
    treeTopology(
        depth=args.depth,
        fanout=args.fanout,
        controller_ip=args.controller,
        controller_port=args.port
    )
