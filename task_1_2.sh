#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4

# s1 lo:  s1-eth1:h1-eth0 s1-eth2:h2-eth0 s1-eth3:s2-eth2 s1-eth4:s3-eth3

ovs-ofctl add-flow s1 dl_dst=00:00:00:00:00:01,actions=output:1
ovs-ofctl add-flow s1 dl_dst=00:00:00:00:00:02,actions=output:2
ovs-ofctl add-flow s1 dl_dst=00:00:00:00:00:03,actions=output:3
ovs-ofctl add-flow s1 dl_dst=00:00:00:00:00:04,actions=output:4
ovs-ofctl add-flow s1 dl_dst=00:00:00:00:00:05,actions=output:4
ovs-ofctl add-flow s1 dl_type=0x806,nw_proto=1,actions=flood

# s2 lo:  s2-eth1:h3-eth0 s2-eth2:s1-eth3 s2-eth3:s3-eth4 s2-eth4:s4-eth2

ovs-ofctl add-flow s2 dl_dst=00:00:00:00:00:03,actions=output:1
ovs-ofctl add-flow s2 dl_dst=00:00:00:00:00:01,actions=output:2
ovs-ofctl add-flow s2 dl_dst=00:00:00:00:00:02,actions=output:2
ovs-ofctl add-flow s2 dl_dst=00:00:00:00:00:04,actions=output:3
ovs-ofctl add-flow s2 dl_dst=00:00:00:00:00:05,actions=output:3
ovs-ofctl add-flow s2 dl_type=0x806,nw_proto=1,actions=flood

# s3 lo:  s3-eth1:h4-eth0 s3-eth2:h5-eth0 s3-eth3:s1-eth4 s3-eth4:s2-eth3 s3-eth5:s4-eth3

ovs-ofctl add-flow s3 dl_dst=00:00:00:00:00:04,actions=output:1
ovs-ofctl add-flow s3 dl_dst=00:00:00:00:00:05,actions=output:2
ovs-ofctl add-flow s3 dl_dst=00:00:00:00:00:01,actions=output:3
ovs-ofctl add-flow s3 dl_dst=00:00:00:00:00:02,actions=output:3
ovs-ofctl add-flow s3 dl_dst=00:00:00:00:00:03,actions=output:4
ovs-ofctl add-flow s3 dl_type=0x806,nw_proto=1,actions=flood

# s4 lo:  s4-eth1:h6-eth0 s4-eth2:s2-eth4 s4-eth3:s3-eth5

ovs-ofctl add-flow s4 dl_dst=00:00:00:00:00:06,actions=output:1
ovs-ofctl add-flow s4 dl_dst=00:00:00:00:00:01,actions=output:2
ovs-ofctl add-flow s4 dl_dst=00:00:00:00:00:02,actions=output:2
ovs-ofctl add-flow s4 dl_dst=00:00:00:00:00:03,actions=output:2
ovs-ofctl add-flow s4 dl_dst=00:00:00:00:00:04,actions=output:3
ovs-ofctl add-flow s4 dl_dst=00:00:00:00:00:05,actions=output:3
ovs-ofctl add-flow s4 dl_type=0x806,nw_proto=1,actions=flood
