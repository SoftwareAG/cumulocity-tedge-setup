FROM mcr.microsoft.com/vscode/devcontainers/base:debian

ARG TEDGE_VERSION=0.5.0
ENV TEDGE=$TEDGE_VERSION

RUN apt update
RUN apt-get install --yes mosquitto supervisor libmosquitto1 collectd-core collectd nano sudo curl wget procps
RUN apt-get install --yes nodejs npm 

# install edge
# COPY ./tedge/plugins /etc/tedge/sm-plugins
RUN curl -fsSL https://raw.githubusercontent.com/thin-edge/thin-edge.io/main/get-thin-edge_io.sh | sudo sh -s ${TEDGE}
RUN cp /etc/tedge/contrib/collectd/collectd.conf /etc/collectd/collectd.conf

# build angular app
WORKDIR /app/tedge
RUN npm install -g @angular/cli && npm install
COPY ./ /app/tedge
RUN ng build --output-path=/app/tedge/dist/cumulocity-tedge-setup

ENTRYPOINT ["/bin/bash", "/app/tedge/start.sh"]
#ENTRYPOINT ["tail", "-f", "/dev/null"]