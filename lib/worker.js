var redis = require('redis');
var Queue = require('redis-simple-queue');
var uuid = require('uuid').v4;

function Worker(options){
    this._uuid = uuid();

    this._options = options || {};
    this._fakeMaxProcessTime = this._options.fakeMaxProcessTime || 0;
    this._redisOptions = this._options.redisOptions || {};
    this._client = redis.createClient(this._redisOptions);

    this._queue = new Queue('tasks', this._redisOptions);
    this._consumer = this._queue.consumer();

    this._erorrTasksQName = this._options.errorQueue || 'error-tasks';

    this._onMessage = this._onMessage.bind(this);
    this._consumer.on('message', this._onMessage);
}

Worker.prototype.start = function (callback) {
    process.nextTick(callback);
};

Worker.prototype.stop = function (callback) {
    process.nextTick(callback);
};

Worker.prototype._onMessage = function (task) {
    var isError = false;
    if (Math.random() < 0.05) {
        isError = true;
    }
    if (isError) {
        return this._processErrorMessage(task);
    } else {
        return this._processMessage(task);
    }
};

Worker.prototype._processMessage = function (task) {
    console.log(Date.now(), `[${this._uuid}]`, "Receive task: ", task);
    setTimeout(() => {
        console.log(Date.now(), `[${this._uuid}]`, "Task processed:", task);
        this._consumer.ack();
    }, Math.random() * this._fakeMaxProcessTime);
};

Worker.prototype._processErrorMessage = function (task) {
    console.log(Date.now(), `[${this._uuid}]`, "Receive Error task: ", task);
    this._client.rpush(this._erorrTasksQName, JSON.stringify(task), (err) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(Date.now(), `[${this._uuid}]`, "Error task moved to error queue", task);
        this._consumer.ack();
    });
};

module.exports = Worker;