#FROM node:17-alpine
#FROM  bitnami/minideb
FROM debian:latest

ARG TEDGE_VERSION=0.4.2
ENV TEDGE=$TEDGE_VERSION


RUN apt update
#RUN apt install -y software-properties-common
RUN apt-get install --yes mosquitto supervisor libmosquitto1 collectd-core collectd sudo curl wget
RUN apt-get install --yes docker.io nodejs npm 

# RUN apt install -y mosquitto
# RUN apt install -y supervisor
# RUN apt install -y libmosquitto1
# RUN apt install -y collectd-core
# RUN apt install -y collectd
# RUN apt install -y nano
# RUN apt install -y curl
# RUN apt install -y wget
# RUN apt install -y sudo
# RUN apt install -y docker.io
# RUN apt install -y nodejs npm
#RUN echo $(apt policy libc6)
#RUN apt install -y libc6=2.32-4 
#RUN apt install -y libc6=2.31 -V
# RUN install_packages libc6
# RUN apt install -y libc6

# RUN apt install -y wget 
# RUN apt install -y binutils 
# RUN apt install -y tar


# RUN apk add mosquitto
# # RUN apk add libmosquitto1
# RUN apk add mosquitto-clients
# RUN apk add collectd
# RUN apk add collectd-core
# RUN apk add nano




# install edge
# COPY ./tedge/plugins /etc/tedge/sm-plugins
# alternative 1
RUN curl -fsSL https://raw.githubusercontent.com/thin-edge/thin-edge.io/main/get-thin-edge_io.sh | sudo sh -s 0.4.0
# alternative 2
# RUN wget https://github.com/thin-edge/thin-edge.io/releases/download/${TEDGE}/tedge_${TEDGE}_amd64.deb
# RUN wget https://github.com/thin-edge/thin-edge.io/releases/download/${TEDGE}/tedge_agent_${TEDGE}_amd64.deb
# RUN wget https://github.com/thin-edge/thin-edge.io/releases/download/${TEDGE}/tedge_apt_plugin_${TEDGE}_amd64.deb
# RUN wget https://github.com/thin-edge/thin-edge.io/releases/download/${TEDGE}/tedge_mapper_${TEDGE}_amd64.deb
# alternative 3 (not debian based)
# RUN ar -x tedge_${TEDGE}_amd64.deb | tar -xkf data.tar.xz
# RUN ar -x tedge_agent_${TEDGE}_amd64.deb | tar -xkf data.tar.xz
# RUN ar -x tedge_apt_plugin_${TEDGE}_amd64.deb | tar -xkf data.tar.xz
# RUN ar -x tedge_mapper_${TEDGE}_amd64.deb | tar -xkf data.tar.xz
# RUN chown root:root /usr/bin/tedge
# RUN chown root:root /usr/bin/tedge_agent
# RUN chown root:root /usr/bin/tedge_mapper



RUN cp /etc/tedge/contrib/collectd/collectd.conf /etc/collectd/collectd.conf

# build angular app
COPY ./ /app/tedge
WORKDIR /app/tedge
RUN npm install -g @angular/cli && npm install
RUN ng build --output-path=/app/tedge/dist
RUN mkdir Logs

#CMD ["./start.sh"]
ENTRYPOINT ["tail"]
CMD ["-f","/dev/null"]