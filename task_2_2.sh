#!/bin/bash

ovs-ofctl add-flow s1 priority=1000,arp,actions=flood
ovs-ofctl add-flow s2 priority=1000,arp,actions=flood 
ovs-ofctl add-flow s3 priority=1000,arp,actions=flood
ovs-ofctl add-flow s4 priority=1000,arp,actions=flood
ovs-ofctl add-flow s5 priority=1000,arp,actions=flood
ovs-ofctl add-flow s6 priority=1000,arp,actions=flood
ovs-ofctl add-flow s7 priority=1000,arp,actions=flood
ovs-ofctl add-flow s8 priority=1000,arp,actions=flood

ovs-ofctl add-flow s2 priority=2000,ip,nw_dst=10.0.0.4,actions=output:3  # h4 via s6
ovs-ofctl add-flow s2 priority=2000,ip,nw_dst=10.0.0.5,actions=output:3  # h5 via s6  
ovs-ofctl add-flow s2 priority=2000,ip,nw_dst=10.0.0.6,actions=output:3  # h6 via s6

ovs-ofctl add-flow s6 priority=2000,ip,nw_dst=10.0.0.1,actions=output:3  # h1 via s2
ovs-ofctl add-flow s6 priority=2000,ip,nw_dst=10.0.0.2,actions=output:3  # h2 via s2
ovs-ofctl add-flow s6 priority=2000,ip,nw_dst=10.0.0.3,actions=output:3  # h3 via s2

ovs-ofctl add-flow s3 priority=2000,ip,nw_dst=10.0.0.4,actions=output:3  # h4 via s7
ovs-ofctl add-flow s3 priority=2000,ip,nw_dst=10.0.0.5,actions=output:3  # h5 via s7
ovs-ofctl add-flow s3 priority=2000,ip,nw_dst=10.0.0.6,actions=output:3  # h6 via s7

ovs-ofctl add-flow s7 priority=2000,ip,nw_dst=10.0.0.1,actions=output:3  # h1 via s3
ovs-ofctl add-flow s7 priority=2000,ip,nw_dst=10.0.0.2,actions=output:3  # h2 via s3
ovs-ofctl add-flow s7 priority=2000,ip,nw_dst=10.0.0.3,actions=output:3  # h3 via s3

ovs-ofctl add-flow s1 priority=500,actions=flood
ovs-ofctl add-flow s2 priority=500,actions=flood 
ovs-ofctl add-flow s3 priority=500,actions=flood
ovs-ofctl add-flow s4 priority=500,actions=flood

ovs-ofctl add-flow s5 priority=500,actions=flood
ovs-ofctl add-flow s6 priority=500,actions=flood
ovs-ofctl add-flow s7 priority=500,actions=flood 
ovs-ofctl add-flow s8 priority=500,actions=flood
