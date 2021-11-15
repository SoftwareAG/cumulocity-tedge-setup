// spawn
const { spawn } = require("child_process");
const events = require('events');
const ConfigParser = require('configparser');
const fs = require('fs')
const CONFIG_FILE = '/etc/tedge/tedge.toml';
const { TaskQueue } = require("./taskqueue");
// emmitter to signal completion of current task
const taskQueue = new TaskQueue()


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

    static getConfiguration() {
        try {
            let toml = new ConfigParser()
            toml.read(CONFIG_FILE)
            let deviceId
            try {
                deviceId = toml['device']['id']
            } catch (err){
                deviceId = undefined
            }
            let tenantUrl 
            try {
                tenantUrl = 'https://' + toml['mqtt']['url']
            } catch (err){
                tenantUrl = undefined
            }
            
            return {
                deviceId: deviceId,
                tenantUrl: tenantUrl
            }

        } catch (err) {
            console.error("The following error occured:", err)
            return {
                deviceId: undefined,
                tenantUrl: undefined
            }
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
                }]
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

    start() {
        try {
            console.log(`Starting edge ${this.cmdInProgress}...`)
            const tasks = [
                {
                    cmd: 'tedge',
                    args: ['connect', 'c8y']
                },
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
                    cmd: 'echo',
                    args: ['Adding listenener 1883 to config of mosquitto']
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
                {
                    cmd: 'tedge',
                    args: ['connect', 'c8y', '--test'],
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
                    cmd: 'tedge',
                    args: ['config', 'set', 'software.plugin.default', 'docker']
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

            /*             const tasks = [
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
                                cmd: 'echo',
                                args: ['Task 3']
                            },
                            {
                                cmd: 'sleepy',
                                args: ['5s']
                            },
                            {
                                cmd: 'sleep',
                                args: ['10s']
                            },
                        ]; */

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