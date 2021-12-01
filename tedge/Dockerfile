#FROM node:17-alpine
#FROM  bitnami/minideb
#FROM debian:latest
FROM mcr.microsoft.com/vscode/devcontainers/base:debian

ARG TEDGE_VERSION=0.4.0
ENV TEDGE=$TEDGE_VERSION


RUN apt update
#RUN apt-get install --yes mosquitto supervisor libmosquitto1 collectd-core collectd nano sudo curl wget
RUN apt-get install --yes mosquitto supervisor libmosquitto1 collectd-core collectd nano sudo curl wget procps
# RUN apt-get install --yes docker.io nodejs npm 
RUN apt-get install --yes nodejs npm 

# install edge
# COPY ./tedge/plugins /etc/tedge/sm-plugins
# alternative 1
# apama plugn dddoesn't exist, revert to previous version
# RUN curl -fsSL https://raw.githubusercontent.com/thin-edge/thin-edge.io/main/get-thin-edge_io.sh | sudo sh -s 0.4.0
RUN curl -fsSL https://raw.githubusercontent.com/thin-edge/thin-edge.io/dcc0f9b151a3f104fe29cab0ed787c599b7a093a/get-thin-edge_io.sh | sudo sh -s 0.4.0
RUN cp /etc/tedge/contrib/collectd/collectd.conf /etc/collectd/collectd.conf

# build angular app
COPY ./ /app/tedge
WORKDIR /app/tedge
RUN npm install -g @angular/cli && npm install
RUN ng build --output-path=/app/tedge/dist/cumulocity-tedge-setup

ENTRYPOINT ["/bin/bash", "/app/tedge/start.sh"]
#ENTRYPOINT ["tail", "-f", "/dev/null"]