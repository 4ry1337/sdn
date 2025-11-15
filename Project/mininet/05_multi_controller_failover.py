#!/usr/bin/env python3
"""
Multi-Controller Failover Test
Tests SDN controller redundancy and failover mechanisms.

This test demonstrates:
- Multiple controller setup (c0 primary, c1 backup)
- Controller failure scenarios
- Automatic failover behavior
- Switch-controller connection tracking
- Recovery after controller restart

Topology:
    c0 (6653) ----+
                  |
    c1 (6654) ----+---- s1 --- s2 --- s3
                  |     |      |      |
                  +---- h1     h2     h3

Usage:
    # Start both controllers first
    sudo python3 05_multi_controller_failover.py

    # In Mininet CLI, test failover:
    mininet> sh docker stop openvis-controller
    mininet> pingall  # Should still work with c1
    mininet> sh docker start openvis-controller
"""

import time
import subprocess
import argparse
from mininet.net import Mininet
from mininet.node import RemoteController, OVSSwitch
from mininet.cli import CLI
from mininet.log import setLogLevel, info, error, warn


def check_controller_status(ip, port):
    """Check if controller is reachable"""
    try:
        result = subprocess.run(
            ['timeout', '2', 'bash', '-c', f'echo > /dev/tcp/{ip}/{port}'],
            capture_output=True,
            timeout=3
        )
        return result.returncode == 0
    except:
        return False


def multi_controller_topology(c0_ip='127.0.0.1', c0_port=6653, c1_ip='127.0.0.1', c1_port=6654):
    """Create topology with multiple controllers"""

    info('*** Creating network with multiple controllers\n')
    net = Mininet(
        controller=RemoteController,
        switch=OVSSwitch,
        autoSetMacs=True
    )

    info('*** Adding controllers\n')
    # Primary controller
    c0 = net.addController(
        'c0',
        controller=RemoteController,
        ip=c0_ip,
        port=c0_port
    )
    info(f'  c0: Primary controller at {c0_ip}:{c0_port}\n')

    # Backup controller
    c1 = net.addController(
        'c1',
        controller=RemoteController,
        ip=c1_ip,
        port=c1_port
    )
    info(f'  c1: Backup controller at {c1_ip}:{c1_port}\n')

    info('*** Building topology\n')
    # Create switches with both controllers
    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')
    s3 = net.addSwitch('s3', protocols='OpenFlow13')

    # Create hosts
    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')
    h3 = net.addHost('h3', ip='10.0.0.3/24')

    # Create links
    net.addLink(h1, s1)
    net.addLink(h2, s2)
    net.addLink(h3, s3)
    net.addLink(s1, s2)
    net.addLink(s2, s3)

    info('*** Starting network\n')
    net.start()

    # Configure switches to use both controllers
    info('*** Configuring multi-controller setup\n')
    for switch in [s1, s2, s3]:
        switch.cmd('ovs-vsctl set-controller', switch.name,
                   f'tcp:{c0_ip}:{c0_port} tcp:{c1_ip}:{c1_port}')
        info(f'  {switch.name}: Connected to both controllers\n')

    info('*** Waiting for network stabilization (5s)...\n')
    time.sleep(5)

    info('\n' + '='*70 + '\n')
    info('*** MULTI-CONTROLLER FAILOVER TEST ***\n')
    info('='*70 + '\n')
    info('Topology: 3 switches, 3 hosts, 2 controllers\n')
    info('Controllers:\n')
    info('  - c0 (Primary):  http://localhost:8080\n')
    info('  - c1 (Backup):   http://localhost:8081\n')
    info('\nOpenVis: http://localhost:3000 (add both controllers)\n')
    info('\nFailover Test Commands:\n')
    info('  1. Check initial connectivity: pingall\n')
    info('  2. Stop primary controller:   sh docker stop openvis-controller\n')
    info('  3. Test failover:             pingall\n')
    info('  4. Check controller status:   sh ovs-vsctl show\n')
    info('  5. Restart primary:           sh docker start openvis-controller\n')
    info('='*70 + '\n\n')

    # Test initial connectivity
    info('*** Testing initial connectivity\n')
    net.pingAll()

    # Display controller connections
    info('\n*** Current controller connections:\n')
    for switch in [s1, s2, s3]:
        info(f'\n{switch.name}:\n')
        result = switch.cmd('ovs-vsctl get-controller', switch.name)
        info(f'  Controllers: {result}')
        result = switch.cmd('ovs-vsctl show | grep -A 5', switch.name)
        info(f'{result}\n')

    info('*** Entering CLI mode\n')
    info('*** Try failover scenarios manually\n\n')

    CLI(net)

    info('*** Stopping network\n')
    net.stop()


