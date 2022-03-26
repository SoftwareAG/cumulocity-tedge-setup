// Overwrite console
require('console-stamp')(console, '[HH:MM:ss.l]');
// Use Express
const express = require("express");
const http = require('http');
// Use body-parser
const bodyParser = require("body-parser");
//proxy
const { createProxyMiddleware } = require('http-proxy-middleware');
// spawn
const { spawn } = require("child_process");
const events = require('events');
const socketIO  = require('socket.io')
// Create new instance of the express server
const app = express();
const thinEdgeBackend = require('./thinEdgeBackend.js');

const options = createProxyMiddleware(
    {
        target: 'https://ck2.eu-latest.cumulocity.com',
        changeOrigin: true,
        secure: true,
        pathRewrite: { '^/c8y': '' }
    }
);

// set up proxy 
app.use('/c8y', options);

// Define the JSON parser as a default way 
// to consume and produce data through the 
// exposed APIs
app.use(express.json());

// Create link to Angular build directory
// The `ng build` command will save the result
// under the `dist` folder.
var distDir = __dirname + "/../dist/cumulocity-tedge-setup";
//app.use("/home", express.static(distDir));
app.use(express.static(distDir));


const server = http.createServer(app);
// Pass a http.Server instance to the listen method
// const io = new Server(server);
const io = socketIO(server);
// The server should start listening
server.listen(process.env.PORT || 9080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
    thinEdgeBackend.ThinEdgeBackend.connect2Mongo();
});


/*  "/api/download/certificate"
 *   GET: certificate 
 */
app.get("/api/certificate", function (req, res) {
    let deviceId = req.query.deviceId;
    console.log(`Download certificate for : ${deviceId}`);
    res.status(200).sendFile("/etc/tedge/device-certs/tedge-certificate.pem");
});

/*  "/api/series"
*   GET: series 
*/
app.get("/api/series", function (req, res) {
    thinEdgeBackend.ThinEdgeBackend.getSeries(req,res)
});


/*  "/api/edgeConfiguration"
*   GET: edgeConfiguration 
*/
app.get("/api/edgeConfiguration", function (req, res) {
    thinEdgeBackend.ThinEdgeBackend.getEdgeConfiguration(req,res)
});

/*  "/api/getLastMeasurements"
*   GET: getLastMeasurements 
*/
app.get("/api/measurement", function (req, res) {
    thinEdgeBackend.ThinEdgeBackend.getMeasurements(req,res)
});

/*  "/api/status"
*   GET: status 
*/
app.get("/api/status", function (req, res) {
    thinEdgeBackend.ThinEdgeBackend.getStatus(req,res)
});

/*  "/config"
 *   POST: Change proxy to communicate with cloud instance. This is required to avoid CORS errors
 */
app.post("/config", function (req, res) {
    let proxy = req.body.proxy
    console.log(`Setting proxy: ${proxy}`);
    options.target = proxy
    // set up proxy 
    app.use('/c8y', options);
    res.status(200).json({ result: "OK" });
});

/*  "/analyticsConfiguration"
 *   POST: Change analytics widget configuration 
 */
app.post("/api/analyticsConfiguration", function (req, res) {
    thinEdgeBackend.ThinEdgeBackend.setAnalyticsConfiguration(req,res)
});

/*  "/analyticsConfiguration"
 *   GET: Get analytics widget configuration 
 */
app.get("/api/analyticsConfiguration", function (req, res) {
    thinEdgeBackend.ThinEdgeBackend.getAnalyticsConfiguration(req,res)
});

/* 
*   Empty dummy responses to avoid errors in the browser console 
*/
app.get("/apps/*", function (req, res) {
    console.log ("Ignore request!");
    res.status(200).json({ result: "OK" });
});
app.get("/tenant/*", function (req, res) {
    console.log ("Ignore request!");
    res.status(200).json({ result: "OK" });
});

app.get("/application/*", function (req, res) {
    console.log ("Ignore request!");
    const result = {
        "applications": [
        ]
    }
    res.status(200).json(result);
});

io.on('connection', function (socket) {
    console.log(`New connection from web ui: ${socket.id}`);
    backend = new thinEdgeBackend.ThinEdgeBackend(socket)
    socket.on('cmd-in', function (message) {
/*         msg = JSON.parse(message)
        console.log(`New cmd: ${message}`, message.cmd, msg.cmd);
        message = msg */
        console.log(`New cmd: ${message}`, message.cmd);
        if (message.cmd == 'start')  {
            backend.start();
        } else if (message.cmd == 'stop')  {
            backend.stop( message);
        } else if (message.cmd == 'configure')  {
            backend.configure( message);
        } else if (message.cmd == 'reset')  {
            backend.reset();
        } {
            socket.emit('cmd-progress', {
                status: 'ignore',
                progress: 0,
                total: 0
            });
        }
    });
});