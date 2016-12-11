var ErrorViewer = require('./lib/error-viewer');
var Worker = require('./lib/worker');
var Generator = require('./lib/generator');

const redisOptions = {
    host: 'localhost',
    port: 6379
};

const generateInterval = 500;
const fakeMaxProcessTime = 1000;

function start(){
    var isGetErrors = process.argv[2] == 'getErrors';
    if (isGetErrors) {
        startGetErrors();
    } else {
        startNormal();
    }
}

function startGetErrors(){
    var errorViewer = new ErrorViewer({redisOptions});
    errorViewer.run(function(err, tasks){
        if (err) {
            return console.error(err);
        }
        console.log(`Error tasks(count=${tasks.length}): \n`, tasks);
        process.exit(0);
    });
}

function startNormal() {
    var generator = new Generator({redisOptions, generateInterval});
    var worker = new Worker({redisOptions});

    generator.start(function(err, isMaster){
        console.log('Generator started', 'err: ', err, '; isMaster', isMaster);

        worker.start(function(err){
            console.log('Worker started', 'err:', err);
        });
    });
}

start();