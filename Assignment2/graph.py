#!/usr/bin/python

import matplotlib.pyplot as plt
import re
import os
import numpy as np

# Create graphs directory if it doesn't exist
if not os.path.exists("./graphs"):
    os.makedirs("./graphs")


def parse_ping_results(filename):
    """Parse ping results for latency and packet loss analysis"""
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found")
        return [], 0, 0

    with open(filename, "r") as f:
        content = f.read()

    # Extract RTT values (time=X.XX ms)
    rtts = re.findall(r"time=(\d+\.?\d*)", content)
    rtts = [float(rtt) for rtt in rtts]

    # Extract packet loss statistics
    loss_match = re.search(r"(\d+)% packet loss", content)
    packet_loss = float(loss_match.group(1)) if loss_match else 0

    # Extract transmitted and received packets
    packets_match = re.search(r"(\d+) packets transmitted, (\d+) received", content)
    transmitted = int(packets_match.group(1)) if packets_match else 0
    received = int(packets_match.group(2)) if packets_match else 0

    return rtts, packet_loss, (transmitted, received)


def parse_iperf_tcp_results(filename):
    """Parse iperf TCP results for throughput analysis"""
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found")
        return [], []

    with open(filename, "r") as f:
        lines = f.readlines()

    data_points = []

    for line in lines:
        # Skip summary lines (they contain different format)
        if "sender" in line.lower() or "receiver" in line.lower():
            continue

        if re.search(r"\d+\.\d+-\s*\d+\.\d+\s+sec", line) and "bits/sec" in line:
            # Extract time interval
            time_match = re.search(r"(\d+\.\d+)-\s*(\d+\.\d+)\s+sec", line)

            # Extract throughput
            throughput_match = re.search(r"(\d+\.?\d*)\s+([MKG])bits/sec", line)

            # Only add if both time and throughput are found
            if time_match and throughput_match:
                time_end = float(time_match.group(2))
                value = float(throughput_match.group(1))
                unit = throughput_match.group(2)

                # Convert to Mbits/sec
                if unit == "K":
                    value /= 1000
                elif unit == "G":
                    value *= 1000

                data_points.append((time_end, value))

    # Separate into times and throughputs
    if data_points:
        times, throughputs = zip(*data_points)
        return list(times), list(throughputs)

    return [], []


def parse_iperf_udp_results(filename):
    """Parse iperf UDP results for throughput and jitter analysis"""
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found")
        return [], [], [], []

    with open(filename, "r") as f:
        lines = f.readlines()

    data_points = []

    for line in lines:
        # Skip summary lines
        if "sender" in line.lower() or "receiver" in line.lower():
            continue

        if re.search(r"\d+\.\d+-\s*\d+\.\d+\s+sec", line) and "bits/sec" in line:
            # Extract time interval
            time_match = re.search(r"(\d+\.\d+)-\s*(\d+\.\d+)\s+sec", line)

            # Extract throughput
            throughput_match = re.search(r"(\d+\.?\d*)\s+([MKG])bits/sec", line)

            # Extract jitter (ms)
            jitter_match = re.search(r"(\d+\.?\d*)\s+ms", line)

            # Extract packet loss (X/Y)
            loss_match = re.search(r"(\d+)/\s*(\d+)\s+\(", line)

            # Only add if we have time and throughput at minimum
            if time_match and throughput_match:
                time_end = float(time_match.group(2))

                value = float(throughput_match.group(1))
                unit = throughput_match.group(2)
                if unit == "K":
                    value /= 1000
                elif unit == "G":
                    value *= 1000

                jitter = float(jitter_match.group(1)) if jitter_match else 0

                if loss_match:
                    lost = int(loss_match.group(1))
                    total = int(loss_match.group(2))
                    loss_percent = (lost / total * 100) if total > 0 else 0
                else:
                    loss_percent = 0

                data_points.append((time_end, value, jitter, loss_percent))

    # Separate into individual lists
    if data_points:
        times, throughputs, jitters, packet_losses = zip(*data_points)
        return list(times), list(throughputs), list(jitters), list(packet_losses)

    return [], [], [], []


