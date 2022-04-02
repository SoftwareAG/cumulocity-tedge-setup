# Cumulocity Thin Edge Setup


This project adds a ueb-ui to the thin edge. This helps to setup and monitor the edge using a web-ui:
* web-ui, for easy setup of the thin edge 
* simple line chart to view streamed data and to view historical data
* component to store measurements locally in a mongo db

# Content
1. [Solution components](#solution-components)
2. [Build thin edge binaries and run solution](#build-thin-edge-binaries-and-run-solution)
3. [Configure thin edge in the web-ui](#configure-thin-edge-in-the-web-ui)

# Solution components

This solution consists of 3 components
* tedge component: contain the thin edge core services: tedge_agent, tedge_mapper, ... and web-ui app
* mqtt_colletctor: listens to measurements on all topics of the mosquitto broker and sends them to the mongo db
* mongodb: stores the measurements in a colletion, to be retrieved by the web-ui. All measurements have time-to-live (TTL) of 300. This can be changed

![Components of Docker Container tedge-ui](/resource/01-Architecture.svg)
![Docker Container](/resource/02-Architecture.svg)

# Build thin edge binaries and run solution

To build the thin edge binaries run:
```
cd tedge
docker build --file Dockerfile-build --output bin .
```
To build the docker solution run:
```
docker-compose up
```

# Configure thin edge in the web-ui

To access the web-ui open a web bowser at: http://localhost:9080/#/setup.\
Here you start the setup of the edge and enter external device id and your cumulocity tenant url.\
![Setup](/resource/01-Setup.png)
Then press configure to create a device certificate. This Will late be upladed to you cloud tenant. The thin edge uses th ecertificate for authentication:
![Setup](/resource/02-Setup.png)
This will generate a certificate. This has to be uploaded through the web-ui. As mentioned before, the certificate is uploaded to the cloud tenant.
![Setup](/resource/03-Setup.png)
Alternatively, you can download the certificate locally and upload it manually to your cloud tenant.
![Setup](/resource/05-Setup.png)
A detailed decription how to import your certificate can de found is [Cumulocity Adminstration Documentation](https://cumulocity.com/guides/users-guide/device-management/#managing-trusted-certificates) to your cumulocity cloud tenant.\
Download the certificate.\
When the certificate is uploaded you can start the edge. If everything went well the completion of the startup is acknowledged
![Setup](/resource/01-Control.png)

The edge processes are started and the thin edge is registered in the cloud tenant
![Setup](/resource/01-Cloud.png)

The registration to the cloud can be verified here as well:
![Setup](/resource/02-Cloud.png)

Then you can access the analytics dashboard : http://localhost:9080/#/analytics

![Setup](/resource/01-Analysis.png)

and change the settings of the chart:
![Setup](/resource/02-Analysis.png)
