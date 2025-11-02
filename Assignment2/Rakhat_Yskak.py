#!/usr/bin/python

from mn_wifi.cli import CLI
from mn_wifi.net import Mininet_wifi
from mininet.node import RemoteController
from mininet.log import setLogLevel, info
import os
import time

HOST = "192.168.56.1"
PORTS = [6633, 6634, 6635]

# Create tests directory if it doesn't exist
if not os.path.exists("./tests"):
    os.makedirs("./tests")


def run_baseline_tests(net):
    """Run tests WITHOUT mobility to establish baseline performance"""

    info("*** BASELINE TEST (NO MOBILITY) ***\n")
    # Get nodes
    sta1 = net.get("sta1")
    sta2 = net.get("sta2")
    sta3 = net.get("sta3")
    c1_h1 = net.get("c1_h1")
    c2_h1 = net.get("c2_h1")
    c3_h1 = net.get("c3_h1")

    info("*** Starting iperf servers on hosts\n")
    # Start TCP servers
    c1_h1.cmd("iperf -s -p 5001 > /dev/null 2>&1 &")
    c2_h1.cmd("iperf -s -p 5002 > /dev/null 2>&1 &")
    c3_h1.cmd("iperf -s -p 5003 > /dev/null 2>&1 &")

    # Start UDP servers
    c1_h1.cmd("iperf -s -u -p 5101 > /dev/null 2>&1 &")
    c2_h1.cmd("iperf -s -u -p 5102 > /dev/null 2>&1 &")
    c3_h1.cmd("iperf -s -u -p 5103 > /dev/null 2>&1 &")

    time.sleep(2)

    info("*** Baseline Test: ICMP Traffic (No Mobility)\n")
    # ICMP tests - 60 seconds
    sta1.cmd("ping -c 120 -i 0.5 10.0.0.1 > ./tests/baseline_icmp_sta1.txt &")
    sta2.cmd("ping -c 120 -i 0.5 10.0.0.5 > ./tests/baseline_icmp_sta2.txt &")
    sta3.cmd("ping -c 120 -i 0.5 10.0.0.9 > ./tests/baseline_icmp_sta3.txt &")

    info("*** Baseline Test: TCP Traffic (No Mobility)\n")
    # TCP tests - 60 seconds
    sta1.cmd("iperf -c 10.0.0.1 -p 5001 -t 60 -i 1 > ./tests/baseline_tcp_sta1.txt &")
    sta2.cmd("iperf -c 10.0.0.5 -p 5002 -t 60 -i 1 > ./tests/baseline_tcp_sta2.txt &")
    sta3.cmd("iperf -c 10.0.0.9 -p 5003 -t 60 -i 1 > ./tests/baseline_tcp_sta3.txt &")

    info("*** Baseline Test: UDP Traffic (No Mobility)\n")
    # UDP tests - 60 seconds
    sta1.cmd(
        "iperf -c 10.0.0.1 -p 5101 -u -b 10M -t 60 -i 1 > ./tests/baseline_udp_sta1.txt &"
    )
    sta2.cmd(
        "iperf -c 10.0.0.5 -p 5102 -u -b 10M -t 60 -i 1 > ./tests/baseline_udp_sta2.txt &"
    )
    sta3.cmd(
        "iperf -c 10.0.0.9 -p 5103 -u -b 10M -t 60 -i 1 > ./tests/baseline_udp_sta3.txt &"
    )

    info("*** Baseline tests running (60 seconds)...\n")
    time.sleep(65)

    info("*** Baseline tests completed!\n")

    # Kill iperf servers
    c1_h1.cmd("pkill -9 iperf")
    c2_h1.cmd("pkill -9 iperf")
    c3_h1.cmd("pkill -9 iperf")
    time.sleep(2)