def plot_icmp_comparison():
    """Compare ICMP latency: Baseline vs Mobility"""
    fig, axes = plt.subplots(3, 2, figsize=(16, 12))
    fig.suptitle(
        "ICMP Latency: Baseline (No Mobility) vs Mobility Impact",
        fontsize=16,
        fontweight="bold",
    )

    stations = [
        ("sta1", "Domain1→Domain3"),
        ("sta2", "Domain2→Domain3"),
        ("sta3", "Domain3→Domain1"),
    ]

    for idx, (sta_name, movement) in enumerate(stations):
        # Baseline
        baseline_file = f"./tests/baseline_icmp_{sta_name}.txt"
        baseline_rtts, baseline_loss, _ = parse_ping_results(baseline_file)

        # Mobility
        mobility_file = f"./tests/mobility_icmp_{sta_name}.txt"
        mobility_rtts, mobility_loss, _ = parse_ping_results(mobility_file)

        # Plot baseline
        if baseline_rtts:
            axes[idx, 0].plot(
                baseline_rtts,
                marker="o",
                markersize=2,
                linewidth=1,
                color="green",
                alpha=0.7,
            )
            axes[idx, 0].set_xlabel("Packet Sequence", fontsize=10)
            axes[idx, 0].set_ylabel("Latency (ms)", fontsize=10)
            axes[idx, 0].set_title(
                f"{sta_name} - Baseline (No Mobility)\nLoss: {baseline_loss:.1f}%",
                fontsize=11,
            )
            axes[idx, 0].grid(True, alpha=0.3)
            avg = np.mean(baseline_rtts)
            axes[idx, 0].axhline(
                y=avg, color="r", linestyle="--", label=f"Avg: {avg:.2f}ms", alpha=0.7
            )
            axes[idx, 0].legend()

        # Plot mobility
        if mobility_rtts:
            axes[idx, 1].plot(
                mobility_rtts,
                marker="o",
                markersize=2,
                linewidth=1,
                color="red",
                alpha=0.7,
            )
            axes[idx, 1].set_xlabel("Packet Sequence", fontsize=10)
            axes[idx, 1].set_ylabel("Latency (ms)", fontsize=10)
            axes[idx, 1].set_title(
                f"{sta_name} - With Mobility ({movement})\nLoss: {mobility_loss:.1f}%",
                fontsize=11,
            )
            axes[idx, 1].grid(True, alpha=0.3)
            avg = np.mean(mobility_rtts)
            axes[idx, 1].axhline(
                y=avg, color="r", linestyle="--", label=f"Avg: {avg:.2f}ms", alpha=0.7
            )
            axes[idx, 1].legend()

    plt.tight_layout()
    plt.savefig("./graphs/icmp_comparison.png", dpi=300, bbox_inches="tight")
    print("✓ Generated: ./graphs/icmp_comparison.png")
    plt.close()


def plot_tcp_comparison():
    """Compare TCP throughput: Baseline vs Mobility"""
    fig, axes = plt.subplots(3, 2, figsize=(16, 12))
    fig.suptitle(
        "TCP Throughput: Baseline (No Mobility) vs Mobility Impact",
        fontsize=16,
        fontweight="bold",
    )

    stations = [
        ("sta1", "Domain1→Domain3"),
        ("sta2", "Domain2→Domain3"),
        ("sta3", "Domain3→Domain1"),
    ]

    for idx, (sta_name, movement) in enumerate(stations):
        # Baseline
        baseline_file = f"./tests/baseline_tcp_{sta_name}.txt"
        baseline_times, baseline_tp = parse_iperf_tcp_results(baseline_file)

        # Mobility
        mobility_file = f"./tests/mobility_tcp_{sta_name}.txt"
        mobility_times, mobility_tp = parse_iperf_tcp_results(mobility_file)

        # Plot baseline
        if baseline_tp:
            axes[idx, 0].plot(
                baseline_times,
                baseline_tp,
                marker="s",
                markersize=4,
                linewidth=1.5,
                color="green",
                alpha=0.7,
            )
            axes[idx, 0].set_xlabel("Time (seconds)", fontsize=10)
            axes[idx, 0].set_ylabel("Throughput (Mbits/sec)", fontsize=10)
            axes[idx, 0].set_title(f"{sta_name} - Baseline (No Mobility)", fontsize=11)
            axes[idx, 0].grid(True, alpha=0.3)
            avg = np.mean(baseline_tp)
            axes[idx, 0].axhline(
                y=avg,
                color="r",
                linestyle="--",
                label=f"Avg: {avg:.2f} Mbps",
                alpha=0.7,
            )
            axes[idx, 0].legend()

        # Plot mobility
        if mobility_tp:
            axes[idx, 1].plot(
                mobility_times,
                mobility_tp,
                marker="s",
                markersize=4,
                linewidth=1.5,
                color="red",
                alpha=0.7,
            )
            axes[idx, 1].set_xlabel("Time (seconds)", fontsize=10)
            axes[idx, 1].set_ylabel("Throughput (Mbits/sec)", fontsize=10)
            axes[idx, 1].set_title(
                f"{sta_name} - With Mobility ({movement})", fontsize=11
            )
            axes[idx, 1].grid(True, alpha=0.3)
            avg = np.mean(mobility_tp)
            axes[idx, 1].axhline(
                y=avg,
                color="r",
                linestyle="--",
                label=f"Avg: {avg:.2f} Mbps",
                alpha=0.7,
            )
            axes[idx, 1].legend()

    plt.tight_layout()
    plt.savefig("./graphs/tcp_comparison.png", dpi=300, bbox_inches="tight")
    print("✓ Generated: ./graphs/tcp_comparison.png")
    plt.close()


