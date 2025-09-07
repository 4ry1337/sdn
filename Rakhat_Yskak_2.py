#!/usr/bin/env python

from mininet.net import Mininet
from mininet.node import OVSController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def topo():
    net = Mininet( controller=OVSController, switch=OVSSwitch,
                   waitConnected=True )

    info( "Creating controllers\n" )
    c1 = net.addController('c1', controller=OVSController, port=6633)
    c2 = net.addController('c2', controller=OVSController, port=6634)

    info( "Creating switches\n" )
    s1 = net.addSwitch( 's1' )
    s2 = net.addSwitch( 's2' )
    s3 = net.addSwitch( 's3' )
    s4 = net.addSwitch( 's4' )
    s5 = net.addSwitch( 's5' )
    s6 = net.addSwitch( 's6' )
    s7 = net.addSwitch( 's7' )
    s8 = net.addSwitch( 's8' )

    info( "Creating hosts\n" )
    h1 = net.addHost( 'h1' )
    h2 = net.addHost( 'h2' )
    h3 = net.addHost( 'h3' )
    h4 = net.addHost( 'h4' )
    h5 = net.addHost( 'h5' )
    h6 = net.addHost( 'h6' )

    info( "Creating links\n" )
    net.addLink( s1, h1 )
    net.addLink( s2, h2 )
    net.addLink( s3, h3 )
    net.addLink( s1, s2 )
    net.addLink( s1, s3 )
    net.addLink( s4, s2 )
    net.addLink( s4, s3 )

    net.addLink( s6, h4 )
    net.addLink( s8, h5 )
    net.addLink( s8, h6 )
    net.addLink( s5, s6 )
    net.addLink( s5, s7 )
    net.addLink( s8, s6 )
    net.addLink( s8, s7 )

    net.addLink(s2, s6)
    net.addLink(s3, s7)

    info( "Starting network\n" )
    net.build()
    c1.start()
    c2.start()
    s1.start( [ c1 ] )
    s2.start( [ c1 ] )
    s3.start( [ c1 ] )
    s4.start( [ c1 ] )
    s5.start( [ c2 ] )
    s6.start( [ c2 ] )
    s7.start( [ c2 ] )
    s8.start( [ c2 ] )

    info( "Testing network\n" )
    net.pingAll()

    info( "Running CLI\n" )
    CLI( net )

    info( "Stopping network\n" )
    net.stop()


if __name__ == '__main__':
    setLogLevel( 'info' )  # for CLI output
    topo()
