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

const options = createProxyMiddleware(
    {
        target: 'https://ck2.eu-latest.cumulocity.com',
        changeOrigin: true,
        secure: true,
        pathRewrite: { '^/c8y': '' }
    }
);
// send 
const taskReady = new events.EventEmitter();

// avoid starting the edge twice
var inStartMode = false

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



function checkConfig() {
    try {
        return fs.exists(CONFIG_FILE)
    } catch (err) {
        console.error("The following error occured: ${err.message}")
        return false
    }
}

function getConfig() {
    try {
        toml = new ConfigParser()
        toml.read(CONFIG_FILE)
        deviceID = toml['Device']['id']
        tenantURL = toml['MQTT']['URL']
        return deviceID, tenantURL
    } catch (err) {
        console.error("The following error occured: ${err.message}")
        return 0, 0
    }
}

function configuration(deviceID, tenantURL) {
    try {
        console.log('Starting certification creation via subprocess')

        try {
            const createCertification = spawn('tedge', ["cert", "create", "--device-id", deviceID]);
            createCertification.on('close', (code) => {
                console.log(`Received result code from certification create: ${code}`);
                if (code == 0) {
                    console.log('Starting config set of tenant url creation via subprocess')
                    tenantConfig = spawn('tedge', ["config", "set", "c8y.url", tenantURL]);
                    tenantConfig.on('close', (code) => {
                        console.log(`Received result code from tenant configuration: ${code}`);
                    })
                }
            });
        } catch (error) {
            console.error('Error when creating certificate:', error);
        }
    } catch (err) {
        console.error(`The following error occured: ${err.message}`)
        return 0, 0
    }
}

function start(socket) {
    try {
        console.log('Starting edge ...')
        /*         const startEdge = spawn('./start.sh');
                startEdge.on('close', (code) => {
                    console.log(`Received result code from starting edge: ${code}`);
                }); */
/*         tasks = [
            {
                task: 'tedge',
                args: ['connect', 'c8y']
            },
            {
                task: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            },
            {
                task: 'awk',
                args: ['"!/listener/"', '/etc/tedge/mosquitto-conf/tedge-mosquitto.conf > temp && mv temp']
            },
            {
                task: 'echo',
                args: ['"Adding listenener 1883 to config of mosquitto"']
            },
            {
                task: 'echo',
                args: ['"listener 1883"', '>>', '/etc/tedge/mosquitto-conf/tedge-mosquitto.conf']
            },
            {
                task: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            },
            {
                task: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            },
            {
                task: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            }
        ] */

        const tasks = [
            {
                task: 'ls',
                args: ['-la']
            },
            {
                task: 'ls',
                args: ['-la']
            },
            {
                task: 'ls',
                args: ['-ltr']
            },
            {
                task: 'sleep',
                args: ['5s']
            },
            {
                task: 'sleep',
                args: ['10s']
            },
            {
                task: 'echo',
                args: ['"Task 3"']
            },
        ];

        socket.emit('start-edge', {
            status: 'starting',
            progress: 0,
            total: tasks.length
        });
        let id = 0;
        queueTask(tasks, id, socket);
        taskReady.on(`finished-task-final`, (exitCode) => {
               console.log(`Received event finished-task-final: ${exitCode}`);
               taskReady.removeAllListeners();
               inStartMode = false;
        })

    } catch (err) {
        console.error(`Error when starting edge:${err.message}`)
    }
}

function queueTask(tasks, id, socket) {
    taskSpawn = spawn(tasks[id].task, tasks[id].args);
    taskSpawn.on('exit', (exitCode) => {
        if (parseInt(exitCode) !== 0) {
            //Handle non-zero exit
            console.error(`Error (event exit): ${exitCode} on task ${id}`)
        }
        taskReady.emit(`finished-task-${id}`, exitCode);
    });

    taskSpawn.on('error', (exitCode) => {
        if (parseInt(exitCode) !== 0) {
            //Handle non-zero exit
            console.error(`Error (event error): ${exitCode} on task ${id}`)
        }
        taskReady.emit(`finished-task-${id}`, exitCode);
    });

    taskReady.on(`finished-task-${id}`, (exitCode) => {
        // check error
        if (parseInt(exitCode) !== 0) {
            taskReady.emit(`finished-task-final`, exitCode); 
            socket.emit('start-edge', {
                status: 'error',
                progress: id,
                total: tasks.length
            });
        } else  {
            console.log(`Bevor processing task: ${JSON.stringify(tasks[id])}, ${id}`);
            socket.emit('start-edge', {
                status: 'processed',
                progress: id + 1 ,
                total: tasks.length
            });

            // prepare next task
            id++
            if (id >= tasks.length) {
                taskReady.emit(`finished-task-final`, exitCode); 
                socket.emit('start-edge', {
                    status: 'end',
                    progress: id,
                    total: tasks.length
                });
            } else {
                //console.log(`Nach processing task: ${JSON.stringify(tasks[id])}, ${id}`);
                queueTask(tasks, id, socket );
            }
        }
    }
    );
}

io.on('connection', function (socket) {
    socket.on('start', function (message) {
        if (!inStartMode)  {
            inStartMode = true;
            start(socket);
            console.log(message);
        } else {
            socket.emit('start-edge', {
                status: 'ignore',
                progress: 0,
                total: 0
            });
        }
    });
});