// spawn
const { spawn } = require("child_process");
const events = require('events');

class TaskQueue {
    // emmitter to signal completion of current task
    taskReady;
    tasks = [];
    notifier;
    taskRunning = false;
    jobNumber = 0;

    constructor () {
        this.taskReady = new events.EventEmitter();
        this.runNextTask = this.runNextTask.bind(this);
        this.finishedTask = this.finishedTask.bind(this);
        this.taskReady.on ('next-task',  this.runNextTask )
        this.taskReady.on ('finished-task', (task, exitCode) => {
            this.finishedTask(task, exitCode)          
        })
    }

    finishedTask( task, exitCode) {

        this.taskRunning = false;
        // check error
        if (parseInt(exitCode) !== 0) {
            console.error(`Error (event exit): ${exitCode} on task ${task.id}`)
            this.notifier.sendError(task, exitCode)

            // delete all tasks from queue
            this.tasks = [];
        } else  {
            console.log(`Before processing task: ${JSON.stringify(task)}, ${task.id}`);
            // prepare next task
           this.taskReady.emit('next-task')
           // send job end when last task in job
           if (task.id == task.total) {
               this.notifier.sendJobEnd(task)
            }
        }
    }

    runNextTask() {
        if (!this.taskRunning) {
            // console.log ("Currently queued tasks", this.tasks)
            this.taskRunning = true;
            let nextTask = this.tasks.shift();
            console.log(`Start processing task: ${JSON.stringify(nextTask)}, ${nextTask.job}:${nextTask.id}`);
            this.notifier.sendProgress(nextTask)
            var taskSpawn = spawn(nextTask.cmd, nextTask.args);
            taskSpawn.stdout.on('data', (data) => {
                var buffer = new Buffer.from(data).toString();
                this.notifier.sendResult(buffer)
                //socket.emit('cmd-result', buffer);
            });
        
            taskSpawn.on('exit', (exitCode) => {
                this.taskReady.emit(`finished-task`, nextTask, exitCode);
            });
        
            taskSpawn.on('error', (exitCode) => {
                this.taskReady.emit(`finished-task`, nextTask, exitCode);
            }); 
        }
    }

    queueTasks (newTasks){
        console.log ("Queued tasks", this.tasks)
        let l = newTasks.length
        this.jobNumber++
        newTasks.forEach((element, i) => {
            this.tasks.push({
                ...element,
                id : i,
                total : l ,
                job : this.jobNumber            
            })
        });
        console.log ("Queued tasks", this.tasks)
    }

    start () {
        this.notifier.sendJobStart(this.tasks[0].total)
        this.taskReady.emit('next-task')
    }

    registerNotifier(no) {
        this.notifier = no;
    }



}

module.exports = { TaskQueue }