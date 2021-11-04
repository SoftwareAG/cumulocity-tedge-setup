// Use Express
var express = require("express");
// Use body-parser
var bodyParser = require("body-parser");
// spawn
const { spawn } = require("child_process");

// Create new instance of the express server
var app = express();

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
var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
});

/*  "/api/status"
 *   GET: Get server status
 */
app.get("/api/status", function (req, res) {
    res.status(200).json({ status: "UP" });
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
 *   GET: Run a command
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
            res.status(500).json( data );
            sent = true;
        });

        child.on('error', function(err) {
            console.log('Error : ' + err);
            res.status(500).json( err );
            sent = true;
        });

        child.stdout.on('end', (data) => {
            //console.log('stdout:', s);
            if (!sent ) {
                var stdoutContent = Buffer.concat(stdoutChunks).toString();
                console.log(`stdout: ${stdoutContent}`);
                res.status(200).json( stdoutContent);
            }
        });

        child.stdout.on('close', () => {
            console.log('calling close!');
        });

/*         child.on('exit', (code) =>
            console.log('Process exited with code', code)
        );

        child.on('error', function(err) {
            console.log('Error : ' + err);
            //res.status(500).json({ data: err });
          });
        child.stdout.on('data', (data) => {
            stdoutChunks = stdoutChunks.concat(data);
        });
        child.stdout.on('end', () => {
            var stdoutContent = Buffer.concat(stdoutChunks).toString();
            console.log('stdout chars:', stdoutContent.length);
            res.status(200).json({ data: stdoutContent });
        });
 */
/*         child.stderr.on('data', (data) => {
            console.log('Collecting stderr chars:', data);
            stderrChunks = stderrChunks.concat(data);
        });
        child.stderr.on('end', () => {
            var stderrContent = Buffer.concat(stderrChunks).toString();
            console.log('stderr chars:', stderrContent.length);
            console.log(stderrContent);
            res.status(500).json({ data: stderrContent });
        }); */

    } catch (err) {
        console.log("exception: " + err)
        res.status(500).json({ data: err });
    }
});