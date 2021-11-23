// spawn
const { spawn } = require("child_process");
const events = require('events');
const { TaskQueue } = require("./taskqueue");
// emmitter to signal completion of current task
const taskQueue = new TaskQueue()
const propertiesToJSON = require("properties-to-json");


class ThinEdgeBackend {

    static cmdInProgress = false;
    constructor(socket) {
        this.socket = socket;

        // bin this to all methods of notifier
        Object.keys(this.notifier).forEach(key => {
            this.notifier[key] = this.notifier[key].bind(this)
        });
    }

    notifier = {
        sendProgress: function (task) {
            this.socket.emit('cmd-progress', {
                status: 'processing',
                progress: task.id,
                total: task.total,
                cmd: task.cmd + " " + task.args.join(' ')
            });
        },
        sendResult: function (result) {
            this.socket.emit('cmd-result', result);
        },
        sendError: function (task, exitCode) {
            this.cmdInProgress = false;
            this.socket.emit('cmd-result', `${exitCode} (task ${task.id})`);
            this.socket.emit('cmd-progress', {
                status: 'error',
                progress: task.id,
                total: task.total
            });
        },
        sendJobStart: function (length) {
            this.cmdInProgress = true;
            this.socket.emit('cmd-progress', {
                status: 'start-job',
                progress: 0,
                total: length
            });
        },
        sendJobEnd: function (task) {
            this.cmdInProgress = false;
            this.socket.emit('cmd-progress', {
                status: 'end-job',
                progress: task.id,
                total: task.length
            });
        }
    }

