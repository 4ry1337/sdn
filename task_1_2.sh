#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4

# ========== SWITCH S1 ==========
ovs-ofctl add-flow s1 priority=300,arp,nw_dst=10.0.0.1,actions=output:1
ovs-ofctl add-flow s1 priority=300,arp,nw_dst=10.0.0.2,actions=output:2
ovs-ofctl add-flow s1 priority=300,arp,nw_dst=10.0.0.3,actions=output:3  # to s2
ovs-ofctl add-flow s1 priority=300,arp,nw_dst=10.0.0.4,actions=output:4  # to s3
ovs-ofctl add-flow s1 priority=300,arp,nw_dst=10.0.0.5,actions=output:4  # to s3
ovs-ofctl add-flow s1 priority=200,ip,nw_dst=10.0.0.1,actions=output:1
ovs-ofctl add-flow s1 priority=200,ip,nw_dst=10.0.0.2,actions=output:2
ovs-ofctl add-flow s1 priority=200,ip,nw_dst=10.0.0.3,actions=output:3  # to s2
ovs-ofctl add-flow s1 priority=200,ip,nw_dst=10.0.0.4,actions=output:4  # to s3
ovs-ofctl add-flow s1 priority=200,ip,nw_dst=10.0.0.5,actions=output:4  # to s3

# ========== SWITCH S2 ==========
ovs-ofctl add-flow s2 priority=300,arp,nw_dst=10.0.0.3,actions=output:1
ovs-ofctl add-flow s2 priority=300,arp,nw_dst=10.0.0.1,actions=output:2  # to s1
ovs-ofctl add-flow s2 priority=300,arp,nw_dst=10.0.0.2,actions=output:2  # to s1
ovs-ofctl add-flow s2 priority=300,arp,nw_dst=10.0.0.4,actions=output:3  # to s3
ovs-ofctl add-flow s2 priority=300,arp,nw_dst=10.0.0.5,actions=output:3  # to s3
ovs-ofctl add-flow s2 priority=300,arp,nw_dst=10.0.0.6,actions=output:4  # to s4
ovs-ofctl add-flow s2 priority=200,ip,nw_dst=10.0.0.3,actions=output:1
ovs-ofctl add-flow s2 priority=200,ip,nw_dst=10.0.0.1,actions=output:2  # to s1
ovs-ofctl add-flow s2 priority=200,ip,nw_dst=10.0.0.2,actions=output:2  # to s1
ovs-ofctl add-flow s2 priority=200,ip,nw_dst=10.0.0.4,actions=output:3  # to s3
ovs-ofctl add-flow s2 priority=200,ip,nw_dst=10.0.0.5,actions=output:3  # to s3
ovs-ofctl add-flow s2 priority=200,ip,nw_dst=10.0.0.6,actions=output:4  # to s4

# ========== SWITCH S3 ==========
ovs-ofctl add-flow s3 priority=300,arp,nw_dst=10.0.0.4,actions=output:1
ovs-ofctl add-flow s3 priority=300,arp,nw_dst=10.0.0.5,actions=output:2
ovs-ofctl add-flow s3 priority=300,arp,nw_dst=10.0.0.1,actions=output:3  # to s1
ovs-ofctl add-flow s3 priority=300,arp,nw_dst=10.0.0.2,actions=output:3  # to s1
ovs-ofctl add-flow s3 priority=300,arp,nw_dst=10.0.0.3,actions=output:4  # to s2
ovs-ofctl add-flow s3 priority=200,ip,nw_dst=10.0.0.4,actions=output:1
ovs-ofctl add-flow s3 priority=200,ip,nw_dst=10.0.0.5,actions=output:2
ovs-ofctl add-flow s3 priority=200,ip,nw_dst=10.0.0.1,actions=output:3  # to s1
ovs-ofctl add-flow s3 priority=200,ip,nw_dst=10.0.0.2,actions=output:3  # to s1
ovs-ofctl add-flow s3 priority=200,ip,nw_dst=10.0.0.3,actions=output:4  # to s2

# ========== SWITCH S4 ==========
ovs-ofctl add-flow s4 priority=300,arp,nw_dst=10.0.0.6,actions=output:1
ovs-ofctl add-flow s4 priority=300,arp,nw_dst=10.0.0.3,actions=output:2  # to s2
ovs-ofctl add-flow s4 priority=200,ip,nw_dst=10.0.0.6,actions=output:1
ovs-ofctl add-flow s4 priority=200,ip,nw_dst=10.0.0.3,actions=output:2  # to s2
