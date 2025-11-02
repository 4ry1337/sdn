#!/usr/bin/python

# from mn_wifi.cli import CLI
from mn_wifi.net import Mininet_wifi
from mininet.node import RemoteController
from mininet.log import setLogLevel, info
import time
import csv

HOST = "192.168.56.1"
PORTS = [6633, 6634, 6635]


def measure_icmp(net, src, dst, duration=90, output_file="./icmp_results.csv"):
    """Continuously ping and measure latency"""
    info(f"*** Starting ICMP test: {src.name} -> {dst.IP()}\n")

    results = []
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

        results.append(
            {"time": timestamp, "latency": latency, "packet_loss": packet_loss}
        )

        if int(timestamp) % 10 == 0:
            info(f"  ICMP: {int(timestamp)}s elapsed\n")

        time.sleep(1)

    # Save results
    with open(output_file, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["time", "latency", "packet_loss"])
        writer.writeheader()
        writer.writerows(results)

    info(f"*** ICMP test completed. Results saved to {output_file}\n")


def measure_tcp(net, server, client, duration=90, output_file="./tcp_results.csv"):
    """Run iperf TCP test and measure throughput"""
    info(f"*** Starting TCP test: {client.name} -> {server.name}\n")

    # Start iperf server
    server.cmd("killall iperf 2>/dev/null")
    server.cmd("iperf -s &")
    time.sleep(2)

    results = []
    start_time = time.time()

    # Start iperf client in background
    client.cmd(
        f"iperf -c {server.IP()} -t {duration} -i 1 > ./iperf_tcp_{client.name}.txt &"
    )

    # Monitor output
    while time.time() - start_time < duration + 5:
        time.sleep(1)
        timestamp = time.time() - start_time

        # Read iperf output
        output = client.cmd(f"tail -n 1 ./iperf_tcp_{client.name}.txt")

        if "Mbits/sec" in output and "sec" in output:
            try:
                # Parse: [ ID] Interval       Transfer     Bandwidth
                parts = output.split()
                for i, part in enumerate(parts):
                    if "Mbits/sec" in part or (
                        i > 0
                        and parts[i - 1].replace(".", "").isdigit()
                        and "Mbits/sec" in parts[i + 1]
                        if i + 1 < len(parts)
                        else False
                    ):
                        throughput = (
                            float(parts[i - 1]) if "Mbits/sec" in part else float(part)
                        )
                        results.append({"time": timestamp, "throughput": throughput})
                        break
            except:
                pass

        if int(timestamp) % 10 == 0:
            info(f"  TCP: {int(timestamp)}s elapsed\n")

    # Cleanup
    server.cmd("killall iperf")
    client.cmd("killall iperf")

    # Save results
    with open(output_file, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["time", "throughput"])
        writer.writeheader()
        writer.writerows(results)

    info(f"*** TCP test completed. Results saved to {output_file}\n")


def measure_udp(net, server, client, duration=90, output_file="./udp_results.csv"):
    """Run iperf UDP test and measure throughput"""
    info(f"*** Starting UDP test: {client.name} -> {server.name}\n")

    # Start iperf server
    server.cmd("killall iperf 2>/dev/null")
    server.cmd("iperf -s -u &")
    time.sleep(2)

    results = []
    start_time = time.time()

    # Start iperf client in background with 10 Mbps bandwidth
    client.cmd(
        f"iperf -c {server.IP()} -u -b 10M -t {duration} -i 1 > ./iperf_udp_{client.name}.txt &"
    )

    # Monitor output
    while time.time() - start_time < duration + 5:
        time.sleep(1)
        timestamp = time.time() - start_time

        # Read iperf output
        output = client.cmd(f"tail -n 1 ./iperf_udp_{client.name}.txt")

        if "Mbits/sec" in output and "sec" in output:
            try:
                # Parse UDP output
                parts = output.split()
                for i, part in enumerate(parts):
                    if "Mbits/sec" in part:
                        throughput = float(parts[i - 1])
                        results.append({"time": timestamp, "throughput": throughput})
                        break
            except:
                pass

        if int(timestamp) % 10 == 0:
            info(f"  UDP: {int(timestamp)}s elapsed\n")

    # Cleanup
    server.cmd("killall iperf")
    client.cmd("killall iperf")

    # Save results
    with open(output_file, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["time", "throughput"])
        writer.writeheader()
        writer.writerows(results)

    info(f"*** UDP test completed. Results saved to {output_file}\n")


def run_tests(net):
    """Run all traffic tests sequentially"""
    info("*** Starting traffic generation tests\n")

    # Get nodes
    sta1 = net.get("sta1")
    sta2 = net.get("sta2")
    c1_h1 = net.get("c1_h1")
    c2_h1 = net.get("c2_h1")
    c3_h1 = net.get("c3_h1")

    duration = 90  # Match mobility duration

    # Run tests sequentially
    info("\n=== Test 1: ICMP (Ping) ===\n")
    measure_icmp(net, sta1, c1_h1, duration)

    time.sleep(3)

    info("\n=== Test 2: TCP (iperf) ===\n")
    measure_tcp(net, c2_h1, sta1, duration)

    time.sleep(3)

    info("\n=== Test 3: UDP (iperf) ===\n")
    measure_udp(net, c3_h1, sta1, duration)

    info("\n*** All tests completed\n")
    info(
        "*** Results saved to ./icmp_results.csv, ./tcp_results.csv, ./udp_results.csv\n"
    )


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
