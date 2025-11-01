#!/bin/bash

# Delete all existing flows from switches and APs
sudo ovs-ofctl del-flows c1_s1
sudo ovs-ofctl del-flows c1_s2
sudo ovs-ofctl del-flows c1_ap1

sudo ovs-ofctl del-flows c2_s1
sudo ovs-ofctl del-flows c2_s2
sudo ovs-ofctl del-flows c2_ap1

sudo ovs-ofctl del-flows c3_s1
sudo ovs-ofctl del-flows c3_s2
sudo ovs-ofctl del-flows c3_ap1

# mininet-wifi> net
# c1_h1 c1_h1-eth0:c1_s1-eth3
# c1_h2 c1_h2-eth0:c1_s1-eth4
# c1_h3 c1_h3-eth0:c1_s2-eth2
# c1_h4 c1_h4-eth0:c1_s2-eth3
# c2_h1 c2_h1-eth0:c2_s1-eth3
# c2_h2 c2_h2-eth0:c2_s1-eth4
# c2_h3 c2_h3-eth0:c2_s2-eth2
# c2_h4 c2_h4-eth0:c2_s2-eth3
# c3_h1 c3_h1-eth0:c3_s1-eth3
# c3_h2 c3_h2-eth0:c3_s1-eth4
# c3_h3 c3_h3-eth0:c3_s2-eth2
# c3_h4 c3_h4-eth0:c3_s2-eth3
# c1_s1 lo:  c1_s1-eth1:c1_ap1-eth1 c1_s1-eth2:c1_s2-eth1 c1_s1-eth3:c1_h1-eth0 c1_s1-eth4:c1_h2-eth0 c1_s1-eth5:c2_s1-eth5
# c1_s2 lo:  c1_s2-eth1:c1_s1-eth2 c1_s2-eth2:c1_h3-eth0 c1_s2-eth3:c1_h4-eth0 c1_s2-eth4:c2_s2-eth4 c1_s2-eth5:c3_s1-eth6
# c2_s1 lo:  c2_s1-eth1:c2_ap1-eth1 c2_s1-eth2:c2_s2-eth1 c2_s1-eth3:c2_h1-eth0 c2_s1-eth4:c2_h2-eth0 c2_s1-eth5:c1_s1-eth5 c2_s1-eth6:c3_s1-eth5
# c2_s2 lo:  c2_s2-eth1:c2_s1-eth2 c2_s2-eth2:c2_h3-eth0 c2_s2-eth3:c2_h4-eth0 c2_s2-eth4:c1_s2-eth4 c2_s2-eth5:c3_s2-eth4
# c3_s1 lo:  c3_s1-eth1:c3_ap1-eth1 c3_s1-eth2:c3_s2-eth1 c3_s1-eth3:c3_h1-eth0 c3_s1-eth4:c3_h2-eth0 c3_s1-eth5:c2_s1-eth6 c3_s1-eth6:c1_s2-eth5
# c3_s2 lo:  c3_s2-eth1:c3_s1-eth2 c3_s2-eth2:c3_h3-eth0 c3_s2-eth3:c3_h4-eth0 c3_s2-eth4:c2_s2-eth5
# c6653
# c6654
# c6655
# sta1 sta1-wlan0:wifi
# sta2 sta2-wlan0:wifi
# sta3 sta3-wlan0:wifi
# c1_ap1 lo:  c1_ap1-eth1:c1_s1-eth1 c1_ap1-wlan2:wifi c1_ap1-wlan3:wifi
# c2_ap1 lo:  c2_ap1-eth1:c2_s1-eth1 c2_ap1-wlan2:wifi c2_ap1-wlan3:wifi
# c3_ap1 lo:  c3_ap1-eth1:c3_s1-eth1 c3_ap1-wlan2:wifi c3_ap1-wlan3:wifi

# Add flood rule to each (default action: flood all unmatched packets)
# Use -O OpenFlow13 to ensure compatibility
sudo ovs-ofctl add-flow c1_s1 priority=0,actions=flood
sudo ovs-ofctl add-flow c1_s2 priority=0,actions=flood
sudo ovs-ofctl add-flow c1_ap1 priority=0,actions=flood

sudo ovs-ofctl add-flow c2_s1 priority=0,actions=flood
sudo ovs-ofctl add-flow c2_s2 priority=0,actions=flood
sudo ovs-ofctl add-flow c2_ap1 priority=0,actions=flood

sudo ovs-ofctl add-flow c3_s1 priority=0,actions=flood
sudo ovs-ofctl add-flow c3_s2 priority=0,actions=flood
sudo ovs-ofctl add-flow c3_ap1 priority=0,actions=flood
