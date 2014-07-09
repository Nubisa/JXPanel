var Stream = require('stream').Stream;

module.exports = function() {
    var stream = new Stream();

    stream.writable = true;
    stream.readable = true;

    stream.cache = [];
    stream.write = function(data) {
        stream.cache.push(data);
        stream.emit("data", data)
    };

    stream.end = function() {
        stream.emit("end");
        stream.render(stream.response, stream.cache.join(""));
        stream.callback();
    };

    stream.destroy = function() {
        stream.emit("close");
    };

    return stream;
};