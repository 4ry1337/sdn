#!/usr/bin/env python3
"""
Quick Traffic Test - Simple high load generator
Creates a linear topology and generates continuous high traffic

Usage:
    sudo python3 quick_test.py
"""

from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink
import time


def main():
    setLogLevel('info')

    info('*** Creating network\n')
    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        link=TCLink,
        autoSetMacs=True
    )

    info('*** Adding Floodlight controller\n')
    c0 = net.addController('c0', controller=RemoteController, ip='127.0.0.1', port=6653)

    info('*** Adding switches\n')
    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')
    s3 = net.addSwitch('s3', protocols='OpenFlow13')

    info('*** Adding hosts\n')
    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')
    h3 = net.addHost('h3', ip='10.0.0.3/24')

    info('*** Creating links (100 Mbps)\n')
    # Host to switch links
    net.addLink(h1, s1, bw=100)
    net.addLink(h2, s2, bw=100)
    net.addLink(h3, s3, bw=100)

    # Inter-switch links (these will show high traffic)
    net.addLink(s1, s2, bw=100)
    net.addLink(s2, s3, bw=100)

    info('*** Starting network\n')
    net.start()

    info('*** Waiting for controller connection (10s)...\n')
    time.sleep(10)

    info('*** Testing connectivity\n')
    net.pingAll()

    info('\n*** Starting iperf servers on h2 and h3\n')
    h2.cmd('iperf -s -u &')
    h3.cmd('iperf -s &')
    time.sleep(2)

    info('\n' + '='*70 + '\n')
    info('*** GENERATING HIGH TRAFFIC ***\n')
    info('='*70 + '\n')
    info('h1 -> h2: 80 Mbps UDP (80%% utilization) - Should show RED/YELLOW\n')
    info('h1 -> h3: TCP (will saturate)            - Should show RED\n')
    info('\nOpen OpenVis and watch the links change color!\n')
    info('Traffic will run continuously until you press Ctrl+C\n')
    info('='*70 + '\n\n')

    # Generate high UDP traffic from h1 to h2 (80% utilization)
    h1.cmd('iperf -c 10.0.0.2 -u -b 80M -t 999999 &')

    # Generate TCP traffic from h1 to h3 (will use all available bandwidth)
    h1.cmd('iperf -c 10.0.0.3 -t 999999 &')

    try:
        info('*** Press Ctrl+C to stop and enter CLI, or Ctrl+D to quit\n')
        CLI(net)
    except KeyboardInterrupt:
        info('\n*** Stopping traffic\n')
    finally:
        info('*** Cleaning up\n')
        import os
        os.system('killall iperf 2>/dev/null')
        net.stop()


if __name__ == '__main__':
    main()
