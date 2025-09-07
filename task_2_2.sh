#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4
ovs-ofctl del-flows s5
ovs-ofctl del-flows s6
ovs-ofctl del-flows s7
ovs-ofctl del-flows s8

ovs-ofctl add-flow s1 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s2 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s3 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s4 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s5 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s6 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s7 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal
ovs-ofctl add-flow s8 priority=500,dl_type=0x800,nw_src=10.0.0.0/24,nw_dst=10.0.0.0/24,actions=normal

ovs-ofctl add-flow s1 priority=500,dl_type=0x806,actions=normal
ovs-ofctl add-flow s2 priority=500,dl_type=0x806,actions=normal
ovs-ofctl add-flow s3 priority=500,dl_type=0x806,actions=normal
ovs-ofctl add-flow s4 priority=500,dl_type=0x806,actions=normal
ovs-ofctl add-flow s5 priority=500,dl_type=0x806,actions=normal
ovs-ofctl add-flow s6 priority=500,dl_type=0x806,actions=normal
ovs-ofctl add-flow s7 priority=500,dl_type=0x806,actions=normal
ovs-ofctl add-flow s8 priority=500,dl_type=0x806,actions=normal
