from mininet.net import Mininet
from mininet.node import OVSController, OVSSwitch
from mininet.cli import CLI
from mininet.link import TCLink
from mininet.log import setLogLevel, info

def topo():
    info("Creating Network \n")
    net = Mininet(controller=OVSController, switch=OVSSwitch, link=TCLink waitConnected=True)

    info("Adding Network \n")
    c1 = net.addController('c1', ip='127.0.0.1', port=6653)
    c2 = net.addController('c2', ip='127.0.0.1', port=6654)


    info("Adding Switches \n")
    s1 = net.addSwitch('s1')
    s2 = net.addSwitch('s2')
    s3 = net.addSwitch('s3')
    s4 = net.addSwitch('s4')
    s5 = net.addSwitch('s5')
    s6 = net.addSwitch('s6')
    s7 = net.addSwitch('s7')
    s8 = net.addSwitch('s8')

    info("Adding Hosts \n")
    h1 = net.addHost('h1')
    h2 = net.addHost('h2')
    h3 = net.addHost('h3')
    h4 = net.addHost('h4')
    h5 = net.addHost('h5')
    h6 = net.addHost('h6')
    
    info("Adding Links \n")
    net.addLink(h1, s1)
    net.addLink(h2, s2)
    net.addLink(h3, s3)
    net.addLink(h4, s6)
    net.addLink(h5, s8)
    net.addLink(h6, s8)

    net.addLink(s1, s2)
    net.addLink(s1, s3)
    net.addLink(s2, s4)
    net.addLink(s3, s4)

    net.addLink(s5, s6)
    net.addLink(s5, s7)
    net.addLink(s6, s8)
    net.addLink(s7, s8)

    net.addLink(s2, s6, bw=125, delay='10ms')
    net.addLink(s3, s7, bw=100, delay='30ms')

    info("Starting Network \n")
    net.build()
    c1.start()
    c2.start()

    s1.start([c1])
    s2.start([c1])
    s3.start([c1])
    s4.start([c1])

    s5.start([c2])
    s6.start([c2])
    s7.start([c2])
    s8.start([c2])

    info("Running CLI \n")
    CLI(net)

    info("Stopping network \n")
    net.stop()

if __name__ == '__main__':
    setLogLevel('info')
    topo()
