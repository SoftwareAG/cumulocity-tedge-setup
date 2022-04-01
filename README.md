# Cumulocity Thin Edge Setup

This project adds a ueb-ui to the thin edge. This helps to setup and monitor the edge using a web-ui:
* web-ui, for easy setup of the thin edge 
* simple line chart to view streamed data and to view historical data
* component to store measurements locally in a mongo db

## Solution components
This solution consists of 3 components
* tedge component: contain the thin edge core services: tedge_agent, tedge_mapper, ... and web-ui app
* mqtt_colletctor: listens to measurements on all topics of the mosquitto broker and sends them to the mongo db
* mongodb: stores the measurements in a colletion, to be retrieved by the web-ui. All measurements have time-to-live (TTL) of 300. This can be changed


## Build thin edge binaries

```
cd tedge
docker build --file Dockerfile-build --output bin .
```

## Run solution

```
docker-compose up
```

## Setup in web-ui
Then access the web-ui: http://localhost:9080/#/setup to start to setup the edge and enter external device id and your cumulocity tenant url.\
Then press configure:
<img width="1399" alt="01-Configure Edge" src="https://user-images.githubusercontent.com/29702059/159691156-a8525deb-0710-4d53-9956-5d1e19d473f2.png">
This will generate a certificate. This has to be downloaded through the web-ui for registerin gthe thin edge devic ein the cloud
<img width="1399" alt="02-Download Certificate" src="https://user-images.githubusercontent.com/29702059/159691386-eced661f-e965-4ef5-b67f-27fa29607cb8.png">

The certificate is [uploaded](https://cumulocity.com/guides/users-guide/device-management/#managing-trusted-certificates) to your cumulocity cloud tenant.\
Download the certificate.\
When the certificate is uploaded you can start the edge:
<img width="1399" alt="03a-Start Edge" src="https://user-images.githubusercontent.com/29702059/159691652-f6d494b3-d963-409c-8457-1acfb40ce2ac.png">
If everything went well the completion of the startup is acknowledged:

<img width="1399" alt="03b-Start Edge" src="https://user-images.githubusercontent.com/29702059/159692443-dcb8007c-5a65-4947-9c39-71d373467b1b.png">

The registration to the cloud can be verified here:
<img width="1399" alt="04-Test registration in cloud" src="https://user-images.githubusercontent.com/29702059/159692535-8d094dae-707c-46ea-a748-a2d0c7e74744.png">

Then you can access the analytics dashboard : http://localhost:9080/#/analytics

<img width="1399" alt="05-Analyse measurements" src="https://user-images.githubusercontent.com/29702059/159692703-888c9a60-075a-4fad-916b-915f58a99128.png">

and change the settings of the chart:
<img width="1399" alt="06-Change settings line chart" src="https://user-images.githubusercontent.com/29702059/159692831-7702c60a-e88e-48d1-b6e6-d8b24609e744.png">