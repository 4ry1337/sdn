#!/usr/bin/env python

from mininet.net import Mininet
from mininet.node import OVSController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info

def topo():
    net = Mininet( controller=OVSController, switch=OVSSwitch,
                   waitConnected=True )

    info( "*** Creating (reference) controllers\n" )
    c1 = net.addController( 'c1', port=6633 )
    c2 = net.addController( 'c2', port=6634 )

    info( "*** Creating switches\n" )
    s1 = net.addSwitch( 's1' )
    s2 = net.addSwitch( 's2' )
    s3 = net.addSwitch( 's3' )
    s4 = net.addSwitch( 's4' )
    s5 = net.addSwitch( 's5' )
    s6 = net.addSwitch( 's6' )
    s7 = net.addSwitch( 's7' )
    s8 = net.addSwitch( 's8' )

    info( "*** Creating hosts\n" )
    hosts1 = [ net.addHost( 'h%d' % n ) for n in ( 1, 3 ) ]
    hosts2 = [ net.addHost( 'h%d' % n ) for n in ( 4, 6 ) ]

    info( "*** Creating links\n" )
    net.addLink( s1, hosts1[0] )
    net.addLink( s2, hosts1[1] )
    net.addLink( s3, hosts1[2] )
    net.addLink( s1, s2 )
    net.addLink( s1, s3 )
    net.addLink( s4, s2 )
    net.addLink( s4, s3 )

    net.addLink( s6, hosts2[0] )
    net.addLink( s8, hosts2[1] )
    net.addLink( s8, hosts2[2] )
    net.addLink( s5, s6 )
    net.addLink( s5, s7 )
    net.addLink( s8, s6 )
    net.addLink( s8, s7 )

    net.addLink(s2, s6)
    net.addLink(s3, s7)

    info( "*** Starting network\n" )
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

    info( "*** Testing network\n" )
    net.pingAll()

    info( "*** Running CLI\n" )
    CLI( net )

    info( "*** Stopping network\n" )
    net.stop()


if __name__ == '__main__':
    setLogLevel( 'info' )  # for CLI output
    topo()
