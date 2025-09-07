#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4
ovs-ofctl del-flows s5
ovs-ofctl del-flows s6
ovs-ofctl del-flows s7
ovs-ofctl del-flows s8

ovs-ofctl add-flow s1 priority=100,dl_type=0x806,actions=normal  # ARP
ovs-ofctl add-flow s2 priority=100,dl_type=0x806,actions=normal
ovs-ofctl add-flow s3 priority=100,dl_type=0x806,actions=normal
ovs-ofctl add-flow s4 priority=100,dl_type=0x806,actions=normal

ovs-ofctl add-flow s1 priority=200,dl_type=0x800,nw_dst=10.0.0.1,actions=normal
ovs-ofctl add-flow s1 priority=200,dl_type=0x800,nw_dst=10.0.0.2,actions=normal
ovs-ofctl add-flow s1 priority=200,dl_type=0x800,nw_dst=10.0.0.3,actions=normal
ovs-ofctl add-flow s2 priority=200,dl_type=0x800,nw_dst=10.0.0.1,actions=normal
ovs-ofctl add-flow s2 priority=200,dl_type=0x800,nw_dst=10.0.0.2,actions=normal
ovs-ofctl add-flow s2 priority=200,dl_type=0x800,nw_dst=10.0.0.3,actions=normal
ovs-ofctl add-flow s3 priority=200,dl_type=0x800,nw_dst=10.0.0.1,actions=normal
ovs-ofctl add-flow s3 priority=200,dl_type=0x800,nw_dst=10.0.0.2,actions=normal
ovs-ofctl add-flow s3 priority=200,dl_type=0x800,nw_dst=10.0.0.3,actions=normal
ovs-ofctl add-flow s4 priority=200,dl_type=0x800,nw_dst=10.0.0.1,actions=normal
ovs-ofctl add-flow s4 priority=200,dl_type=0x800,nw_dst=10.0.0.2,actions=normal
ovs-ofctl add-flow s4 priority=200,dl_type=0x800,nw_dst=10.0.0.3,actions=normal

ovs-ofctl add-flow s1 priority=300,dl_type=0x800,nw_dst=10.0.0.4,actions=output:2  # to s2
ovs-ofctl add-flow s1 priority=300,dl_type=0x800,nw_dst=10.0.0.5,actions=output:2  # to s2
ovs-ofctl add-flow s1 priority=300,dl_type=0x800,nw_dst=10.0.0.6,actions=output:2  # to s2
ovs-ofctl add-flow s2 priority=300,dl_type=0x800,nw_dst=10.0.0.4,actions=output:4  # to s6
ovs-ofctl add-flow s2 priority=300,dl_type=0x800,nw_dst=10.0.0.5,actions=output:4  # to s6
ovs-ofctl add-flow s2 priority=300,dl_type=0x800,nw_dst=10.0.0.6,actions=output:4  # to s6
ovs-ofctl add-flow s3 priority=300,dl_type=0x800,nw_dst=10.0.0.4,actions=output:4  # to s7
ovs-ofctl add-flow s3 priority=300,dl_type=0x800,nw_dst=10.0.0.5,actions=output:4  # to s7
ovs-ofctl add-flow s3 priority=300,dl_type=0x800,nw_dst=10.0.0.6,actions=output:4  # to s7
ovs-ofctl add-flow s4 priority=300,dl_type=0x800,nw_dst=10.0.0.4,actions=output:1  # via s2
ovs-ofctl add-flow s4 priority=300,dl_type=0x800,nw_dst=10.0.0.5,actions=output:1  # via s2
ovs-ofctl add-flow s4 priority=300,dl_type=0x800,nw_dst=10.0.0.6,actions=output:1  # via s2

ovs-ofctl add-flow s5 priority=100,dl_type=0x806,actions=normal  # ARP
ovs-ofctl add-flow s6 priority=100,dl_type=0x806,actions=normal
ovs-ofctl add-flow s7 priority=100,dl_type=0x806,actions=normal
ovs-ofctl add-flow s8 priority=100,dl_type=0x806,actions=normal

