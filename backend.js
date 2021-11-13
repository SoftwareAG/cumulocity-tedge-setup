// spawn
const { spawn } = require("child_process");
const events = require('events');
const ConfigParser = require('configparser');
const fs = require('fs')
const CONFIG_FILE = '/etc/tedge/edge.toml';
// emmitter to signal completion of current task
const taskReady = new events.EventEmitter();

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

function configureEdge(deviceID, tenantURL) {
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
                cmd: 'tedge',
                args: ['connect', 'c8y']
            },
            {
                cmd: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            },
            {
                cmd: 'awk',
                args: ['"!/listener/"', '/etc/tedge/mosquitto-conf/tedge-mosquitto.conf > temp && mv temp']
            },
            {
                cmd: 'echo',
                args: ['"Adding listenener 1883 to config of mosquitto"']
            },
            {
                cmd: 'echo',
                args: ['"listener 1883"', '>>', '/etc/tedge/mosquitto-conf/tedge-mosquitto.conf']
            },
            {
                cmd: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            },
            {
                cmd: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            },
            {
                cmd: 'echo',
                args: ['"Adding allow anonymus true to config of mosquitto"']
            }
        ] */

        const tasks = [
            {
                cmd: 'ls',
                args: ['-la']
            },
            {
                cmd: 'ls',
                args: ['-la']
            },
            {
                cmd: 'ls',
                args: ['-ltr']
            },
            {
                cmd: 'sleepy',
                args: ['5s']
            },
            {
                cmd: 'sleep',
                args: ['10s']
            },
            {
                cmd: 'echo',
                args: ['"Task 3"']
            },
        ];

        socket.emit('cmd-progress', {
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
    console.log(`Start processing task: ${JSON.stringify(tasks[id])}, ${id}`);
    socket.emit('cmd-progress', {
        status: 'processing',
        progress: id + 1 ,
        total: tasks.length,
        cmd: tasks[id].cmd + " " + tasks[id].args.join(' ')
    });
    taskSpawn = spawn(tasks[id].cmd, tasks[id].args);
    taskSpawn.stdout.on('data', (data) => {
        var buffer = new Buffer(data).toString();
        socket.emit('cmd-result', buffer);
    });

    /*   not used 
    taskSpawn.stderr.on('data', (data) => {
        console.log('Error (stderr on data): ' + data);
        var buffer = new Buffer.from(data).toString();
        socket.emit('cmd-result', buffer);
    }); */

    /*   not used  
     taskSpawn.stdout.on('error', (data) => {
        console.log('Error (stdout on error): ' + data);
        var buffer = new Buffer.from(data).toString();
        socket.emit('cmd-result', buffer);
    }); */

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
            socket.emit('cmd-result', `${exitCode} (task ${id})`);
        }
        taskReady.emit(`finished-task-${id}`, exitCode);
    }); 

    taskReady.on(`finished-task-${id}`, (exitCode) => {
        // check error
        if (parseInt(exitCode) !== 0) {
            taskReady.emit(`finished-task-final`, exitCode); 
            socket.emit('cmd-progress', {
                status: 'error',
                progress: id,
                total: tasks.length
            });
        } else  {
            console.log(`Before processing task: ${JSON.stringify(tasks[id])}, ${id}`);
            // prepare next task
            id++
            if (id >= tasks.length) {
                taskReady.emit(`finished-task-final`, exitCode); 
                socket.emit('cmd-progress', {
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

module.exports = { start, configureEdge, getConfig, checkConfig}
