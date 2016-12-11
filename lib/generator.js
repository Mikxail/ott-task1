var redis = require('redis');
var uuid = require('uuid').v4;
var Singleton = require('redis-singleton');
var Queue = require('redis-simple-queue');

function Generator(options){
    this._uuid = uuid();

    this._options = options || {};
    this._generateInterval = this._options.generateInterval || 500;
    this._redisOptions = this._options.redisOptions || {};
    this._client = redis.createClient(this._redisOptions);
    this._name = this._options.name || 'generator';
    this._singleton = new Singleton(this._client, {
        name: this._name
    });
    this._pause = this._pause.bind(this);
    this._resume = this._resume.bind(this);

    this._queue = new Queue('tasks', this._redisOptions);
    this._producer = this._queue.producer();

    this._singleton.on('master', this._resume);
    this._singleton.on('slave', this._pause);

    this._timer = null;
}

Generator.prototype.getUUID = function () {
    return this._uuid;
};

Generator.prototype.start = function (callback) {
    // do something
    this._singleton.start(callback)
};

Generator.prototype.stop = function (callback) {
    // do something
    this._pause();
    process.nextTick(callback);
};

Generator.prototype._pause = function () {
    console.log('Node is slave', this._uuid);
    this._clearTimer();
};

Generator.prototype._resume = function () {
    console.log('Node is master', this._uuid);
    this._startTimer();
};

Generator.prototype.addTask = function (callback) {
    callback = callback || function(){};
    if (!this._singleton.isMaster()) return callback(new Error("isn't generator master"));
    this._producer.add({a: Math.random(), p: this._uuid}, callback);
};

Generator.prototype._startTimer = function () {
    this._clearTimer();
    var self = this;
    this._timer = setInterval(() => {
        self.addTask();
    }, this._generateInterval);
};

Generator.prototype._clearTimer = function () {
    if (this._timer) {
        clearInterval(this._timer);
        this._timer = null;
    }
};

module.exports = Generator;