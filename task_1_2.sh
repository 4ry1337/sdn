#!/bin/bash

ovs-ofctl add-flow s1 "priority=200,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal"

ovs-ofctl add-flow s1 "priority=100,arp,nw_src=10.0.0.1,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s1 "priority=100,arp,nw_dst=10.0.0.1,nw_src=10.0.0.6,actions=drop"

ovs-ofctl add-flow s1 "priority=100,arp,nw_src=10.0.0.2,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s1 "priority=100,arp,nw_dst=10.0.0.2,nw_src=10.0.0.6,actions=drop"

ovs-ofctl add-flow s1 "priority=50,arp,nw_dst=10.0.0.1,actions=output:1"
ovs-ofctl add-flow s1 "priority=50,arp,nw_dst=10.0.0.2,actions=output:2"
ovs-ofctl add-flow s1 "priority=50,arp,nw_dst=10.0.0.3,actions=output:3"
ovs-ofctl add-flow s1 "priority=50,arp,nw_dst=10.0.0.4,actions=output:4"
ovs-ofctl add-flow s1 "priority=50,arp,nw_dst=10.0.0.5,actions=output:4"

ovs-ofctl add-flow s2 "priority=200,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal"

ovs-ofctl add-flow s2 "priority=50,arp,nw_dst=10.0.0.1,actions=output:2"
ovs-ofctl add-flow s2 "priority=50,arp,nw_dst=10.0.0.2,actions=output:2"
ovs-ofctl add-flow s2 "priority=50,arp,nw_dst=10.0.0.3,actions=output:1"
ovs-ofctl add-flow s2 "priority=50,arp,nw_dst=10.0.0.4,actions=output:3"
ovs-ofctl add-flow s2 "priority=50,arp,nw_dst=10.0.0.5,actions=output:3"
ovs-ofctl add-flow s2 "priority=50,arp,nw_dst=10.0.0.6,actions=output:4"

ovs-ofctl add-flow s3 "priority=200,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal"

ovs-ofctl add-flow s3 "priority=100,arp,nw_src=10.0.0.4,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s3 "priority=100,arp,nw_dst=10.0.0.4,nw_src=10.0.0.6,actions=drop"

ovs-ofctl add-flow s3 "priority=100,arp,nw_src=10.0.0.5,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s3 "priority=100,arp,nw_dst=10.0.0.5,nw_src=10.0.0.6,actions=drop"

ovs-ofctl add-flow s3 "priority=50,arp,nw_dst=10.0.0.1,actions=output:3"
ovs-ofctl add-flow s3 "priority=50,arp,nw_dst=10.0.0.2,actions=output:3"
ovs-ofctl add-flow s3 "priority=50,arp,nw_dst=10.0.0.3,actions=output:4"
ovs-ofctl add-flow s3 "priority=50,arp,nw_dst=10.0.0.4,actions=output:1"
ovs-ofctl add-flow s3 "priority=50,arp,nw_dst=10.0.0.5,actions=output:2"

ovs-ofctl add-flow s4 "priority=200,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal"

ovs-ofctl add-flow s4 "priority=100,arp,nw_src=10.0.0.6,nw_dst=10.0.0.1,actions=drop"
ovs-ofctl add-flow s4 "priority=100,arp,nw_src=10.0.0.6,nw_dst=10.0.0.2,actions=drop"
ovs-ofctl add-flow s4 "priority=100,arp,nw_src=10.0.0.6,nw_dst=10.0.0.4,actions=drop"
ovs-ofctl add-flow s4 "priority=100,arp,nw_src=10.0.0.6,nw_dst=10.0.0.5,actions=drop"

ovs-ofctl add-flow s4 "priority=100,arp,nw_dst=10.0.0.6,nw_src=10.0.0.1,actions=drop"
ovs-ofctl add-flow s4 "priority=100,arp,nw_dst=10.0.0.6,nw_src=10.0.0.2,actions=drop"
ovs-ofctl add-flow s4 "priority=100,arp,nw_dst=10.0.0.6,nw_src=10.0.0.4,actions=drop"
ovs-ofctl add-flow s4 "priority=100,arp,nw_dst=10.0.0.6,nw_src=10.0.0.5,actions=drop"

ovs-ofctl add-flow s4 "priority=50,arp,nw_dst=10.0.0.3,actions=output:2"
ovs-ofctl add-flow s4 "priority=50,arp,nw_dst=10.0.0.6,actions=output:1"
