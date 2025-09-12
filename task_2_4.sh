#!/bin/bash

xterm -hold -e "h6 pkill iperf" &
xterm -hold -e "h5 pkill iperf" &
xterm -hold -e "h3 pkill ping" &

xterm -hold -e "h6 iperf -s -i 5 > h6_tcp_server.log" &
xterm -hold -e "h5 iperf -u -s -i 5 > h5_udp_server.log" &
xterm -hold -e "h3 ping -i 2 -c 100 10.0.0.4 > h3_h4_ping.log" &
xterm -hold -e "h2 iperf -u -c 10.0.0.5 -b 1250M -i 5 > h2_udp_client.log" &
xterm -hold -e "h1 iperf -c 10.0.0.6 -n 1250M -i 5 > h1_tcp_client.log" &
