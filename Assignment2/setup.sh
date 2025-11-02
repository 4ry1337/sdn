#!/bin/bash

sudo docker stop pox1 pox2 pox3 2>/dev/null
sudo docker rm pox1 pox2 pox3 2>/dev/null

sudo docker pull haidarns/pox

sudo docker run -d --name pox1 \
  -p 6633:6633 \
  haidarns/pox \
  forwarding.l2_learning

sudo docker run -d --name pox2 \
  -p 6634:6633 \
  haidarns/pox \
  forwarding.l2_learning

sudo docker run -d --name pox3 \
  -p 6635:6633 \
  haidarns/pox \
  forwarding.l2_learning

sudo docker ps -a
