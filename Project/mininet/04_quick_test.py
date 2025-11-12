"""
Quick high-load traffic test for OpenVis SDN visualizer.
Creates a 3-switch linear topology and generates continuous high traffic.

Topology:
    h1 --- s1 --- s2 --- s3 --- h3
            |             |
           h2            (h2 connects to s2)

Usage:
    sudo python 04_quick_test.py
    sudo python 04_quick_test.py --controller 192.168.1.100 --port 6653
    sudo python 04_quick_test.py --bandwidth 50  # 50 Mbps links
"""

import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info
from mininet.link import TCLink
import time
import os


def quickTrafficTest(controller_ip='127.0.0.1', controller_port=6653, link_bw=100):
    """Create topology and generate high traffic"""

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

    info('*** Creating links (%d Mbps)\n' % link_bw)
    net.addLink(h1, s1, bw=link_bw)
    net.addLink(h2, s2, bw=link_bw)
    net.addLink(h3, s3, bw=link_bw)
    net.addLink(s1, s2, bw=link_bw)
    net.addLink(s2, s3, bw=link_bw)

    info('*** Starting network\n')
    net.start()

    info('*** Waiting for switches to connect to controller...\n')
    time.sleep(10)

    info('*** Testing connectivity\n')
    net.pingAll()

    info('\n*** Starting iperf servers\n')
    h2.cmd('iperf -s -u &')
    h3.cmd('iperf -s &')
    time.sleep(2)

    # Calculate traffic rates
    high_traffic = int(link_bw * 0.85)  # 85% utilization

    info('\n' + '='*70 + '\n')
    info('*** GENERATING HIGH TRAFFIC ***\n')
    info('='*70 + '\n')
    info('h1 -> h2: %d Mbps UDP (85%% utilization)\n' % high_traffic)
    info('h1 -> h3: TCP (will saturate link)\n')
    info('\nOpen OpenVis at http://localhost:3000\n')
    info('Connect to controller: http://%s:8080\n' % controller_ip)
    info('Watch links change color: GREEN -> YELLOW -> RED\n')
    info('='*70 + '\n\n')

    # Generate high traffic
    h1.cmd('iperf -c 10.0.0.2 -u -b %dM -t 999999 &' % high_traffic)
    h1.cmd('iperf -c 10.0.0.3 -t 999999 &')

    try:
        CLI(net)
    except KeyboardInterrupt:
        info('\n*** Interrupted\n')
    finally:
        info('*** Cleaning up\n')
        os.system('killall iperf 2>/dev/null')
        net.stop()


def main():
    parser = argparse.ArgumentParser(description='Quick traffic test for OpenVis')
    parser.add_argument('--controller', default='127.0.0.1',
                        help='Controller IP address (default: 127.0.0.1)')
    parser.add_argument('--port', type=int, default=6653,
                        help='Controller port (default: 6653)')
    parser.add_argument('--bandwidth', type=int, default=100,
                        help='Link bandwidth in Mbps (default: 100)')

    args = parser.parse_args()

    setLogLevel('info')
    quickTrafficTest(args.controller, args.port, args.bandwidth)


if __name__ == '__main__':
    main()
