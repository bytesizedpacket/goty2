let app = require('express')();
let http = require('http').createServer(app);
let io = require("socket.io")(http);

io.on('connection', (socket) => {
    console.log("got connection");
    
    socket.on('disconnect', () => {
        console.log("disconnected");
    });
})

http.listen(3000, () => {
    console.log('listening on *:3000');
});

console.log("Hello world!");
