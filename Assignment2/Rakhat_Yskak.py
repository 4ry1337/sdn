#!/usr/bin/python

from mn_wifi.net import Mininet_wifi
from mn_wifi.cli import CLI
from mininet.node import RemoteController
from mininet.log import setLogLevel, info

HOST = "192.168.56.1"
PORTS = [6633, 6634, 6635]


def topology():
    info("*** Starting network\n")
    net = Mininet_wifi(autoSetMacs=True)

    info("*** Creating Controllers\n")
    c1 = net.addController("c1", controller=RemoteController, ip=HOST, port=PORTS[0])
    c2 = net.addController("c2", controller=RemoteController, ip=HOST, port=PORTS[1])
    c3 = net.addController("c3", controller=RemoteController, ip=HOST, port=PORTS[2])

    info("*** Creating Domain 1\n")
    c1_ap1 = net.addAccessPoint(
        "c1_ap1", ssid="domain1", mode="g", channel="1", position="10,30,0", range=40
    )
    c1_s1 = net.addSwitch("c1_s1")
    c1_s2 = net.addSwitch("c1_s2")
    c1_h1 = net.addHost("c1_h1", ip="10.0.0.1/24")
    c1_h2 = net.addHost("c1_h2", ip="10.0.0.2/24")

    info("*** Creating Domain 2\n")
    c2_ap1 = net.addAccessPoint(
        "c2_ap1", ssid="domain2", mode="g", channel="6", position="30,30,0", range=40
    )
    c2_s1 = net.addSwitch("c2_s1")
    c2_s2 = net.addSwitch("c2_s2")
    c2_h1 = net.addHost("c2_h1", ip="10.0.0.5/24")
    c2_h2 = net.addHost("c2_h2", ip="10.0.0.6/24")

    info("*** Creating Domain 3\n")
    c3_ap1 = net.addAccessPoint(
        "c3_ap1", ssid="domain3", mode="g", channel="11", position="50,30,0", range=40
    )
    c3_s1 = net.addSwitch("c3_s1")
    c3_s2 = net.addSwitch("c3_s2")
    c3_h1 = net.addHost("c3_h1", ip="10.0.0.9/24")
    c3_h2 = net.addHost("c3_h2", ip="10.0.0.10/24")

    info("*** Creating Mobile Stations\n")
    sta1 = net.addStation("sta1", ip="10.0.0.13/24", position="10,20,0")
    sta2 = net.addStation("sta2", ip="10.0.0.14/24", position="30,20,0")
    sta3 = net.addStation("sta3", ip="10.0.0.15/24", position="50,20,0")

    info("*** Configuring Propagation Model\n")
    net.setPropagationModel(model="logDistance", exp=4)

    info("*** Creating Domain 1 Internal Links\n")
    net.addLink(c1_ap1, c1_s1)
    net.addLink(c1_s1, c1_s2)
    net.addLink(c1_s2, c1_h1)
    net.addLink(c1_s2, c1_h2)

    info("*** Creating Domain 2 Internal Links\n")
    net.addLink(c2_ap1, c2_s1)
    net.addLink(c2_s1, c2_s2)
    net.addLink(c2_s2, c2_h1)
    net.addLink(c2_s2, c2_h2)

    info("*** Creating Domain 3 Internal Links\n")
    net.addLink(c3_ap1, c3_s1)
    net.addLink(c3_s1, c3_s2)
    net.addLink(c3_s2, c3_h1)
    net.addLink(c3_s2, c3_h2)

    info("*** Creating Inter-Domain Links\n")
    net.addLink(c1_s2, c2_s1)  # Domain 1 <-> Domain 2
    net.addLink(c2_s2, c3_s1)  # Domain 2 <-> Domain 3

    info("*** Configuring WiFi nodes\n")
    net.configureWifiNodes()

    info("*** Building network\n")
    net.build()

    info("*** Assigning controllers to domains\n")
    c1_s1.start([c1])
    c1_s2.start([c1])
    c1_ap1.start([c1])

    c2_s1.start([c2])
    c2_s2.start([c2])
    c2_ap1.start([c2])

    c3_s1.start([c3])
    c3_s2.start([c3])
    c3_ap1.start([c3])

    info("*** Enabling mobility\n")
    net.plotGraph(max_x=100, max_y=100)

    net.startMobility(time=0)
    # sta1: starts at domain1, moves through domain2, ends at domain3
    net.mobility(sta1, "start", time=1, position="10,20,0")
    net.mobility(sta1, "stop", time=60, position="50,20,0")

    # sta2: starts at domain2, moves to domain3
    net.mobility(sta2, "start", time=1, position="30,20,0")
    net.mobility(sta2, "stop", time=60, position="50,25,0")

    # sta3: starts at domain3, moves to domain1
    net.mobility(sta3, "start", time=1, position="50,20,0")
    net.mobility(sta3, "stop", time=60, position="10,25,0")

    net.stopMobility(time=61)

    info("*** Starting CLI\n")
    CLI(net)

    net.stop()


if __name__ == "__main__":
    setLogLevel("info")
    topology()
