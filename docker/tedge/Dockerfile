FROM mcr.microsoft.com/vscode/devcontainers/base:debian

RUN apt update
RUN apt install -y software-properties-common
RUN apt update
RUN apt install -y mosquitto
RUN apt install -y supervisor
RUN apt install -y libmosquitto1
RUN apt install -y collectd-core
RUN apt install -y collectd
RUN apt install -y nano
RUN apt install -y docker.io
RUN apt install -y nodejs npm

COPY ./ /app/build
COPY ./plugins /etc/tedge/sm-plugins
COPY ../../server /app
RUN curl -fsSL https://raw.githubusercontent.com/thin-edge/thin-edge.io/main/get-thin-edge_io.sh | sudo sh -s 0.4.0
RUN cp /etc/tedge/contrib/collectd/collectd.conf /etc/collectd/collectd.conf
RUN npm install -g @angular/cli
WORKDIR /app/build
RUN ng build 

#CMD ["./start.sh"]
ENTRYPOINT ["tail", "-f", "/dev/null"]