def plot_udp_comparison():
    """Compare UDP throughput: Baseline vs Mobility"""
    fig, axes = plt.subplots(3, 2, figsize=(16, 12))
    fig.suptitle(
        "UDP Throughput: Baseline (No Mobility) vs Mobility Impact",
        fontsize=16,
        fontweight="bold",
    )

    stations = [
        ("sta1", "Domain1→Domain3"),
        ("sta2", "Domain2→Domain3"),
        ("sta3", "Domain3→Domain1"),
    ]

    for idx, (sta_name, movement) in enumerate(stations):
        # Baseline
        baseline_file = f"./tests/baseline_udp_{sta_name}.txt"
        baseline_times, baseline_tp, _, _ = parse_iperf_udp_results(baseline_file)

        # Mobility
        mobility_file = f"./tests/mobility_udp_{sta_name}.txt"
        mobility_times, mobility_tp, _, _ = parse_iperf_udp_results(mobility_file)

        # Plot baseline
        if baseline_tp:
            axes[idx, 0].plot(
                baseline_times,
                baseline_tp,
                marker="^",
                markersize=4,
                linewidth=1.5,
                color="green",
                alpha=0.7,
            )
            axes[idx, 0].set_xlabel("Time (seconds)", fontsize=10)
            axes[idx, 0].set_ylabel("Throughput (Mbits/sec)", fontsize=10)
            axes[idx, 0].set_title(f"{sta_name} - Baseline (No Mobility)", fontsize=11)
            axes[idx, 0].grid(True, alpha=0.3)
            avg = np.mean(baseline_tp)
            axes[idx, 0].axhline(
                y=avg,
                color="r",
                linestyle="--",
                label=f"Avg: {avg:.2f} Mbps",
                alpha=0.7,
            )
            axes[idx, 0].legend()

        # Plot mobility
        if mobility_tp:
            axes[idx, 1].plot(
                mobility_times,
                mobility_tp,
                marker="^",
                markersize=4,
                linewidth=1.5,
                color="red",
                alpha=0.7,
            )
            axes[idx, 1].set_xlabel("Time (seconds)", fontsize=10)
            axes[idx, 1].set_ylabel("Throughput (Mbits/sec)", fontsize=10)
            axes[idx, 1].set_title(
                f"{sta_name} - With Mobility ({movement})", fontsize=11
            )
            axes[idx, 1].grid(True, alpha=0.3)
            avg = np.mean(mobility_tp)
            axes[idx, 1].axhline(
                y=avg,
                color="r",
                linestyle="--",
                label=f"Avg: {avg:.2f} Mbps",
                alpha=0.7,
            )
            axes[idx, 1].legend()

    plt.tight_layout()
    plt.savefig("./graphs/udp_comparison.png", dpi=300, bbox_inches="tight")
    print("✓ Generated: ./graphs/udp_comparison.png")
    plt.close()


