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
const ConfigParser = require('configparser');
const fs = require('fs')
const CONFIG_FILE = '/etc/tedge/edge.toml';
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

// Init the server
/* var server = app.listen(process.env.PORT || 9080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
}); */

const server = http.createServer(app);
// Pass a http.Server instance to the listen method
// const io = new Server(server);
const io = socketIO(server);
// The server should start listening
server.listen(process.env.PORT || 9080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});



/*  "/api/status"
 *   GET: Get server status
 */
app.get("/api/status", function (req, res) {
    res.status(200).json({ status: "UP" });
});

/*  "/api/update"
 *   GET: Update 
 */
app.get("/api/update", function (req, res) {
    let name = req.query.name
    let description = req.query.description
    let isComplex = (req.query.isComplex === 'true');
    console.log("Certificate update", name, description, isComplex);
    res.status(200).json({ result: "ok" });
});



/*  "/api/calc"
 *   GET: Calc 
 */
app.get("/api/calc", function (req, res) {
    let a = parseFloat(req.query.a);
    let b = parseFloat(req.query.b);
    res.status(200).json({ result: a + b });
});

/*  "/api/cmd"
 *   POST: Run a command
 */
app.post("/api/cmd", function (req, res) {
    let cmd = req.body.cmd
    let args = req.body.args
    let sent = false;
    console.log(`cmd called: ${cmd} with ${args}`);
    /*     ls.stdout.on("data", data => {
            console.log(`stdout: ${data}`);
            res.status(200).json({ data:  data });
        }); */
    try {
        var stdoutChunks = [], stderrChunks = [];
        const child = spawn(cmd, args);


        child.stdout.on('data', (data) => {
            stdoutChunks = stdoutChunks.concat(data);
        });

        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
            res.status(500).json(data);
            sent = true;
        });

        child.on('error', function (err) {
            console.log('Error : ' + err);
            res.status(500).json(err);
            sent = true;
        });

        child.stdout.on('end', (data) => {
            console.log('stdout:', data);
            if (!sent) {
                var stdoutContent = Buffer.concat(stdoutChunks).toString();
                console.log(`stdout: ${stdoutContent}`);
                res.status(200).json(stdoutContent);
            }
        });

        child.stdout.on('close', () => {
            console.log('calling close!');
        });

    } catch (err) {
        console.log("exception: " + err)
        res.status(500).json({ data: err });
    }
});

/*  "/config"
 *   POST: Change proxy
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
        console.log(`New cmd: ${message}`, message);
        if (message.cmd == 'start')  {
            backend.start(socket);
            console.log(message);
        } else {
            socket.emit('cmd-progress', {
                status: 'ignore',
                progress: 0,
                total: 0
            });
        }
    });
});