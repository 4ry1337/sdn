#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4
ovs-ofctl del-flows s5
ovs-ofctl del-flows s6
ovs-ofctl del-flows s7
ovs-ofctl del-flows s8

ovs-ofctl add-flow s2 "ip,nw_dst=10.0.0.4,actions=output:4"
ovs-ofctl add-flow s2 "ip,nw_dst=10.0.0.5,actions=output:4"
ovs-ofctl add-flow s2 "ip,nw_dst=10.0.0.6,actions=output:4"
ovs-ofctl add-flow s3 "ip,nw_dst=10.0.0.4,actions=output:4"
ovs-ofctl add-flow s3 "ip,nw_dst=10.0.0.5,actions=output:4"
ovs-ofctl add-flow s3 "ip,nw_dst=10.0.0.6,actions=output:4"
ovs-ofctl add-flow s6 "ip,nw_dst=10.0.0.1,actions=output:4"
ovs-ofctl add-flow s6 "ip,nw_dst=10.0.0.2,actions=output:4"
ovs-ofctl add-flow s6 "ip,nw_dst=10.0.0.3,actions=output:4"
ovs-ofctl add-flow s7 "ip,nw_dst=10.0.0.1,actions=output:3"
ovs-ofctl add-flow s7 "ip,nw_dst=10.0.0.2,actions=output:3"
ovs-ofctl add-flow s7 "ip,nw_dst=10.0.0.3,actions=output:3"
ovs-ofctl add-flow s2 "arp,actions=flood"
ovs-ofctl add-flow s3 "arp,actions=flood"
ovs-ofctl add-flow s6 "arp,actions=flood"
ovs-ofctl add-flow s7 "arp,actions=flood"