    static getConfiguration(req, res) {

        try {
            let sent = false;
            var stdoutChunks = [];
            const child = spawn('tedge', ['config', 'list']);

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
                console.log('stdout:', Buffer.concat(stdoutChunks).toString());
                if (!sent) {
                    let stdoutContent = Buffer.concat(stdoutChunks).toString();
                    let config = propertiesToJSON (stdoutContent)
                    res.status(200).json(config);
                }
            });
            console.log('Retrieved configuration')
        } catch (err) {
            console.log("Error when reading configuration: " + err)
            res.status(500).json({ data: err });
        }
    }
    static getStatus(req, res) {
        try {
            let sent = false;
            var stdoutChunks = [];
            const child = spawn('top', ['-b', '-n', '1']);
            //const child = spawn('jobs');

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
                console.log('stdout:', Buffer.concat(stdoutChunks).toString());
                if (!sent) {
                    let stdoutContent = Buffer.concat(stdoutChunks).toString();
                    res.status(200).send({result: stdoutContent});
                }
            });
            console.log('Retrieved job status')
        } catch (err) {
            console.log("Error when executing top: " + err)
            res.status(500).json({ data: err });
        }
    }
    
    reset() {
        try {
            console.log('Starting certification creation via subprocess')
            const tasks = [
                {
                    cmd: 'echo',
                    args: ["Starting resetting of certification via subprocess"]
                },
                {
                    cmd: 'tedge',
                    args: ["cert", "remove"]
                },
                {
                    cmd: 'echo',
                    args: ["Starting disconnecting c8y via subproces"]
                },
                {
                    cmd: 'tedge',
                    args: ["disconnect", "c8y"]
                },
                {
                    cmd: 'echo',
                    args: ["Starting kill mosquitto via subproces"]
                },
                {
                    cmd: 'pkill',
                    args: ["mosquitto"]
                },
                {
                    cmd: 'echo',
                    args: ["Starting kill tedge via subprocess"]
                },
                {
                    cmd: 'pkill',
                    args: ["tedge_mapper"]
                },
                {
                    cmd: 'echo',
                    args: ["Starting kill tedge agent via subprocess"]
                },
                {
                    cmd: 'pkill',
                    args: ["tedge_agent"]
                },
                {
                    cmd: 'echo',
                    args: ["Finished resetting edge"]
                }]
            if (!this.cmdInProgress) {
                taskQueue.queueTasks(tasks, true)
                taskQueue.registerNotifier(this.notifier)
                taskQueue.start()
            } else {
                this.socket.emit('cmd-progress', {
                    status: 'ignore',
                    progress: 0,
                    total: 0
                });
            }
        } catch (err) {
            console.error(`The following error occured: ${err.message}`)
        }
    }

    configure(msg) {
        let deviceId = msg.deviceId
        let tenantUrl = msg.tenantUrl
        try {
            console.log(`Starting certification creation via subprocess ${deviceId}, ${tenantUrl}`)

            const tasks = [
                {
                    cmd: 'tedge',
                    args: ["cert", "create", "--device-id", deviceId]
                },
                {
                    cmd: 'tedge',
                    args: ["config", "set", "c8y.url", tenantUrl]
                },
                // {
                //     cmd: 'tedge',
                //     args: ['connect', 'c8y', '--test'],
                //     continueOnError: true
                // },
                {
                    cmd: 'sudo',
                    args: ['tedge', 'connect', 'c8y'],
                    continueOnError: true
                },
                // {
                //     cmd: 'tedge',
                //     args: ['config', 'set', 'software.plugin.default', 'docker']
                // },
            ]
            if (!this.cmdInProgress) {
                taskQueue.queueTasks(tasks, false)
                taskQueue.registerNotifier(this.notifier)
                taskQueue.start()
            } else {
                this.socket.emit('cmd-progress', {
                    status: 'ignore',
                    progress: 0,
                    total: 0
                });
            }
        } catch (err) {
            console.error(`The following error occured: ${err.message}`)
        }
    }

    stop() {
        try {
            console.log(`Stopping edge processes ${this.cmdInProgress}...`)
            const tasks = [
                {
                    cmd: 'pkill',
                    args: ["mosquitto"]
                },
                {
                    cmd: 'pkill',
                    args: ["tedge_mapper"]
                },
                {
                    cmd: 'pkill',
                    args: ["tedge_agent"]
                },
                {
                    cmd: 'pkill',
                    args: ["collectd"]
                },
            ]
            if (!this.cmdInProgress) {
                taskQueue.queueTasks(tasks, true)
                taskQueue.registerNotifier(this.notifier)
                taskQueue.start()
            } else {
                this.socket.emit('cmd-progress', {
                    status: 'ignore',
                    progress: 0,
                    total: 0
                });
            }
        } catch (err) {
            console.error(`The following error occured: ${err.message}`)
        } 
    }

    start() {
        try {
            console.log(`Starting edge ${this.cmdInProgress}...`)
            const tasks = [
                {
                    cmd: 'echo',
                    args: ['Adding allow anonymus true to config of mosquitto']
                },
                {
                    cmd: 'sh',
                    args: ['-c', "awk ''!/listener/'' /etc/tedge/mosquitto-conf/tedge-mosquitto.conf > temp"]
                },
                {
                    cmd: 'mv',
                    args: ['temp', '/etc/tedge/mosquitto-conf/tedge-mosquitto.conf']
                },
                {
                    cmd: 'sh',
                    args: ['-c', "echo ''listener 1883'' >> /etc/tedge/mosquitto-conf/tedge-mosquitto.conf"]
                },
                {
                    cmd: 'sh',
                    args: ['-c', "awk ''!/pid_file/'' /etc/mosquitto/mosquitto.conf  > temp"]
                },
                {
                    cmd: 'mv',
                    args: ['temp', '/etc/mosquitto/mosquitto.conf']
                },
                {
                    cmd: 'mosquitto',
                    args: ['-c', '/etc/mosquitto/mosquitto.conf', '-v', '-d'],
                    continueOnError: true
                },
                // {
                //     cmd: 'tedge',
                //     args: ['connect', 'c8y', '--test'],
                //     continueOnError: true
                // },
                {
                    cmd: 'sudo',
                    args: ['tedge', 'connect', 'c8y', '--test'],
                    continueOnError: true
                },
                {
                    cmd: 'sh',
                    args: ['-c', 'tedge_mapper c8y &']
                },
                {
                    cmd: 'sh',
                    args: ['-c', 'tedge_mapper collectd &']
                },
                {
                    cmd: 'sh',
                    args: ['-c', 'collectd &']
                },
                {
                    cmd: 'sh',
                    args: ['-c', 'tedge_mapper sm-c8y &']
                }
                ,
                {
                    cmd: 'sh',
                    args: ['-c', 'tedge_agent &']
                },
            ]

            if (!this.cmdInProgress) {
                taskQueue.queueTasks(tasks, false)
                taskQueue.registerNotifier(this.notifier)
                taskQueue.start()
            } else {
                this.socket.emit('cmd-progress', {
                    status: 'ignore',
                    progress: 0,
                    total: 0
                });
            }

        } catch (err) {
            console.error(`Error when starting edge:${err}`, err)
        }
    }

}
module.exports = { ThinEdgeBackend }