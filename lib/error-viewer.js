var redis = require('redis');

function ErrorViewer(options){

    this._options = options || {};
    this._redisOptions = this._options.redisOptions || {};
    this._client = redis.createClient(this._redisOptions);

    this._erorrTasksQName = this._options.errorQueue || 'error-tasks';
}

ErrorViewer.prototype.run = function (callback) {
    this._client.lrange(this._erorrTasksQName, 0, -1, (err, tasks) => {
        if (err) return callback(err);

        this._client.ltrim(this._erorrTasksQName, tasks.length, -1, function(err){
            if (err) return callback(err);
            callback(null, tasks);
        });
    });
};


module.exports = ErrorViewer;