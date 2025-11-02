#!/usr/bin/python

from mn_wifi.net import Mininet_wifi
from mn_wifi.cli import CLI
from mininet.node import RemoteController
from mininet.log import setLogLevel, info
import time
import threading
import subprocess
import csv
from datetime import datetime

HOST = "192.168.56.1"
PORTS = [6633, 6634, 6635]

# Global data storage
results = {"icmp": [], "tcp": [], "udp": []}


def measure_icmp(net, src, dst, duration=90):
    """Continuously ping and measure latency"""
    info(f"*** Starting ICMP test: {src.name} -> {dst.IP()}\n")
    start_time = time.time()

    while time.time() - start_time < duration:
        timestamp = time.time() - start_time
        result = src.cmd(f"ping -c 1 -W 1 {dst.IP()}")

        # Parse ping output for latency
        if "time=" in result:
            try:
                latency = float(result.split("time=")[1].split(" ")[0])
                packet_loss = 0
            except:
                latency = None
                packet_loss = 1
        else:
            latency = None
            packet_loss = 1

        results["icmp"].append(
            {"time": timestamp, "latency": latency, "packet_loss": packet_loss}
        )

        time.sleep(1)  # Ping every second

    info(f"*** ICMP test completed\n")


def measure_tcp(net, server, client, duration=90):
    """Run iperf TCP test and measure throughput"""
    info(f"*** Starting TCP iperf server on {server.name}\n")
    server.cmd("iperf -s -i 1 > ./iperf_server_tcp.txt &")
    time.sleep(2)

    info(f"*** Starting TCP iperf client on {client.name}\n")
    start_time = time.time()

    # Run iperf client
    client.cmd(f"iperf -c {server.IP()} -t {duration} -i 1 > ./iperf_client_tcp.txt &")

    # Parse output periodically
    while time.time() - start_time < duration:
        time.sleep(1)
        timestamp = time.time() - start_time

        # Read iperf output
        try:
            output = client.cmd("tail -n 2 ./iperf_client_tcp.txt")
            if "Mbits/sec" in output:
                lines = output.strip().split("\n")
                for line in lines:
                    if "Mbits/sec" in line and "sec" in line:
                        parts = line.split()
                        throughput = float(parts[-2])
                        results["tcp"].append(
                            {"time": timestamp, "throughput": throughput}
                        )
                        break
        except:
            pass

    # Kill iperf processes
    server.cmd("killall iperf")
    client.cmd("killall iperf")
    info(f"*** TCP test completed\n")


def measure_udp(net, server, client, duration=90):
    """Run iperf UDP test and measure throughput"""
    info(f"*** Starting UDP iperf server on {server.name}\n")
    server.cmd("iperf -s -u -i 1 > ./iperf_server_udp.txt &")
    time.sleep(2)

    info(f"*** Starting UDP iperf client on {client.name}\n")
    start_time = time.time()

    # Run iperf client with UDP
    client.cmd(
        f"iperf -c {server.IP()} -u -b 10M -t {duration} -i 1 > ./iperf_client_udp.txt &"
    )

    # Parse output periodically
    while time.time() - start_time < duration:
        time.sleep(1)
        timestamp = time.time() - start_time

        # Read iperf output
        try:
            output = client.cmd("tail -n 2 ./iperf_client_udp.txt")
            if "Mbits/sec" in output:
                lines = output.strip().split("\n")
                for line in lines:
                    if "Mbits/sec" in line and "sec" in line:
                        parts = line.split()
                        throughput = float(parts[-4])
                        results["udp"].append(
                            {"time": timestamp, "throughput": throughput}
                        )
                        break
        except:
            pass

    # Kill iperf processes
    server.cmd("killall iperf")
    client.cmd("killall iperf")
    info(f"*** UDP test completed\n")


def save_results():
    """Save results to CSV files"""
    info("*** Saving results to CSV files\n")

    # Save ICMP results
    with open("./icmp_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["time", "latency", "packet_loss"])
        writer.writeheader()
        writer.writerows(results["icmp"])

    # Save TCP results
    with open("./tcp_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["time", "throughput"])
        writer.writeheader()
        writer.writerows(results["tcp"])

    # Save UDP results
    with open("./udp_results.csv", "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["time", "throughput"])
        writer.writeheader()
        writer.writerows(results["udp"])

    info("*** Results saved to ./*_results.csv\n")


def run_tests(net):
    """Run all traffic tests concurrently"""
    info("*** Starting traffic generation tests\n")

    # Get nodes
    sta1 = net.get("sta1")
    c1_h1 = net.get("c1_h1")
    c2_h1 = net.get("c2_h1")
    c3_h1 = net.get("c3_h1")

    duration = 90  # Match mobility duration

    # Create threads for concurrent tests
    threads = []

    # ICMP test: sta1 pings c1_h1 continuously
    t1 = threading.Thread(target=measure_icmp, args=(net, sta1, c1_h1, duration))
    threads.append(t1)

    # TCP test: sta1 as client, c2_h1 as server
    t2 = threading.Thread(target=measure_tcp, args=(net, c2_h1, sta1, duration))
    threads.append(t2)

    # UDP test: sta1 as client, c3_h1 as server
    t3 = threading.Thread(target=measure_udp, args=(net, c3_h1, sta1, duration))
    threads.append(t3)

    # Start all tests
    for t in threads:
        t.start()

    # Wait for all tests to complete
    for t in threads:
        t.join()

    info("*** All tests completed\n")
    save_results()


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

    # Run automated tests
    run_tests(net)

    net.stop()


if __name__ == "__main__":
    setLogLevel("info")
    topology()
