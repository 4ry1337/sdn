from mininet.net import Mininet
from mininet.node import Controller, OVSSwitch
from mininet.cli import CLI
from mininet.link import TCLink
from mininet.log import setLogLevel, info

def topo():
    info("Creating Network \n")
    net = Mininet(controller=Controller, switch=OVSSwitch, link=TCLink)

    info("Adding Network \n")
    c1 = net.addController('c1', ip="172.17.0.1")
    c2 = net.addController('c2', ip="172.17.0.2")

    info("Adding Hosts \n")
    h = []
    for i in range(1, 7):
        host = net.addHost(f'h{i}')
        h.append(host)
    
    info("Adding Switches \n")
    s = []
    for i in range(1, 9):
        switch = net.addSwitch(f's{i}')
        s.append(switch)

    info("Adding Links \n")
    net.addLink(h[0], s[0])
    net.addLink(h[1], s[1])
    net.addLink(h[2], s[2])

    net.addLink(s[0], s[1])
    net.addLink(s[0], s[2])

    net.addLink(s[1], s[3])
    net.addLink(s[2], s[3])

    net.addLink(h[3], s[5])
    net.addLink(h[4], s[7])
    net.addLink(h[5], s[7])

    net.addLink(s[4], s[5])
    net.addLink(s[4], s[6])

    net.addLink(s[5], s[7])
    net.addLink(s[6], s[7])

    net.addLink(s[1], s[5], bw=125, delay='10ms')
    net.addLink(s[2], s[6], bw=100, delay='30ms')

    info("Starting Network \n")
    for switch in s[:4]:  # Switches S1-S4 under Controller 1
        switch.start([c1])
    for switch in s[4:]:  # Switches S5-S8 under Controller 2
        switch.start([c2])

    net.start()
    CLI(net)
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    topo()
