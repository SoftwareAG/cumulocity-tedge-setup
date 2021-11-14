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

    configureEdge(deviceID, tenantURL) {
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

    start(socket) {
        try {
            console.log(`Starting edge ${inStartMode}...`)
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
                            args: ['"!/listener/"', '/etc/tedge/mosquitto-conf/tedge-mosquitto.conf', '>', 'temp && mv temp']
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
                            cmd: 'awk',
                            args: ['!/pid_file/'', '/etc/mosquitto/mosquitto.conf', '>',  'temp', '&&', 'mv temp /etc/mosquitto/mosquitto.conf']
                        },
                        {
                            cmd: 'mosquitto',
                            args: ['-c',  '/etc/mosquitto/mosquitto.conf', '-v', '-d']
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
            ];

            if (!inStartMode) {
                taskQueue.queueTasks(tasks)
                taskQueue.registerNotifier(this.notifier)
                taskQueue.start()
            } else {
                socket.emit('cmd-progress', {
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