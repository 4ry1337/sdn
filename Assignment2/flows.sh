#!/bin/bash

# Domain 1 - Allow all traffic to flood initially
# This makes the learning switch actually learn

# Clear existing flows first
curl -X DELETE http://localhost:8080/wm/staticentrypusher/clear/00:00:00:00:00:00:00:01/json
curl -X DELETE http://localhost:8080/wm/staticentrypusher/clear/00:00:00:00:00:00:00:02/json

# On c1_s1 - flood ARP and IP packets
curl -X POST -d '{
    "switch":"00:00:00:00:00:00:00:01",
    "name":"flood_arp",
    "priority":"100",
    "eth_type":"0x0806",
    "active":"true",
    "actions":"output=flood"
}' http://localhost:8080/wm/staticentrypusher/json

curl -X POST -d '{
    "switch":"00:00:00:00:00:00:00:01",
    "name":"flood_ip",
    "priority":"100",
    "eth_type":"0x0800",
    "active":"true",
    "actions":"output=flood"
}' http://localhost:8080/wm/staticentrypusher/json

# On c1_s2 - flood ARP and IP packets
curl -X POST -d '{
    "switch":"00:00:00:00:00:00:00:02",
    "name":"flood_arp",
    "priority":"100",
    "eth_type":"0x0806",
    "active":"true",
    "actions":"output=flood"
}' http://localhost:8080/wm/staticentrypusher/json

curl -X POST -d '{
    "switch":"00:00:00:00:00:00:00:02",
    "name":"flood_ip",
    "priority":"100",
    "eth_type":"0x0800",
    "active":"true",
    "actions":"output=flood"
}' http://localhost:8080/wm/staticentrypusher/json

echo "Flows installed - test with: c1_h1 ping c1_h3"
