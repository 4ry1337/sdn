from mininet.net import Mininet
from mininet.node import Controller, OVSSwitch, RemoteController
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def topo():
    info("Creating Network \n")
    net = Mininet(controller=RemoteController, switch=OVSSwitch)

    info("Adding Network \n")
    c0 = net.addController('c0', ip='172.17.0.1')

    info("Adding Hosts \n")
    h1 = net.addHost('h1')
    h2 = net.addHost('h2')
    h3 = net.addHost('h3')
    h4 = net.addHost('h4')
    
    info("Adding Switches \n")
    s1 = net.addSwitch('s1')
    s2 = net.addSwitch('s2')

    info("Adding Links \n")
    net.addLink(h1, s1)
    net.addLink(h2, s1)
    net.addLink(h3, s2)
    net.addLink(h4, s2)
    net.addLink(h1, s2)

    info("Starting Network \n")
    s1.start([c0])
    s2.start([c0])

    net.start()
    CLI(net)
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    topo()
