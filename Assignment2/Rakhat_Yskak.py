#!/usr/bin/python

from mn_wifi.net import Mininet_wifi
from mn_wifi.cli import CLI
from mininet.node import RemoteController
from mininet.log import setLogLevel, info

HOST = "192.168.56.1"
PORTS = [6653, 6654, 6655]


def topology():
    info("*** Starting network\n")
    net = Mininet_wifi()

    info("*** Creating Controllers\n")
    controllers = []
    for port in PORTS:
        c = net.addController(
            f"c{port}", controller=RemoteController, ip=HOST, port=port
        )
        controllers.append(c)

    info("*** Creating Domain 1\n")
    c1_ap1 = net.addAccessPoint(
        "c1_ap1",
        ssid="domain1-ssid",
        mode="g",
        channel="1",
        position="10,30,0",
        range=120,
    )
    c1_s1 = net.addSwitch("c1_s1", protocols="OpenFlow13")
    c1_s2 = net.addSwitch("c1_s2", protocols="OpenFlow13")
    c1_h1 = net.addHost("c1_h1", ip="10.0.1.1/24")
    c1_h2 = net.addHost("c1_h2", ip="10.0.1.2/24")
    c1_h3 = net.addHost("c1_h3", ip="10.0.1.3/24")
    c1_h4 = net.addHost("c1_h4", ip="10.0.1.4/24")

    info("*** Creating Domain 2\n")
    c2_ap1 = net.addAccessPoint(
        "c2_ap1",
        ssid="domain2-ssid",
        mode="g",
        channel="6",
        position="30,30,0",
        range=120,
    )
    c2_s1 = net.addSwitch("c2_s1", protocols="OpenFlow13")
    c2_s2 = net.addSwitch("c2_s2", protocols="OpenFlow13")
    c2_h1 = net.addHost("c2_h1", ip="10.0.2.1/24")
    c2_h2 = net.addHost("c2_h2", ip="10.0.2.2/24")
    c2_h3 = net.addHost("c2_h3", ip="10.0.2.3/24")
    c2_h4 = net.addHost("c2_h4", ip="10.0.2.4/24")

    info("*** Creating Domain 3\n")
    c3_ap1 = net.addAccessPoint(
        "c3_ap1",
        ssid="domain3-ssid",
        mode="g",
        channel="11",
        position="50,30,0",
        range=120,
    )
    c3_s1 = net.addSwitch("c3_s1", protocols="OpenFlow13")
    c3_s2 = net.addSwitch("c3_s2", protocols="OpenFlow13")
    c3_h1 = net.addHost("c3_h1", ip="10.0.3.1/24")
    c3_h2 = net.addHost("c3_h2", ip="10.0.3.2/24")
    c3_h3 = net.addHost("c3_h3", ip="10.0.3.3/24")
    c3_h4 = net.addHost("c3_h4", ip="10.0.3.4/24")

    info("*** Creating Mobile Stations\n")
    sta1 = net.addStation("sta1", ip="10.0.0.1/24", position="10,20,0", range=120)
    sta2 = net.addStation("sta2", ip="10.0.0.2/24", position="40,10,0", range=120)
    sta3 = net.addStation("sta3", ip="10.0.0.3/24", position="70,30,0", range=120)

    info("*** Configuring nodes\n")
    net.setPropagationModel(model="logDistance", exp=4)
    net.configureWifiNodes()
    net.configureNodes()

    info("*** Creating Domain 1 Internal Links\n")
    net.addLink(c1_ap1, c1_s1)  # AP to first switch
    net.addLink(c1_s1, c1_s2)  # Switch to switch
    net.addLink(c1_s1, c1_h1)  # First switch to host 1
    net.addLink(c1_s1, c1_h2)  # Second switch to host 2
    net.addLink(c1_s2, c1_h3)  # First switch to host 1
    net.addLink(c1_s2, c1_h4)  # Second switch to host 2

    info("*** Creating Domain 2 Internal Links\n")
    net.addLink(c2_ap1, c2_s1)  # AP to first switch
    net.addLink(c2_s1, c2_s2)  # Switch to switch
    net.addLink(c2_s1, c2_h1)  # First switch to host 1
    net.addLink(c2_s1, c2_h2)  # Second switch to host 2
    net.addLink(c2_s2, c2_h3)  # First switch to host 1
    net.addLink(c2_s2, c2_h4)  # Second switch to host 2

    info("*** Creating Domain 3 Internal Links\n")
    net.addLink(c3_ap1, c3_s1)  # AP to first switch
    net.addLink(c3_s1, c3_s2)  # Switch to switch
    net.addLink(c3_s1, c3_h1)  # First switch to host 1
    net.addLink(c3_s1, c3_h2)  # Second switch to host 2
    net.addLink(c3_s2, c3_h3)  # First switch to host 1
    net.addLink(c3_s2, c3_h4)  # Second switch to host 2

    info("*** Creating Inter-Domain Links (Multiple Paths)\n")
    # Path 1: Domain 1 -> Domain 2 -> Domain 3 (through first switches)
    net.addLink(c1_s1, c2_s1)  # Domain 1 to Domain 2
    net.addLink(c2_s1, c3_s1)  # Domain 2 to Domain 3

    # Path 2: Alternate path through second switches
    net.addLink(c1_s2, c2_s2)  # Domain 1 to Domain 2 (alternate)
    net.addLink(c2_s2, c3_s2)  # Domain 2 to Domain 3 (alternate)

    # Path 3: Direct connection between Domain 1 and Domain 3
    net.addLink(c1_s2, c3_s1)  # Domain 1 to Domain 3 (direct)

    info("*** Starting network\n")
    net.build()

    for controller in controllers:
        controller.start()

    info("*** Connecting switches to controllers\n")
    c1_s1.start([controllers[0]])
    c1_s2.start([controllers[0]])
    c2_s1.start([controllers[1]])
    c2_s2.start([controllers[1]])
    c3_s1.start([controllers[2]])
    c3_s2.start([controllers[2]])

    info("*** Connecting access point to controllers\n")
    c1_ap1.start([controllers[0]])
    c2_ap1.start([controllers[1]])
    c3_ap1.start([controllers[2]])

    info("*** Running CLI\n")
    CLI(net)

    info("*** Stopping network\n")
    net.stop()


if __name__ == "__main__":
    setLogLevel("info")
    topology()
