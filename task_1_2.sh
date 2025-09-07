#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4

ovs-ofctl add-flow s1 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s2 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s3 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal

# s1 lo:  s1-eth1:h1-eth0 s1-eth2:h2-eth0 s1-eth3:s2-eth2 s1-eth4:s3-eth3
# s2 lo:  s2-eth1:h3-eth0 s2-eth2:s1-eth3 s2-eth3:s3-eth4 s2-eth4:s4-eth2
# s3 lo:  s3-eth1:h4-eth0 s3-eth2:h5-eth0 s3-eth3:s1-eth4 s3-eth4:s2-eth3 s3-eth5:s4-eth3
# s4 lo:  s4-eth1:h6-eth0 s4-eth2:s2-eth4 s4-eth3:s3-eth5
ovs-ofctl add-flow s1 arp,nw_dst=10.0.0.1,actions=output:1
ovs-ofctl add-flow s1 arp,nw_dst=10.0.0.2,actions=output:2
ovs-ofctl add-flow s1 arp,nw_dst=10.0.0.3,actions=output:3
ovs-ofctl add-flow s1 arp,nw_dst=10.0.0.4,actions=output:4
ovs-ofctl add-flow s1 arp,nw_dst=10.0.0.5,actions=output:4

ovs-ofctl add-flow s2 arp,nw_dst=10.0.0.1,actions=output:2
ovs-ofctl add-flow s2 arp,nw_dst=10.0.0.2,actions=output:2
ovs-ofctl add-flow s2 arp,nw_dst=10.0.0.3,actions=output:1
ovs-ofctl add-flow s2 arp,nw_dst=10.0.0.4,actions=output:3
ovs-ofctl add-flow s2 arp,nw_dst=10.0.0.5,actions=output:3

ovs-ofctl add-flow s3 arp,nw_dst=10.0.0.1,actions=output:3
ovs-ofctl add-flow s3 arp,nw_dst=10.0.0.2,actions=output:3
ovs-ofctl add-flow s3 arp,nw_dst=10.0.0.3,actions=output:4
ovs-ofctl add-flow s3 arp,nw_dst=10.0.0.4,actions=output:1
ovs-ofctl add-flow s3 arp,nw_dst=10.0.0.5,actions=output:2
# ovs-ofctl add-flow s4 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