def run_automated_failover_test():
    """Run automated failover test scenario"""

    info('*** Starting Automated Failover Test\n\n')

    # 1. Create the network topology
    net = Mininet(controller=RemoteController, switch=OVSSwitch, autoSetMacs=True)

    c0 = net.addController('c0', controller=RemoteController, ip='127.0.0.1', port=6653)
    c1 = net.addController('c1', controller=RemoteController, ip='127.0.0.1', port=6654)

    s1 = net.addSwitch('s1', protocols='OpenFlow13')
    s2 = net.addSwitch('s2', protocols='OpenFlow13')
    s3 = net.addSwitch('s3', protocols='OpenFlow13')

    h1 = net.addHost('h1', ip='10.0.0.1/24')
    h2 = net.addHost('h2', ip='10.0.0.2/24')
    h3 = net.addHost('h3', ip='10.0.0.3/24')

    net.addLink(h1, s1)
    net.addLink(h2, s2)
    net.addLink(h3, s3)
    net.addLink(s1, s2)
    net.addLink(s2, s3)

    net.start()

    # 2. Configure multi-controller setup
    for switch in [s1, s2, s3]:
        switch.cmd('ovs-vsctl set-controller', switch.name, 'tcp:127.0.0.1:6653 tcp:127.0.0.1:6654')

    info('*** Waiting for network stabilization (5s)...\n')
    time.sleep(5)

    # 3. Test initial connectivity
    info('*** Phase 1: Testing initial connectivity\n')
    loss_before = net.ping([h1, h2], timeout='1')
    success_before = loss_before == 0
    info(f'  Result: {"✓ Success" if success_before else "✗ Failed"} ({loss_before}% loss)\n\n')

    # 4. Stop primary controller
    info('*** Phase 2: Stopping primary controller (c0)\n')
    result = subprocess.run(['docker', 'stop', 'openvis-controller'], capture_output=True)
    info(f'  Docker stop: {result.returncode == 0}\n')

    info('*** Waiting for failover (5s)...\n')
    time.sleep(5)

    # 5. Verify traffic continues (failover successful)
    info('*** Phase 3: Testing connectivity after failover\n')
    loss_failover = net.ping([h1, h2], timeout='1')
    success_failover = loss_failover == 0
    info(f'  Result: {"✓ Success - Failover worked!" if success_failover else "✗ Failed - No failover"} ({loss_failover}% loss)\n\n')

    # 6. Restart primary controller
    info('*** Phase 4: Restarting primary controller (c0)\n')
    result = subprocess.run(['docker', 'start', 'openvis-controller'], capture_output=True)
    info(f'  Docker start: {result.returncode == 0}\n')

    info('*** Waiting for recovery (5s)...\n')
    time.sleep(5)

    # 7. Verify recovery
    info('*** Phase 5: Testing connectivity after recovery\n')
    loss_recovery = net.ping([h1, h2], timeout='1')
    success_recovery = loss_recovery == 0
    info(f'  Result: {"✓ Success" if success_recovery else "✗ Failed"} ({loss_recovery}% loss)\n\n')

    # 8. Print summary report
    info('\n' + '='*70 + '\n')
    info('*** FAILOVER TEST SUMMARY ***\n')
    info('='*70 + '\n')
    info(f'Initial Connectivity:     {"✓ PASS" if success_before else "✗ FAIL"}\n')
    info(f'Failover (c0 stopped):    {"✓ PASS" if success_failover else "✗ FAIL"}\n')
    info(f'Recovery (c0 restarted):  {"✓ PASS" if success_recovery else "✗ FAIL"}\n')
    info('='*70 + '\n\n')

    if success_before and success_failover and success_recovery:
        info('*** Overall: ✓ ALL TESTS PASSED - Controller redundancy working!\n\n')
    else:
        error('*** Overall: ✗ SOME TESTS FAILED - Check controller configuration\n\n')

    net.stop()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Multi-Controller Failover Test')
    parser.add_argument(
        '--c0-ip',
        default='127.0.0.1',
        help='Primary controller IP (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--c0-port',
        type=int,
        default=6653,
        help='Primary controller port (default: 6653)'
    )
    parser.add_argument(
        '--c1-ip',
        default='127.0.0.1',
        help='Backup controller IP (default: 127.0.0.1)'
    )
    parser.add_argument(
        '--c1-port',
        type=int,
        default=6654,
        help='Backup controller port (default: 6654)'
    )
    parser.add_argument(
        '--auto',
        action='store_true',
        help='Run automated failover test'
    )
    args = parser.parse_args()

    setLogLevel('info')

    # Check if controllers are running
    info('*** Checking controller availability\n')
    c0_status = check_controller_status(args.c0_ip, args.c0_port)
    c1_status = check_controller_status(args.c1_ip, args.c1_port)

    info(f'  Controller c0 ({args.c0_ip}:{args.c0_port}): {"✓ Running" if c0_status else "✗ Not available"}\n')
    info(f'  Controller c1 ({args.c1_ip}:{args.c1_port}): {"✓ Running" if c1_status else "✗ Not available"}\n')

    if not c0_status and not c1_status:
        error('\n*** ERROR: No controllers are running!\n')
        error('*** Start controllers with: docker-compose up -d\n')
        exit(1)

    if not c0_status or not c1_status:
        warn('\n*** WARNING: Only one controller is running\n')
        warn('*** For full failover testing, start both controllers\n\n')

    if args.auto:
        run_automated_failover_test()
    else:
        multi_controller_topology(
            c0_ip=args.c0_ip,
            c0_port=args.c0_port,
            c1_ip=args.c1_ip,
            c1_port=args.c1_port
        )