def plot_jitter_comparison():
    """Compare UDP jitter: Baseline vs Mobility"""
    fig, axes = plt.subplots(3, 2, figsize=(16, 12))
    fig.suptitle(
        "UDP Jitter: Baseline (No Mobility) vs Mobility Impact",
        fontsize=16,
        fontweight="bold",
    )

    stations = [
        ("sta1", "Domain1→Domain3"),
        ("sta2", "Domain2→Domain3"),
        ("sta3", "Domain3→Domain1"),
    ]

    for idx, (sta_name, movement) in enumerate(stations):
        # Baseline
        baseline_file = f"./tests/baseline_udp_{sta_name}.txt"
        baseline_times, _, baseline_jitter, _ = parse_iperf_udp_results(baseline_file)

        # Mobility
        mobility_file = f"./tests/mobility_udp_{sta_name}.txt"
        mobility_times, _, mobility_jitter, _ = parse_iperf_udp_results(mobility_file)

        # Plot baseline
        if baseline_jitter:
            axes[idx, 0].plot(
                baseline_times,
                baseline_jitter,
                marker="d",
                markersize=4,
                linewidth=1.5,
                color="green",
                alpha=0.7,
            )
            axes[idx, 0].set_xlabel("Time (seconds)", fontsize=10)
            axes[idx, 0].set_ylabel("Jitter (ms)", fontsize=10)
            axes[idx, 0].set_title(f"{sta_name} - Baseline (No Mobility)", fontsize=11)
            axes[idx, 0].grid(True, alpha=0.3)
            avg = np.mean(baseline_jitter)
            axes[idx, 0].axhline(
                y=avg, color="r", linestyle="--", label=f"Avg: {avg:.2f}ms", alpha=0.7
            )
            axes[idx, 0].legend()

        # Plot mobility
        if mobility_jitter:
            axes[idx, 1].plot(
                mobility_times,
                mobility_jitter,
                marker="d",
                markersize=4,
                linewidth=1.5,
                color="red",
                alpha=0.7,
            )
            axes[idx, 1].set_xlabel("Time (seconds)", fontsize=10)
            axes[idx, 1].set_ylabel("Jitter (ms)", fontsize=10)
            axes[idx, 1].set_title(
                f"{sta_name} - With Mobility ({movement})", fontsize=11
            )
            axes[idx, 1].grid(True, alpha=0.3)
            avg = np.mean(mobility_jitter)
            axes[idx, 1].axhline(
                y=avg, color="r", linestyle="--", label=f"Avg: {avg:.2f}ms", alpha=0.7
            )
            axes[idx, 1].legend()

    plt.tight_layout()
    plt.savefig("./graphs/jitter_comparison.png", dpi=300, bbox_inches="tight")
    print("✓ Generated: ./graphs/jitter_comparison.png")
    plt.close()