ovs-ofctl add-flow s5 priority=200,dl_type=0x800,nw_dst=10.0.0.4,actions=normal
ovs-ofctl add-flow s5 priority=200,dl_type=0x800,nw_dst=10.0.0.5,actions=normal
ovs-ofctl add-flow s5 priority=200,dl_type=0x800,nw_dst=10.0.0.6,actions=normal
ovs-ofctl add-flow s6 priority=200,dl_type=0x800,nw_dst=10.0.0.4,actions=normal
ovs-ofctl add-flow s6 priority=200,dl_type=0x800,nw_dst=10.0.0.5,actions=normal
ovs-ofctl add-flow s6 priority=200,dl_type=0x800,nw_dst=10.0.0.6,actions=normal
ovs-ofctl add-flow s7 priority=200,dl_type=0x800,nw_dst=10.0.0.4,actions=normal
ovs-ofctl add-flow s7 priority=200,dl_type=0x800,nw_dst=10.0.0.5,actions=normal
ovs-ofctl add-flow s7 priority=200,dl_type=0x800,nw_dst=10.0.0.6,actions=normal
ovs-ofctl add-flow s8 priority=200,dl_type=0x800,nw_dst=10.0.0.4,actions=normal
ovs-ofctl add-flow s8 priority=200,dl_type=0x800,nw_dst=10.0.0.5,actions=normal
ovs-ofctl add-flow s8 priority=200,dl_type=0x800,nw_dst=10.0.0.6,actions=normal

ovs-ofctl add-flow s5 priority=300,dl_type=0x800,nw_dst=10.0.0.1,actions=output:1  # via s6
ovs-ofctl add-flow s5 priority=300,dl_type=0x800,nw_dst=10.0.0.2,actions=output:1  # via s6
ovs-ofctl add-flow s5 priority=300,dl_type=0x800,nw_dst=10.0.0.3,actions=output:1  # via s6
ovs-ofctl add-flow s6 priority=300,dl_type=0x800,nw_dst=10.0.0.1,actions=output:4  # to s2
ovs-ofctl add-flow s6 priority=300,dl_type=0x800,nw_dst=10.0.0.2,actions=output:4  # to s2
ovs-ofctl add-flow s6 priority=300,dl_type=0x800,nw_dst=10.0.0.3,actions=output:4  # to s2
ovs-ofctl add-flow s7 priority=300,dl_type=0x800,nw_dst=10.0.0.1,actions=output:3  # to s3
ovs-ofctl add-flow s7 priority=300,dl_type=0x800,nw_dst=10.0.0.2,actions=output:3  # to s3
ovs-ofctl add-flow s7 priority=300,dl_type=0x800,nw_dst=10.0.0.3,actions=output:3  # to s3
ovs-ofctl add-flow s8 priority=300,dl_type=0x800,nw_dst=10.0.0.1,actions=output:3  # via s6
ovs-ofctl add-flow s8 priority=300,dl_type=0x800,nw_dst=10.0.0.2,actions=output:3  # via s6
ovs-ofctl add-flow s8 priority=300,dl_type=0x800,nw_dst=10.0.0.3,actions=output:3  # via s6

ovs-ofctl add-flow s2 priority=400,dl_type=0x806,arp_tpa=10.0.0.4,actions=output:4
ovs-ofctl add-flow s2 priority=400,dl_type=0x806,arp_tpa=10.0.0.5,actions=output:4
ovs-ofctl add-flow s2 priority=400,dl_type=0x806,arp_tpa=10.0.0.6,actions=output:4
ovs-ofctl add-flow s3 priority=400,dl_type=0x806,arp_tpa=10.0.0.4,actions=output:4
ovs-ofctl add-flow s3 priority=400,dl_type=0x806,arp_tpa=10.0.0.5,actions=output:4
ovs-ofctl add-flow s3 priority=400,dl_type=0x806,arp_tpa=10.0.0.6,actions=output:4
ovs-ofctl add-flow s6 priority=400,dl_type=0x806,arp_tpa=10.0.0.1,actions=output:4
ovs-ofctl add-flow s6 priority=400,dl_type=0x806,arp_tpa=10.0.0.2,actions=output:4
ovs-ofctl add-flow s6 priority=400,dl_type=0x806,arp_tpa=10.0.0.3,actions=output:4
ovs-ofctl add-flow s7 priority=400,dl_type=0x806,arp_tpa=10.0.0.1,actions=output:3
ovs-ofctl add-flow s7 priority=400,dl_type=0x806,arp_tpa=10.0.0.2,actions=output:3
ovs-ofctl add-flow s7 priority=400,dl_type=0x806,arp_tpa=10.0.0.3,actions=output:3
