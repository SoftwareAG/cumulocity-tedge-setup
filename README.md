# Cumulocity Tedge Setup

This project adds components to the thin edge:
* web UI, for easy setup of the thin edge 
* simple graph to view streamed data
* component to store measurements locally in a mongo db

## Run solution

```
docker-compose up
```

Then access the web UI: http://localhost:9080/#/setup

![Setup](/resource/Setup.png)


Then access the analytics dashboard: http://localhost:9080/#/analytics

![Setup](/resource/Analytics.png)

---

These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.

For more information you can Ask a Question in the [Tech Community Forums](https://tech.forums.softwareag.com/tags/c/forum/1/Cumulocity-IoT).

You can find additional information in the [Software AG Tech Community](https://techcommunity.softwareag.com/en_en/cumulocity-iot.html).
