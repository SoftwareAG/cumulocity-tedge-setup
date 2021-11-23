#FROM node:17-alpine
#FROM  bitnami/minideb
FROM debian:latest

ARG TEDGE_VERSION=0.4.0
ENV TEDGE=$TEDGE_VERSION


RUN apt update
RUN apt-get install --yes mosquitto supervisor libmosquitto1 collectd-core collectd nano sudo curl wget procps
RUN apt-get install --yes docker.io nodejs npm 

# install edge
# COPY ./tedge/plugins /etc/tedge/sm-plugins
# alternative 1
RUN curl -fsSL https://raw.githubusercontent.com/thin-edge/thin-edge.io/main/get-thin-edge_io.sh | sudo sh -s 0.4.0


RUN cp /etc/tedge/contrib/collectd/collectd.conf /etc/collectd/collectd.conf

# build angular app
# COPY ./ /app/tedge
# WORKDIR /app/tedge
# RUN npm install -g @angular/cli && npm install
# RUN ng build --output-path=/app/tedge/dist/cumulocity-tedge-setup
# RUN mkdir Logs

#CMD ["./start.sh"]
ENTRYPOINT ["tail"]
CMD ["-f","/dev/null"]