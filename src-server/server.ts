let app = require('express')();
let http = require('http').createServer(app);
let io = require("socket.io")(http);

// currently connected players
// map of ID -> Player object
let players = new Map();

// TODO: create player object

io.on('connection', (socket) => {
  console.log(socket.id + " connected");
  
  socket.on('playerUpdate', (player) => {
    // add to players variable
    players.set(socket.id, player);
    
    // send update to other clients
    //console.log(player);
    socket.broadcast.emit('playerUpdate', {id: socket.id, data: player});
  });
    
  socket.on('disconnect', (player) => {
    players.delete(socket.id); // remove from players
    socket.broadcast.emit('playerDisconnect', socket.id); // tell other players they left
    console.log(socket.id + " disconnected");
  });
})

http.listen(3000, () => {
  console.log('listening on *:3000');
});

console.log("Hello world!");
