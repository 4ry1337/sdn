from mininet.net import Mininet
from mininet.node import OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def topo():
    info("Creating Network \n")
    net = Mininet(controller=None, switch=OVSSwitch)

    info("Adding Hosts \n")
    h = []
    for i in range(1, 7):
        host = net.addHost(f'h{i}')
        h.append(host)
    
    info("Adding Switches \n")
    s = []
    for i in range(1, 5):
        switch = net.addSwitch(f's{i}')
        s.append(switch)

    info("Adding Links \n")
    net.addLink(h[0], s[0])
    net.addLink(h[1], s[0])
    net.addLink(h[2], s[1])
    net.addLink(h[3], s[2])
    net.addLink(h[4], s[2])
    net.addLink(h[5], s[3])
    net.addLink(s[0], s[1])
    net.addLink(s[0], s[2])
    net.addLink(s[1], s[2])
    net.addLink(s[1], s[3])
    net.addLink(s[2], s[3])

    info("Starting Network \n")

    net.start()
    CLI(net)
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    topo()
