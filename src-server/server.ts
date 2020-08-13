let app = require('express')();
let http = require('http').createServer(app);
// @ts-ignore
let io = require("socket.io")(http);

interface PlayerData {
  position: { x: number, y: number },
  health: number,
  state: STATE,
  name: string,
  inventory: any,
  equippedItem: any,
  faceDirection: DIRECTION,
}

enum DIRECTION {
  WEST = "west",
  EAST = "east",
}

enum STATE {
  ACTIVE,
  INACTIVE, // won't move or do anything
  DEAD, // will remove itself from the game/memory
  AFK, // other player is afk!
}

// currently connected players
// map of ID -> Player object
let players = new Map();

// TODO: create player object

io.on('connection', (socket) => {
  console.log(socket.id + " connected");

  socket.on('playerUpdate', (player: PlayerData) => {
    // add to players variable
    players.set(socket.id, player);

    // send update to other clients
    //console.log(player);
    socket.broadcast.emit('playerUpdate', { id: socket.id, data: player });
  });

  // send status message to other players
  socket.on('statusMessage', (message: string) => {
    let player = players.get(socket.id);
    if (player && player.name) {
      socket.broadcast.emit('statusMessage', player.name + message);
    } else {
      socket.broadcast.emit('statusMessage', socket.id + message);
    }
  });

  socket.on('playerDamage', (id: string, amount: number) => {
    console.log("Player " + id + " damaged for " + amount);

    // tell the client they were damaged
    io.to(id).emit('playerDamage', amount);
  });

  socket.on('playerDeath', () => {
    console.log("Player " + socket.id + " has died.");
    socket.broadcast.emit('playerDeath', socket.id);
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
