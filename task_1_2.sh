#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4

# Network topology reference:
# s1: h1(port1), h2(port2), s2(port3), s3(port4)
# s2: h3(port1), s1(port2), s3(port3), s4(port4)
# s3: h4(port1), h5(port2), s1(port3), s2(port4), s4(port5)
# s4: h6(port1), s2(port2), s3(port3)

# ========== ISOLATION RULES (High Priority) ==========
# Block h1, h2, h4, h5 from reaching h6 (10.0.0.6)
ovs-ofctl add-flow s1 "priority=400,ip,nw_src=10.0.0.1,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s1 "priority=400,ip,nw_src=10.0.0.2,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s1 "priority=400,arp,nw_src=10.0.0.1,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s1 "priority=400,arp,nw_src=10.0.0.2,nw_dst=10.0.0.6,actions=drop"

ovs-ofctl add-flow s3 "priority=400,ip,nw_src=10.0.0.4,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s3 "priority=400,ip,nw_src=10.0.0.5,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s3 "priority=400,arp,nw_src=10.0.0.4,nw_dst=10.0.0.6,actions=drop"
ovs-ofctl add-flow s3 "priority=400,arp,nw_src=10.0.0.5,nw_dst=10.0.0.6,actions=drop"

# Block h6 from reaching h1, h2, h4, h5
ovs-ofctl add-flow s4 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.1,actions=drop"
ovs-ofctl add-flow s4 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.2,actions=drop"
ovs-ofctl add-flow s4 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.4,actions=drop"
ovs-ofctl add-flow s4 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.5,actions=drop"
ovs-ofctl add-flow s4 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.1,actions=drop"
ovs-ofctl add-flow s4 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.2,actions=drop"
ovs-ofctl add-flow s4 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.4,actions=drop"
ovs-ofctl add-flow s4 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.5,actions=drop"

# Additional isolation on intermediate switches
ovs-ofctl add-flow s2 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.1,actions=drop"
ovs-ofctl add-flow s2 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.2,actions=drop"
ovs-ofctl add-flow s2 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.4,actions=drop"
ovs-ofctl add-flow s2 "priority=400,ip,nw_src=10.0.0.6,nw_dst=10.0.0.5,actions=drop"
ovs-ofctl add-flow s2 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.1,actions=drop"
ovs-ofctl add-flow s2 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.2,actions=drop"
ovs-ofctl add-flow s2 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.4,actions=drop"
ovs-ofctl add-flow s2 "priority=400,arp,nw_src=10.0.0.6,nw_dst=10.0.0.5,actions=drop"

# ========== LEGACY SWITCH BEHAVIOR (Lower Priority) ==========
# Allow normal learning switch behavior for all other traffic
ovs-ofctl add-flow s1 "priority=100,actions=normal"
ovs-ofctl add-flow s2 "priority=100,actions=normal"
ovs-ofctl add-flow s3 "priority=100,actions=normal"
ovs-ofctl add-flow s4 "priority=100,actions=normal"

echo "Legacy switch rules with isolation installed successfully!"
echo ""
echo "Configuration:"
echo "- All switches act as learning switches (actions=normal)"
echo "- High-priority drop rules enforce isolation:"
echo "  * h1, h2, h4, h5 cannot reach h6"
echo "  * h6 cannot reach h1, h2, h4, h5"
echo "  * h3 and h6 can communicate freely"
echo ""
echo "Expected connectivity:"
echo "h1 → h2 h3 h4 h5 X"
echo "h2 → h1 h3 h4 h5 X"
echo "h3 → h1 h2 h4 h5 h6"
echo "h4 → h1 h2 h3 h5 X"
echo "h5 → h1 h2 h3 h4 X"
echo "h6 → X X h3 X X"
