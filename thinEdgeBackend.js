// spawn
const { spawn } = require("child_process");
const events = require('events');
const ConfigParser = require('configparser');
const fs = require('fs');
const { TaskQueue } = require("./taskqueue");
// emmitter to signal completion of current task
const taskQueue = new TaskQueue()
var inStartMode = false;


class ThinEdgeBackend {

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
            inStartMode = false;
            this.socket.emit('cmd-result', `${exitCode} (task ${task.id})`);
            this.socket.emit('cmd-progress', {
                status: 'error',
                progress: task.id,
                total: task.total
            });
        },
        sendJobStart: function (length) {
            inStartMode = true;
            this.socket.emit('cmd-progress', {
                status: 'start-job',
                progress: 0,
                total: length
            });
        },
        sendJobEnd: function (task) {
            inStartMode = false;
            this.socket.emit('cmd-progress', {
                status: 'end-job',
                progress: task.id,
                total: task.length
            });
        }
    }
    checkConfig() {
        try {
            return fs.existsSync(CONFIG_FILE)
        } catch (err) {
            console.error("The following error occured: ${err.message}")
            return false
        }
    }

    getConfig() {
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

    reset() {
        deviceID = msg.deviceId
        tenantUrl = msg.tenantUrl
        try {
            console.log('Starting certification creation via subprocess')

                tasks = [
                    {
                        cmd: 'echo',
                        args: ["Starting resetting of certification via subprocess"]
                    },
                    {
                        cmd: 'tedge ',
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
                        cmd: 'tedge',
                        args: ["config", "set", "c8y.url", tenantURL]
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
            taskQueue.queueTasks(tasks)
            taskQueue.registerNotifier(this.notifier)
            taskQueue.start()
        } catch (err) {
            console.error(`The following error occured: ${err.message}`)
            return 0, 0
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
            taskQueue.queueTasks(tasks)
            taskQueue.registerNotifier(this.notifier)
            taskQueue.start()
        } catch (err) {
            console.error(`The following error occured: ${err.message}`)
            return 0, 0
        }
    }

    start() {
        try {
            console.log(`Starting edge ${inStartMode}...`)
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
                    cmd: 'awk',
                    args: ["'!/listener/'", '/olga/etc/tedge/mosquitto-conf/tedge-mosquitto.conf', '>', 'temp && mv temp']
                },
                {
                    cmd: 'echo',
                    args: ['Adding listenener 1883 to config of mosquitto']
                },
                {
                    cmd: 'echo',
                    args: ['listener 1883', '>>', '/etc/tedge/mosquitto-conf/tedge-mosquitto.conf']
                },
                {
                    cmd: 'awk',
                    args: ['\'!/pid_file/\'', ' / etc / mosquitto / mosquitto.conf', ' > ',  'temp', ' && ', 'mv temp / etc / mosquitto / mosquitto.conf']
                        },
                {
                    cmd: 'mosquitto',
                    args: ['-c', '/etc/mosquitto/mosquitto.conf', '-v', '-d']
                },
                {
                    cmd: 'tedge',
                    args: ['connect', 'c8y', '--test']
                },
                {
                    cmd: 'tedge_mapper',
                    args: ['c8y', '&']
                },
                {
                    cmd: 'tedge_mapper',
                    args: ['collectd', '&']
                },
                {
                    cmd: 'collectd',
                    args: ['&']
                },
                {
                    cmd: 'tedge',
                    args: ['config', 'set', 'software.plugin.default', 'docker']
                },
                {
                    cmd: 'tedge_mapper',
                    args: ['sm-c8y', '&']
                }
                ,
                {
                    cmd: 'tedge_agent',
                    args: ['&']
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

            if (!inStartMode) {
                taskQueue.queueTasks(tasks)
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