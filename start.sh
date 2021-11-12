tedge connect c8y
echo 'Adding allow anonymus true to config of mosquitto'
awk '!/listener/' /etc/tedge/mosquitto-conf/tedge-mosquitto.conf > temp && mv temp /etc/tedge/mosquitto-conf/tedge-mosquitto.conf
echo 'Adding listenener 1883 to config of mosquitto'
echo 'listener 1883' >> /etc/tedge/mosquitto-conf/tedge-mosquitto.conf
awk '!/pid_file/' /etc/mosquitto/mosquitto.conf > temp && mv temp /etc/mosquitto/mosquitto.conf
mosquitto -c /etc/mosquitto/mosquitto.conf -v -d
tedge connect c8y --test
tedge_mapper c8y &
tedge_mapper collectd &
collectd &
tedge config set software.plugin.default docker
tedge_mapper sm-c8y &
tedge_agent &