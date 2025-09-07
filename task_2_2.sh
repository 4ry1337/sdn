#!/bin/bash

ovs-ofctl del-flows s1
ovs-ofctl del-flows s2
ovs-ofctl del-flows s3
ovs-ofctl del-flows s4
ovs-ofctl del-flows s5
ovs-ofctl del-flows s6
ovs-ofctl del-flows s7
ovs-ofctl del-flows s8

ovs-ofctl add-flow s1 actions=flood
ovs-ofctl add-flow s2 actions=flood  
ovs-ofctl add-flow s3 actions=flood
ovs-ofctl add-flow s4 actions=flood
ovs-ofctl add-flow s5 actions=flood
ovs-ofctl add-flow s6 actions=flood
ovs-ofctl add-flow s7 actions=flood
ovs-ofctl add-flow s8 actions=flood
