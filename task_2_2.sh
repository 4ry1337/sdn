#!/bin/bash

ovs-ofctl add-flow s2 "dl_dst=00:00:00:00:00:04,actions=output:3"  # h4 via s6
ovs-ofctl add-flow s2 "dl_dst=00:00:00:00:00:05,actions=output:3"  # h5 via s6
ovs-ofctl add-flow s2 "dl_dst=00:00:00:00:00:06,actions=output:3"  # h6 via s6

ovs-ofctl add-flow s3 "dl_dst=00:00:00:00:00:04,actions=output:3"  # h4 via s7
ovs-ofctl add-flow s3 "dl_dst=00:00:00:00:00:05,actions=output:3"  # h5 via s7  
ovs-ofctl add-flow s3 "dl_dst=00:00:00:00:00:06,actions=output:3"  # h6 via s7

ovs-ofctl add-flow s6 "dl_dst=00:00:00:00:00:01,actions=output:3"  # h1 via s2
ovs-ofctl add-flow s6 "dl_dst=00:00:00:00:00:02,actions=output:3"  # h2 via s2
ovs-ofctl add-flow s6 "dl_dst=00:00:00:00:00:03,actions=output:3"  # h3 via s2

ovs-ofctl add-flow s7 "dl_dst=00:00:00:00:00:01,actions=output:2"  # h1 via s3
ovs-ofctl add-flow s7 "dl_dst=00:00:00:00:00:02,actions=output:2"  # h2 via s3
ovs-ofctl add-flow s7 "dl_dst=00:00:00:00:00:03,actions=output:2"  # h3 via s3

echo "Flow rules added successfully!"
