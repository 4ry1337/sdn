#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4
ovs-ofctl del-flows s5
ovs-ofctl del-flows s6
ovs-ofctl del-flows s7
ovs-ofctl del-flows s8

ovs-ofctl add-flow s1 "priority=100,dl_dst=00:00:00:00:00:01,actions=output:1"
ovs-ofctl add-flow s1 "priority=90,dl_dst=00:00:00:00:00:02,actions=output:2"
ovs-ofctl add-flow s1 "priority=90,dl_dst=00:00:00:00:04,actions=output:2"
ovs-ofctl add-flow s1 "priority=90,dl_dst=00:00:00:00:00:03,actions=output:3"
ovs-ofctl add-flow s1 "priority=90,dl_dst=00:00:00:00:05,actions=output:3"
ovs-ofctl add-flow s1 "priority=90,dl_dst=00:00:00:00:06,actions=output:3"

ovs-ofctl add-flow s2 "priority=100,dl_dst=00:00:00:00:00:02,actions=output:1"
ovs-ofctl add-flow s2 "priority=90,dl_dst=00:00:00:00:00:01,actions=output:2"
ovs-ofctl add-flow s2 "priority=90,dl_dst=00:00:00:00:03,actions=output:2"
ovs-ofctl add-flow s2 "priority=90,dl_dst=00:00:00:00:04,actions=output:4"
ovs-ofctl add-flow s2 "priority=90,dl_dst=00:00:00:00:05,actions=output:4"
ovs-ofctl add-flow s2 "priority=90,dl_dst=00:00:00:00:06,actions=output:4"

ovs-ofctl add-flow s3 "priority=100,dl_dst=00:00:00:00:00:03,actions=output:1"
ovs-ofctl add-flow s3 "priority=90,dl_dst=00:00:00:00:01,actions=output:2"
ovs-ofctl add-flow s3 "priority=90,dl_dst=00:00:00:00:02,actions=output:2"
ovs-ofctl add-flow s3 "priority=90,dl_dst=00:00:00:00:05,actions=output:4"
ovs-ofctl add-flow s3 "priority=90,dl_dst=00:00:00:00:06,actions=output:4"
ovs-ofctl add-flow s3 "priority=80,dl_dst=00:00:00:00:04,actions=output:2"

ovs-ofctl add-flow s4 "priority=10,actions=output:1,output:2"

ovs-ofctl add-flow s5 "priority=10,actions=output:1,output:2"

ovs-ofctl add-flow s6 "priority=100,dl_dst=00:00:00:00:04,actions=output:1"
ovs-ofctl add-flow s6 "priority=90,dl_dst=00:00:00:00:05,actions=output:3"
ovs-ofctl add-flow s6 "priority=90,dl_dst=00:00:00:00:06,actions=output:3"
ovs-ofctl add-flow s6 "priority=90,dl_dst=00:00:00:00:01,actions=output:4"
ovs-ofctl add-flow s6 "priority=90,dl_dst=00:00:00:00:02,actions=output:4"
ovs-ofctl add-flow s6 "priority=90,dl_dst=00:00:00:00:03,actions=output:4"

ovs-ofctl add-flow s7 "priority=10,actions=output:1,output:2,output:3"

ovs-ofctl add-flow s8 "priority=100,dl_dst=00:00:00:00:05,actions=output:1"
ovs-ofctl add-flow s8 "priority=100,dl_dst=00:00:00:00:06,actions=output:2"
ovs-ofctl add-flow s8 "priority=90,dl_dst=00:00:00:00:01,actions=output:3"
ovs-ofctl add-flow s8 "priority=90,dl_dst=00:00:00:00:02,actions=output:3"
ovs-ofctl add-flow s8 "priority=90,dl_dst=00:00:00:00:03,actions=output:3"
ovs-ofctl add-flow s8 "priority=90,dl_dst=00:00:00:00:04,actions=output:3"
