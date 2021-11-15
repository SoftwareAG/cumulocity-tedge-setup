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
var distDir = __dirname + "/dist/cumulocity-tedge-setup";
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
});


/*  "/api/download/certificate"
 *   GET: certificate 
 */
app.get("/api/certificate", function (req, res) {
    let deviceId = parseInt(req.query.deviceId);
    backend = new thinEdgeBackend.ThinEdgeBackend(null)
    res.setHeader('Content-Disposition', 'attachment; filename=' + deviceId + '.pem');
    res.status(200).sendFile("/etc/tedge/device-certs/tedge-certificate.pem");
});


/*  "/api/configuration"
 *   GET: configuration 
 */
app.get("/api/configuration", function (req, res) {

    let cfg = new thinEdgeBackend.ThinEdgeBackend.getConfiguration()
    res.setHeader('Content-Disposition', 'attachment; filename=' + deviceId + '.pem')
    res.status(200).json(cfg)
});


/*  "/config"
 *   POST: Change proxy to communicate with cloud instance. This is required to avoid CORS errors
 */
app.post("/config", function (req, res) {
    let proxy = req.body.proxy
    console.log(`setting proxy: ${proxy}`);
    options.target = proxy
    // set up proxy 
    app.use('/c8y', options);
    res.status(200).json({ result: "OK" });
});


io.on('connection', function (socket) {
    backend = new thinEdgeBackend.ThinEdgeBackend(socket)
    socket.on('cmd-in', function (message) {
        msg = JSON.parse(message)
        console.log(`New cmd: ${message}`, message.cmd, msg.cmd);
        message = msg
        if (message.cmd == 'start')  {
            backend.start();
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