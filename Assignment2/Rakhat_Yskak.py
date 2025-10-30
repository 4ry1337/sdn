#!/usr/bin/python

from mn_wifi.net import Mininet_wifi
from mn_wifi.cli import CLI
from mininet.node import OVSSwitch, Controller, RemoteController
from mininet.log import info, output, warn

from random import randint

HOST = "192.168.56.1",
PORTS = [6633, 6634, 6635]

def topology():
    info("*** Starting network\n")
    net = Mininet_wifi()

    controllers = []
    for port in PORTS:
        c = net.addController(
            f"c{port}",
            controller=RemoteController,
            ip=HOST,
            port=port
        )
        controllers.append(c)

    info("*** Starting network\n")
    net.build()

    info("*** Running CLI\n")
    CLI(net)

    info("*** Stopping network\n")
    net.stop()

if __name__ == '__main__':
    topology()
