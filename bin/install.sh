#!/bin/bash
cp ./bin/jbprd.service /lib/systemd/system/
systemctl enable jbprd
service jbprd start