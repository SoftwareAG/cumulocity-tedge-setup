// spawn
const { spawn } = require("child_process");
const events = require('events');
const { TaskQueue } = require("./taskqueue");
const fs = require('fs');
// emmitter to signal completion of current task
const taskQueue = new TaskQueue()
const propertiesToJSON = require("properties-to-json");
const MongoClient = require('mongodb').MongoClient;
const MONGO_URL = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
const MONGO_MEASUEMENT_COLLECTION = "measurement"
const MONGO_SERIES_COLLECTION = "serie"
const MONGO_DB = "localDB"
const ANALYTICS_CONFIG ='/etc/tedge/analyticsConfig.json'

class ThinEdgeBackend {

    static cmdInProgress = false;
    static measurementCollection = null;
    static seriesCollection = null;
    constructor(socket) {
        this.socket = socket;

        // bind this to all methods of notifier
        Object.keys(this.notifier).forEach(key => {
            this.notifier[key] = this.notifier[key].bind(this)
        });
        //console.log(`Socket: ${socket.id}`)
        if (ThinEdgeBackend.measurementCollection == null || ThinEdgeBackend.seriesCollection == null) {
            console.log(`Connect to mongo first: ${socket.id}`)
        } else {
            this.watchMeasurementColletion();
        }
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

    // connect2Mongo() {
    //     let localSocket = this.socket;
    //     MongoClient.connect(MONGO_URL, function(err, client) {
    //         if (err) throw err;
    //         let dbo = client.db(MONGO_DB);
    //         let tedgeCollection = dbo.collection(MONGO_COLLECTION) 
                     
    //         let changeStream = null;

    //         // watch measurement collection for changes
    //         localSocket.on('new-measurement', function (message) {
    //             console.log(`New measurement cmd: ${message}`);
    //             if (message == 'start')  {
    //                 changeStream = tedgeCollection.watch()
    //                 changeStream.on("change",function(change){
    //                     // console.log("changed", JSON.stringify(change.fullDocument));
    //                     // let obj = JSON.parse(change.fullDocument.payload)
    //                     // change.fullDocument.payload = obj
    //                     // console.log("changed", JSON.stringify(change.fullDocument));
    //                     localSocket.emit('new-measurement', JSON.stringify(change.fullDocument))
    //                 });
    //             } else if (message == 'stop')  {
    //                 if ( changeStream) {
    //                 changeStream.close()
    //                 }
    //             } 
    //         });
    //       });
    // }

    watchMeasurementColletion() {
        let changeStream = null;
        let localSocket = this.socket;
        // watch measurement collection for changes
        localSocket.on('new-measurement', function (message) {
            console.log(`New measurement cmd: ${message}`);
            if (message == 'start')  {
                changeStream = ThinEdgeBackend.measurementCollection.watch()
                changeStream.on("change",function(change){
                    // console.log("changed", JSON.stringify(change.fullDocument));
                    // let obj = JSON.parse(change.fullDocument.payload)
                    // change.fullDocument.payload = obj
                    // console.log("changed", JSON.stringify(change.fullDocument));
                    localSocket.emit('new-measurement', JSON.stringify(change.fullDocument))
                });
            } else if (message == 'stop')  {
                if ( changeStream) {
                changeStream.close()
                }
            } 
        });
    }

    static connect2Mongo() {
        if (ThinEdgeBackend.measurementCollection == null || ThinEdgeBackend.seriesCollection == null) {
           console.log('Connecting to mongo ...'); 
            MongoClient.connect(MONGO_URL, function(err, client) {
                if (err) throw err;
                let dbo = client.db(MONGO_DB);
                ThinEdgeBackend.measurementCollection = dbo.collection(MONGO_MEASUEMENT_COLLECTION) 
                ThinEdgeBackend.seriesCollection = dbo.collection(MONGO_SERIES_COLLECTION)        
            });
        }
    }

    static getSeries(req, res) {
        ThinEdgeBackend.seriesCollection.find().toArray(function(err, items) {
          let result = []
          for (let index = 0; index < items.length; index++) {
            if (err) throw err;
            const item = items[index];
            let series = []
            for (const property in item) {
                if (property != '_id' && property != 'type' && property != 'time' )
                    series.push(property)
            }
            const measurement = {
                name: item.type,
                series: series
            }
            result.push(measurement)
            //onsole.log('Series from mongo', item, serie); 
          }
          res.status(200).json(result);
        });
    }

    static getEdgeConfiguration(req, res) {
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
            //const child = spawn('top', ['-b', '-n', '1']);
            //const child = spawn('sh', ['-c', 'ps o state=,pid=,command=,time=|sed -E -n "/ sed -E -n/d;/^[^ZT] +[0-9]+ .*$@/p";']);
            const child = spawn('ps')

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
                    stdoutContent = stdoutContent.replace( /.*defunct.*\n/g, '')
                    res.status(200).send({result: stdoutContent});
                }
            });
            console.log('Retrieved job status')
        } catch (err) {
            console.log("Error when executing top: " + err)
            res.status(500).json({ data: err });
        }
    }

    static async getAnalyticsConfiguration(req, res) {
        let configuration 
        try {
            let ex = await ThinEdgeBackend.fileExists(ANALYTICS_CONFIG)
            if ( !ex) {
                await fs.promises.writeFile(ANALYTICS_CONFIG, "{}");
            }
            let rawdata = await fs.promises.readFile(ANALYTICS_CONFIG);
            let str = rawdata.toString()
            configuration = JSON.parse(str);
            res.status(200).json(configuration);
            console.log('Retrieved configuration', configuration)
        } catch (err) {
            console.log("Error when reading configuration: " + err)
            res.status(500).json({ data: err });
        }
    }

    static async setAnalyticsConfiguration(req, res) {
        let configuration = req.body
        try {
            await fs.promises.writeFile(ANALYTICS_CONFIG, JSON.stringify(configuration))
            res.status(200).json(configuration);
            console.log('Saved configuration', configuration)
        } catch (err) {
            console.log("Error when saving configuration: " + err)
            res.status(500).json({ data: err });
        }
    }

    static async fileExists(filename) {
        try {
            await fs.promises.stat(filename);
            return true;
        } catch (err) {
            //console.log("Testing code: " + err.code)
            if (err.code === 'ENOENT') {
                return false;
            } else {
                throw err;
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