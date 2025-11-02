#!/usr/bin/env python3

import pandas as pd
import matplotlib.pyplot as plt
import numpy as np


def plot_icmp_results():
    """Plot ICMP latency and packet loss"""
    df = pd.read_csv("./icmp_results.csv")

    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))

    # Plot latency
    valid_latency = df[df["latency"].notna()]
    ax1.plot(
        valid_latency["time"], valid_latency["latency"], "b-", linewidth=1, alpha=0.7
    )
    ax1.set_xlabel("Time (seconds)")
    ax1.set_ylabel("Latency (ms)")
    ax1.set_title("ICMP Latency During Mobility (sta1 moving across domains)")
    ax1.grid(True, alpha=0.3)

    # Mark domain transitions (approximate)
    ax1.axvline(
        x=30, color="r", linestyle="--", alpha=0.5, label="Domain 1→2 transition"
    )
    ax1.axvline(
        x=60, color="g", linestyle="--", alpha=0.5, label="Domain 2→3 transition"
    )
    ax1.legend()

    # Plot packet loss
    ax2.plot(df["time"], df["packet_loss"], "r-", linewidth=1)
    ax2.set_xlabel("Time (seconds)")
    ax2.set_ylabel("Packet Loss (0=success, 1=loss)")
    ax2.set_title("ICMP Packet Loss During Mobility")
    ax2.set_ylim(-0.1, 1.1)
    ax2.grid(True, alpha=0.3)

    # Mark domain transitions
    ax2.axvline(x=30, color="r", linestyle="--", alpha=0.5)
    ax2.axvline(x=60, color="g", linestyle="--", alpha=0.5)

    plt.tight_layout()
    plt.savefig("./icmp_results.png", dpi=300, bbox_inches="tight")
    print("ICMP plot saved to ./icmp_results.png")
    plt.close()


def plot_tcp_results():
    """Plot TCP throughput"""
    df = pd.read_csv("./tcp_results.csv")

    if df.empty:
        print("No TCP data available")
        return

    plt.figure(figsize=(12, 6))
    plt.plot(df["time"], df["throughput"], "b-", linewidth=1.5, alpha=0.7)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Throughput (Mbps)")
    plt.title("TCP Throughput During Mobility (sta1 moving across domains)")
    plt.grid(True, alpha=0.3)

    # Mark domain transitions
    plt.axvline(
        x=30, color="r", linestyle="--", alpha=0.5, label="Domain 1→2 transition"
    )
    plt.axvline(
        x=60, color="g", linestyle="--", alpha=0.5, label="Domain 2→3 transition"
    )
    plt.legend()

    plt.tight_layout()
    plt.savefig("./tcp_results.png", dpi=300, bbox_inches="tight")
    print("TCP plot saved to ./tcp_results.png")
    plt.close()


def plot_udp_results():
    """Plot UDP throughput"""
    df = pd.read_csv("./udp_results.csv")

    if df.empty:
        print("No UDP data available")
        return

    plt.figure(figsize=(12, 6))
    plt.plot(df["time"], df["throughput"], "g-", linewidth=1.5, alpha=0.7)
    plt.xlabel("Time (seconds)")
    plt.ylabel("Throughput (Mbps)")
    plt.title("UDP Throughput During Mobility (sta1 moving across domains)")
    plt.grid(True, alpha=0.3)

    # Mark domain transitions
    plt.axvline(
        x=30, color="r", linestyle="--", alpha=0.5, label="Domain 1→2 transition"
    )
    plt.axvline(
        x=60, color="g", linestyle="--", alpha=0.5, label="Domain 2→3 transition"
    )
    plt.legend()

    plt.tight_layout()
    plt.savefig("./udp_results.png", dpi=300, bbox_inches="tight")
    print("UDP plot saved to ./udp_results.png")
    plt.close()


def plot_comparison():
    """Compare TCP vs UDP throughput"""
    tcp_df = pd.read_csv("./tcp_results.csv")
    udp_df = pd.read_csv("./udp_results.csv")

    if tcp_df.empty or udp_df.empty:
        print("Incomplete data for comparison")
        return

    plt.figure(figsize=(12, 6))
    plt.plot(
        tcp_df["time"],
        tcp_df["throughput"],
        "b-",
        linewidth=1.5,
        alpha=0.7,
        label="TCP",
    )
    plt.plot(
        udp_df["time"],
        udp_df["throughput"],
        "g-",
        linewidth=1.5,
        alpha=0.7,
        label="UDP",
    )
    plt.xlabel("Time (seconds)")
    plt.ylabel("Throughput (Mbps)")
    plt.title("TCP vs UDP Throughput Comparison During Mobility")
    plt.grid(True, alpha=0.3)
    plt.legend()

    # Mark domain transitions
    plt.axvline(x=30, color="r", linestyle="--", alpha=0.3)
    plt.axvline(x=60, color="r", linestyle="--", alpha=0.3)

    plt.tight_layout()
    plt.savefig("./comparison.png", dpi=300, bbox_inches="tight")
    print("Comparison plot saved to ./comparison.png")
    plt.close()


def generate_statistics():
    """Generate summary statistics"""
    print("\n=== Summary Statistics ===\n")

    # ICMP statistics
    icmp_df = pd.read_csv("./icmp_results.csv")
    valid_latency = icmp_df[icmp_df["latency"].notna()]
    packet_loss_rate = icmp_df["packet_loss"].mean() * 100

    print("ICMP (Ping):")
    print(f"  Average Latency: {valid_latency['latency'].mean():.2f} ms")
    print(f"  Min Latency: {valid_latency['latency'].min():.2f} ms")
    print(f"  Max Latency: {valid_latency['latency'].max():.2f} ms")
    print(f"  Packet Loss Rate: {packet_loss_rate:.2f}%")

    # TCP statistics
    tcp_df = pd.read_csv("./tcp_results.csv")
    if not tcp_df.empty:
        print("\nTCP:")
        print(f"  Average Throughput: {tcp_df['throughput'].mean():.2f} Mbps")
        print(f"  Min Throughput: {tcp_df['throughput'].min():.2f} Mbps")
        print(f"  Max Throughput: {tcp_df['throughput'].max():.2f} Mbps")

    # UDP statistics
    udp_df = pd.read_csv("./udp_results.csv")
    if not udp_df.empty:
        print("\nUDP:")
        print(f"  Average Throughput: {udp_df['throughput'].mean():.2f} Mbps")
        print(f"  Min Throughput: {udp_df['throughput'].min():.2f} Mbps")
        print(f"  Max Throughput: {udp_df['throughput'].max():.2f} Mbps")


if __name__ == "__main__":
    print("Generating plots from test results...")

    plot_icmp_results()
    plot_tcp_results()
    plot_udp_results()
    plot_comparison()
    generate_statistics()

    print("\nAll plots generated successfully!")
    print("Check ./ for PNG files")