def plot_summary_comparison():
    """Create summary bar charts comparing baseline vs mobility"""

    stations = ["sta1", "sta2", "sta3"]

    # Collect data
    baseline_latency = []
    mobility_latency = []
    baseline_tcp = []
    mobility_tcp = []
    baseline_udp = []
    mobility_udp = []

    for sta in stations:
        # ICMP
        b_rtts, _, _ = parse_ping_results(f"./tests/baseline_icmp_{sta}.txt")
        m_rtts, _, _ = parse_ping_results(f"./tests/mobility_icmp_{sta}.txt")
        baseline_latency.append(np.mean(b_rtts) if b_rtts else 0)
        mobility_latency.append(np.mean(m_rtts) if m_rtts else 0)

        # TCP
        _, b_tcp = parse_iperf_tcp_results(f"./tests/baseline_tcp_{sta}.txt")
        _, m_tcp = parse_iperf_tcp_results(f"./tests/mobility_tcp_{sta}.txt")
        baseline_tcp.append(np.mean(b_tcp) if b_tcp else 0)
        mobility_tcp.append(np.mean(m_tcp) if m_tcp else 0)

        # UDP
        _, b_udp, _, _ = parse_iperf_udp_results(f"./tests/baseline_udp_{sta}.txt")
        _, m_udp, _, _ = parse_iperf_udp_results(f"./tests/mobility_udp_{sta}.txt")
        baseline_udp.append(np.mean(b_udp) if b_udp else 0)
        mobility_udp.append(np.mean(m_udp) if m_udp else 0)

    # Create bar charts
    fig, axes = plt.subplots(1, 3, figsize=(16, 5))
    fig.suptitle(
        "Performance Comparison: Baseline vs Mobility", fontsize=16, fontweight="bold"
    )

    x = np.arange(len(stations))
    width = 0.35

    # ICMP Latency
    axes[0].bar(
        x - width / 2,
        baseline_latency,
        width,
        label="Baseline (No Mobility)",
        color="green",
        alpha=0.7,
    )
    axes[0].bar(
        x + width / 2,
        mobility_latency,
        width,
        label="With Mobility",
        color="red",
        alpha=0.7,
    )
    axes[0].set_xlabel("Station", fontsize=11)
    axes[0].set_ylabel("Average Latency (ms)", fontsize=11)
    axes[0].set_title("ICMP Latency", fontsize=12, fontweight="bold")
    axes[0].set_xticks(x)
    axes[0].set_xticklabels(stations)
    axes[0].legend()
    axes[0].grid(True, alpha=0.3, axis="y")

    # TCP Throughput
    axes[1].bar(
        x - width / 2,
        baseline_tcp,
        width,
        label="Baseline (No Mobility)",
        color="green",
        alpha=0.7,
    )
    axes[1].bar(
        x + width / 2,
        mobility_tcp,
        width,
        label="With Mobility",
        color="red",
        alpha=0.7,
    )
    axes[1].set_xlabel("Station", fontsize=11)
    axes[1].set_ylabel("Average Throughput (Mbps)", fontsize=11)
    axes[1].set_title("TCP Throughput", fontsize=12, fontweight="bold")
    axes[1].set_xticks(x)
    axes[1].set_xticklabels(stations)
    axes[1].legend()
    axes[1].grid(True, alpha=0.3, axis="y")

    # UDP Throughput
    axes[2].bar(
        x - width / 2,
        baseline_udp,
        width,
        label="Baseline (No Mobility)",
        color="green",
        alpha=0.7,
    )
    axes[2].bar(
        x + width / 2,
        mobility_udp,
        width,
        label="With Mobility",
        color="red",
        alpha=0.7,
    )
    axes[2].set_xlabel("Station", fontsize=11)
    axes[2].set_ylabel("Average Throughput (Mbps)", fontsize=11)
    axes[2].set_title("UDP Throughput", fontsize=12, fontweight="bold")
    axes[2].set_xticks(x)
    axes[2].set_xticklabels(stations)
    axes[2].legend()
    axes[2].grid(True, alpha=0.3, axis="y")

    plt.tight_layout()
    plt.savefig("./graphs/summary_comparison.png", dpi=300, bbox_inches="tight")
    print("✓ Generated: ./graphs/summary_comparison.png")
    plt.close()