def run_mobility_tests(net):
    """Run tests WITH mobility to measure impact on performance"""

    info("*** MOBILITY TEST (WITH MOBILITY) ***\n")
    info("*** Waiting for network to stabilize\n")
    time.sleep(5)

    # Get nodes
    sta1 = net.get("sta1")
    sta2 = net.get("sta2")
    sta3 = net.get("sta3")
    c1_h1 = net.get("c1_h1")
    c2_h1 = net.get("c2_h1")
    c3_h1 = net.get("c3_h1")

    info("*** Starting iperf servers on hosts\n")
    # Start TCP servers
    c1_h1.cmd("iperf -s -p 5001 > /dev/null 2>&1 &")
    c2_h1.cmd("iperf -s -p 5002 > /dev/null 2>&1 &")
    c3_h1.cmd("iperf -s -p 5003 > /dev/null 2>&1 &")

    # Start UDP servers
    c1_h1.cmd("iperf -s -u -p 5101 > /dev/null 2>&1 &")
    c2_h1.cmd("iperf -s -u -p 5102 > /dev/null 2>&1 &")
    c3_h1.cmd("iperf -s -u -p 5103 > /dev/null 2>&1 &")

    time.sleep(2)

    info("*** Starting Mobility!\n")
    # Start mobility
    net.startMobility(time=0)

    # sta1: Domain1 -> Domain3 (moves across all domains)
    net.mobility(sta1, "start", time=1, position="10,30,0")
    net.mobility(sta1, "stop", time=60, position="50,30,0")

    # sta2: Domain2 -> Domain3
    net.mobility(sta2, "start", time=1, position="30,30,0")
    net.mobility(sta2, "stop", time=60, position="50,25,0")

    # sta3: Domain3 -> Domain1
    net.mobility(sta3, "start", time=1, position="50,30,0")
    net.mobility(sta3, "stop", time=60, position="10,25,0")

    net.stopMobility(time=61)

    info("*** Mobility Test: ICMP Traffic (With Mobility)\n")
    # ICMP tests - 60 seconds
    sta1.cmd("ping -c 120 -i 0.5 10.0.0.1 > ./tests/mobility_icmp_sta1.txt &")
    sta2.cmd("ping -c 120 -i 0.5 10.0.0.5 > ./tests/mobility_icmp_sta2.txt &")
    sta3.cmd("ping -c 120 -i 0.5 10.0.0.9 > ./tests/mobility_icmp_sta3.txt &")

    info("*** Mobility Test: TCP Traffic (With Mobility)\n")
    # TCP tests - 60 seconds
    sta1.cmd("iperf -c 10.0.0.1 -p 5001 -t 60 -i 1 > ./tests/mobility_tcp_sta1.txt &")
    sta2.cmd("iperf -c 10.0.0.5 -p 5002 -t 60 -i 1 > ./tests/mobility_tcp_sta2.txt &")
    sta3.cmd("iperf -c 10.0.0.9 -p 5003 -t 60 -i 1 > ./tests/mobility_tcp_sta3.txt &")

    info("*** Mobility Test: UDP Traffic (With Mobility)\n")
    # UDP tests - 60 seconds
    sta1.cmd(
        "iperf -c 10.0.0.1 -p 5101 -u -b 10M -t 60 -i 1 > ./tests/mobility_udp_sta1.txt &"
    )
    sta2.cmd(
        "iperf -c 10.0.0.5 -p 5102 -u -b 10M -t 60 -i 1 > ./tests/mobility_udp_sta2.txt &"
    )
    sta3.cmd(
        "iperf -c 10.0.0.9 -p 5103 -u -b 10M -t 60 -i 1 > ./tests/mobility_udp_sta3.txt &"
    )

    info("*** Mobility tests running (60 seconds)...\n")
    info("*** Stations are moving between domains!\n")
    time.sleep(65)

    info("*** Mobility tests completed!\n")

    # Kill iperf servers
    c1_h1.cmd("pkill -9 iperf")
    c2_h1.cmd("pkill -9 iperf")
    c3_h1.cmd("pkill -9 iperf")


def topology():
    info("*** Starting network\n")
    net = Mininet_wifi(autoSetMacs=True)

    info("*** Creating Controllers\n")
    c1 = net.addController("c1", controller=RemoteController, ip=HOST, port=PORTS[0])
    c2 = net.addController("c2", controller=RemoteController, ip=HOST, port=PORTS[1])
    c3 = net.addController("c3", controller=RemoteController, ip=HOST, port=PORTS[2])

    info("*** Creating Domain 1\n")
    c1_ap1 = net.addAccessPoint(
        "c1_ap1",
        ssid="domain1",
        mode="g",
        channel="1",
        position="10,30,0",
        range=120,
    )
    c1_s1 = net.addSwitch("c1_s1")
    c1_s2 = net.addSwitch("c1_s2")
    c1_h1 = net.addHost("c1_h1", ip="10.0.0.1/24")
    c1_h2 = net.addHost("c1_h2", ip="10.0.0.2/24")

    info("*** Creating Domain 2\n")
    c2_ap1 = net.addAccessPoint(
        "c2_ap1",
        ssid="domain2",
        mode="g",
        channel="6",
        position="30,30,0",
        range=120,
    )
    c2_s1 = net.addSwitch("c2_s1")
    c2_s2 = net.addSwitch("c2_s2")
    c2_h1 = net.addHost("c2_h1", ip="10.0.0.5/24")
    c2_h2 = net.addHost("c2_h2", ip="10.0.0.6/24")

    info("*** Creating Domain 3\n")
    c3_ap1 = net.addAccessPoint(
        "c3_ap1",
        ssid="domain3",
        mode="g",
        channel="11",
        position="50,30,0",
        range=120,
    )
    c3_s1 = net.addSwitch("c3_s1")
    c3_s2 = net.addSwitch("c3_s2")
    c3_h1 = net.addHost("c3_h1", ip="10.0.0.9/24")
    c3_h2 = net.addHost("c3_h2", ip="10.0.0.10/24")

    sta1 = net.addStation("sta1", ip="10.0.0.13/24", position="10,30,0")
    sta2 = net.addStation("sta2", ip="10.0.0.14/24", position="30,30,0")
    sta3 = net.addStation("sta3", ip="10.0.0.15/24", position="50,30,0")

    info("*** Configuring Propagation Model\n")
    net.setPropagationModel(model="logDistance", exp=3)

    info("*** Configuring WiFi nodes\n")
    net.configureNodes()

    net.addLink(sta1, c1_ap1)
    net.addLink(sta2, c2_ap1)
    net.addLink(sta3, c3_ap1)

    info("*** Creating Domain 1 Internal Links\n")
    net.addLink(c1_ap1, c1_s1)
    net.addLink(c1_s1, c1_s2)
    net.addLink(c1_s2, c1_h1)
    net.addLink(c1_s2, c1_h2)

    info("*** Creating Domain 2 Internal Links\n")
    net.addLink(c2_ap1, c2_s1)
    net.addLink(c2_s1, c2_s2)
    net.addLink(c2_s2, c2_h1)
    net.addLink(c2_s2, c2_h2)

    info("*** Creating Domain 3 Internal Links\n")
    net.addLink(c3_ap1, c3_s1)
    net.addLink(c3_s1, c3_s2)
    net.addLink(c3_s2, c3_h1)
    net.addLink(c3_s2, c3_h2)

    info("*** Creating Inter-Domain Links\n")
    net.addLink(c1_s2, c2_s1)  # Domain 1 <-> Domain 2
    net.addLink(c2_s2, c3_s1)  # Domain 2 <-> Domain 3

    info("*** Enabling mobility\n")
    net.plotGraph(max_x=100, max_y=100)

    net.startMobility(time=0)
    # sta1: starts at domain1, moves through domain2, ends at domain3
    net.mobility(sta1, "start", time=1, position="10,20,0")
    net.mobility(sta1, "stop", time=60, position="50,20,0")

    # sta2: starts at domain2, moves to domain3
    net.mobility(sta2, "start", time=1, position="30,20,0")
    net.mobility(sta2, "stop", time=60, position="50,25,0")

    # sta3: starts at domain3, moves to domain1
    net.mobility(sta3, "start", time=1, position="50,20,0")
    net.mobility(sta3, "stop", time=60, position="10,25,0")

    net.stopMobility(time=61)

    info("*** Building network\n")
    net.build()

    info("*** Starting controllers\n")
    for controller in net.controllers:
        controller.start()

    info("*** Assigning controllers to domains\n")
    c1_s1.start([c1])
    c1_s2.start([c1])
    c1_ap1.start([c1])

    c2_s1.start([c2])
    c2_s2.start([c2])
    c2_ap1.start([c2])

    c3_s1.start([c3])
    c3_s2.start([c3])
    c3_ap1.start([c3])

    # info("*** Starting CLI\n")
    # CLI(net)

    info("*** Waiting for network to stabilize\n")
    time.sleep(5)

    info("\n" + "=" * 70 + "\n")
    info("*** STARTING AUTOMATED TESTS ***\n")
    info("=" * 70 + "\n\n")

    # Run baseline tests (no mobility)
    info("*** Phase 1/2: Running baseline tests (NO mobility)...\n")
    run_baseline_tests(net)

    info("\n" + "=" * 70 + "\n")
    info("*** Baseline tests complete! Preparing for mobility tests...\n")
    info("=" * 70 + "\n\n")
    time.sleep(3)

    # Run mobility tests
    info("*** Phase 2/2: Running mobility tests (WITH mobility)...\n")
    run_mobility_tests(net)

    info("\n" + "=" * 70 + "\n")
    info("*** ALL TESTS COMPLETED! ***\n")
    info("*** Results saved in ./tests/ directory\n")
    info("*** Run plot_results.py to generate comparison graphs\n")
    info("=" * 70 + "\n\n")

    net.stop()


if __name__ == "__main__":
    setLogLevel("info")
    topology()