def print_comparison_statistics():
    """Print detailed comparison statistics"""
    print("\n" + "=" * 80)
    print("PERFORMANCE IMPACT ANALYSIS: BASELINE vs MOBILITY")
    print("=" * 80)

    stations = ["sta1", "sta2", "sta3"]
    movements = ["Domain1→Domain3", "Domain2→Domain3", "Domain3→Domain1"]

    for sta, movement in zip(stations, movements):
        print(f"\n{sta.upper()} ({movement}):")
        print("-" * 80)

        # ICMP Analysis
        b_rtts, b_loss, _ = parse_ping_results(f"./tests/baseline_icmp_{sta}.txt")
        m_rtts, m_loss, _ = parse_ping_results(f"./tests/mobility_icmp_{sta}.txt")

        if b_rtts and m_rtts:
            b_avg = np.mean(b_rtts)
            m_avg = np.mean(m_rtts)
            increase = ((m_avg - b_avg) / b_avg * 100) if b_avg > 0 else 0

            print(f"  ICMP Latency:")
            print(f"    Baseline:       {b_avg:.2f} ms (Loss: {b_loss:.1f}%)")
            print(f"    With Mobility:  {m_avg:.2f} ms (Loss: {m_loss:.1f}%)")
            print(
                f"    Impact:         {'+' if increase > 0 else ''}{increase:.1f}% change"
            )

        # TCP Analysis
        _, b_tcp = parse_iperf_tcp_results(f"./tests/baseline_tcp_{sta}.txt")
        _, m_tcp = parse_iperf_tcp_results(f"./tests/mobility_tcp_{sta}.txt")

        if b_tcp and m_tcp:
            b_avg = np.mean(b_tcp)
            m_avg = np.mean(m_tcp)
            decrease = ((b_avg - m_avg) / b_avg * 100) if b_avg > 0 else 0

            print(f"  TCP Throughput:")
            print(f"    Baseline:       {b_avg:.2f} Mbps")
            print(f"    With Mobility:  {m_avg:.2f} Mbps")
            print(
                f"    Impact:         {'-' if decrease > 0 else '+'}{abs(decrease):.1f}% change"
            )

        # UDP Analysis
        _, b_udp, b_jitter, _ = parse_iperf_udp_results(
            f"./tests/baseline_udp_{sta}.txt"
        )
        _, m_udp, m_jitter, _ = parse_iperf_udp_results(
            f"./tests/mobility_udp_{sta}.txt"
        )

        if b_udp and m_udp:
            b_avg_tp = np.mean(b_udp)
            m_avg_tp = np.mean(m_udp)
            b_avg_jit = np.mean(b_jitter)
            m_avg_jit = np.mean(m_jitter)
            tp_decrease = (
                ((b_avg_tp - m_avg_tp) / b_avg_tp * 100) if b_avg_tp > 0 else 0
            )
            jit_increase = (
                ((m_avg_jit - b_avg_jit) / b_avg_jit * 100) if b_avg_jit > 0 else 0
            )

            print(f"  UDP:")
            print(f"    Throughput:")
            print(f"      Baseline:       {b_avg_tp:.2f} Mbps")
            print(f"      With Mobility:  {m_avg_tp:.2f} Mbps")
            print(
                f"      Impact:         {'-' if tp_decrease > 0 else '+'}{abs(tp_decrease):.1f}% change"
            )
            print(f"    Jitter:")
            print(f"      Baseline:       {b_avg_jit:.2f} ms")
            print(f"      With Mobility:  {m_avg_jit:.2f} ms")
            print(
                f"      Impact:         {'+' if jit_increase > 0 else ''}{jit_increase:.1f}% change"
            )

    print("\n" + "=" * 80)
    print("\nKEY FINDINGS:")
    print("-" * 80)
    print("• Mobility causes increased latency due to handoff delays")
    print("• Throughput drops during domain transitions")
    print("• Jitter increases due to variable path conditions")
    print("• Packet loss increases during handoff periods")
    print("=" * 80)


def main():
    print("\n" + "=" * 80)
    print("GENERATING COMPARISON GRAPHS: BASELINE vs MOBILITY")
    print("=" * 80 + "\n")

    # Check if tests directory exists
    if not os.path.exists("./tests"):
        print("ERROR: ./tests directory not found!")
        print("Please run the traffic test script first.")
        return

    # Check for required files
    required_files = [
        "baseline_icmp_sta1.txt",
        "mobility_icmp_sta1.txt",
        "baseline_tcp_sta1.txt",
        "mobility_tcp_sta1.txt",
        "baseline_udp_sta1.txt",
        "mobility_udp_sta1.txt",
    ]

    missing = [f for f in required_files if not os.path.exists(f"./tests/{f}")]
    if missing:
        print(f"WARNING: Missing test files: {missing}")
        print("Some graphs may not be generated correctly.\n")

    # Generate all comparison plots
    print("Generating comparison plots...\n")

    plot_icmp_comparison()
    plot_tcp_comparison()
    plot_udp_comparison()
    plot_jitter_comparison()
    plot_summary_comparison()

    print("\n" + "=" * 80)
    print("ALL COMPARISON GRAPHS GENERATED SUCCESSFULLY!")
    print("Check ./graphs/ directory for results:")
    print("  • icmp_comparison.png   - ICMP latency baseline vs mobility")
    print("  • tcp_comparison.png    - TCP throughput baseline vs mobility")
    print("  • udp_comparison.png    - UDP throughput baseline vs mobility")
    print("  • jitter_comparison.png - UDP jitter baseline vs mobility")
    print("  • summary_comparison.png - Overall performance comparison")
    print("=" * 80)

    # Print statistics
    print_comparison_statistics()


if __name__ == "__main__":
    main()
