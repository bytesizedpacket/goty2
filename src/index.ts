import { Map } from "./Map";
import * as PIXI from "pixi.js";
export let url = window.location.toString().split("//")[1];
export let serverUrl = url.split(":")[0].split("/")[0].split("?")[0] + ":3000";
export let io = require("socket.io-client")(serverUrl);
// make vscode ignore these since they don't have typings
// @ts-ignore
import * as Keyboard from "pixi.js-keyboard";
// @ts-ignore
import * as Mouse from "pixi.js-mouse";
import { Entity } from "./Entity";
import { STATE, MOVEMENT_TYPE, DIRECTION } from "./Entity";
import { Player } from "./Player";
import { RemotePlayer } from "./RemotePlayer";
import { Enemy } from "./Enemy";
import { Item } from "./Item";
import { HealthPack } from "./HealthPack";
import { DamageNumber } from "./DamageNumber";
// TODO: reduce size of bundle.js by following this guide https://medium.com/anvoevodin/how-to-set-up-pixijs-v5-project-with-npm-and-webpack-41c18942c88d

// aliases and helpful variables
const urlParams = new URLSearchParams(window.location.search);
export let playerName: string = urlParams.get("name"); // use ?name= to name the player
console.log("Player name: " + playerName);
export let statusText: PIXI.Text;
export let levelDiv = document.getElementById("level");
export let ghettoConsole = document.getElementById("ghettoconsole"); // for coding on my ipad where i don't get the regular console (thanks apple)

export let debugLog = function (text: string) {
  console.log(text);
  //ghettoConsole.innerHTML += "<br/>" + text;
};

// game properties
export let viewWidth: number = 256;
export let viewHeight: number = 256;
let zoomScale: number = parseInt(urlParams.get("zoom")); // URL query parameter ?zoom=_
export let enableUnfocusAfk: boolean = JSON.parse(urlParams.get("unfocusAFK"));
export let currentLevel: number;
if (isNaN(zoomScale)) zoomScale = 2; // default to 2 if not specified
// TODO: if zoom level isn't specified, automatically determine largest possible zoom level (also put this in window.onresize)
let gameState: Function;
export let player: Player;
export let currentDelta = 0;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
export let currentMap: Map;
export let connected: boolean = false;
export let updateTimer: number = 0;
let updateInterval = 1; // amount of frames to hold data for

// this is what we communicate with the server to update players
export interface PlayerData {
  position: { x: number; y: number };
  health: number;
  state: STATE;
  name: string;
  inventory: any;
  equippedItem: any;
  faceDirection: DIRECTION;
}

// these are our assets
let assets = [
  { name: "player", url: "assets/sprites/Player.png" },
  { name: "enemy-default", url: "assets/sprites/Enemy-default.png" },
  { name: "enemy-fly", url: "assets/sprites/Enemy-fly.png" },
  { name: "tile-floor", url: "assets/sprites/Tile-floor.png" },
  { name: "tile-wall", url: "assets/sprites/Tile-wall.png" },
  { name: "healthpack", url: "assets/sprites/HealthPack.png" },
  { name: "sword", url: "assets/sprites/Sword.png" },
  { name: "gun", url: "assets/sprites/Gun.png" },
];
// these will be populated later
export let entities: Entity[] = [];
export let damageNumbers: DamageNumber[] = [];

// setup pixi
export let app = new PIXI.Application({ width: viewWidth, height: viewHeight });
document.body.appendChild(app.view);

// connect socketio
io.on("connect", function (socket: any) {
  connected = true;
  debugLog("Connected to server!");
});

io.on("disconnect", () => {
  connected = false;
  debugLog("Disconnected");
});

// disable rightclicking
app.view.addEventListener("contextmenu", (e) => {
  if (e.type == "contextmenu") e.preventDefault();
});

// initialize a new level
let initLevel = function (delta?: any) {
  if (!currentLevel) {
    // level hasn't been set - let's check the url variable
    let levelSelect: number = parseInt(urlParams.get("level"));
    if (!isNaN(levelSelect)) {
      currentLevel = levelSelect;
    } else {
      currentLevel = 1; // default to 1 if not set
    }
  } else {
    // we are loading a new level in an existing game

    // prevent any items/enemies/etc from holding over from the last stage
    currentMap.destroy();
    entities.forEach(function (entity: Entity) {
      if (!(entity instanceof Player)) entity.destroy();
    });
  }
  levelDiv.innerHTML = "<b>GOTY2</b>";

  // we add this back later so the map renders under us
  app.stage.removeChild(player.spriteObject);
  app.stage.removeChild(player.healthBar);

  // construct our map object
  currentMap = new Map(currentLevel);

  // set player's start position
  player.position = {
    x: currentMap.startPosition.x * 16,
    y: currentMap.startPosition.y * 16,
  };

  app.stage.addChild(player.spriteObject);
  app.stage.addChild(player.healthBar);

  // are we on a prime numbered level?
  if (isPrime(currentLevel)) {
    // yes - generate a health pack somewhere
    let healthPack = new HealthPack("healthpack", app);
    let pos = {
      x: getRandomInt(
        0,
        currentMap.sizeX * 16 - healthPack.spriteObject.width - 1
      ),
      y: getRandomInt(
        0,
        currentMap.sizeY * 16 - healthPack.spriteObject.height - 1
      ),
    };
    healthPack.position = pos;
  }

  // the server has sent us new info about a player
  // shit contains 'id' and 'remotePlayer' object
  io.on("playerUpdate", function (shit: any) {
    let id = shit.id;
    let data = shit.data;
    let playerExists = false;
    entities.forEach(function (entity: Entity) {
      // is this a player?
      if (entity instanceof RemotePlayer) {
        // does its id match?
        if (entity.playerId == id) {
          playerExists = true;
          entity.playerData = data;
        }
      }
    });

    if (!playerExists) {
      // create new RemotePlayer
      let newPlayer = new RemotePlayer("enemy-default", app, id, data);

      statusText.text = newPlayer.label.text + " connected";
    }
  });

  // receive status message!
  io.on("statusMessage", (message: string) => {
    statusText.text = message;
  });

  // we have been damaged!
  io.on("playerDamage", (amount: number) => {
    player.damage(amount);
  });

  // the server told us a player disconnected
  io.on("playerDisconnect", (id: string) => {
    entities.forEach(function (entity: Entity) {
      // is this a player?
      if (entity instanceof RemotePlayer) {
        // does its id match?
        if (entity.playerId == id) {
          statusText.text = entity.label.text + " disconnected";
          entity.destroy(); // remove the player from the gamea
        }
      }
    });
  });

  // make player inactive when tab unfocuses
  window.addEventListener("blur", function () {
    if (player.state == STATE.ACTIVE && enableUnfocusAfk) {
      player.state = STATE.AFK;
      player.serverSync();
      io.emit("statusMessage", " went AFK");
    }
  });

  // reactivate player when they come back
  window.addEventListener("focus", function () {
    if (player.state == STATE.AFK) {
      player.state = STATE.ACTIVE;
      player.serverSync();
      io.emit("statusMessage", " is no longer AFK");
    }
  });

  // status text (starts blank)
  statusText = new PIXI.Text("", {
    font: "8px Roboto",
    fill: "white",
    dropShadow: true,
  });
  statusText.scale.set(0.3, 0.3);
  statusText.x += 5;
  statusText.y += 5;
  app.stage.addChild(statusText);

  // set the gameState to gameLoop;
  gameState = gameLoop;
};

// main gameplay loop
let gameLoop = function (delta: any) {
  let enemyCheck = false; // do we have any enemies?

  // make sure our damage numbers animate correctly
  damageNumbers.forEach(function (damageNumber: DamageNumber) {
    damageNumber.tick();
  });

  // update player position
  //if(connected){
  if (updateTimer <= 0) {
    // TODO: move all of this to PlayerData interface and emit to server using player.serverSync()
    player.serverSync();
    updateTimer = updateInterval;
  } else {
    updateTimer--;
  }
  //}

  // make sure every entity handles their ticks and stays inside the map
  entities.forEach(function (entity: Entity) {
    // don't tick it if it's inactive
    if (entity.state != STATE.INACTIVE) {
      // all movement and behavior is handled in the entities' respective classes
      entity.tick(); // tock

      // is this an enemy?
      if (entity instanceof Enemy) enemyCheck = true;
    }
  });

  currentMap.updateSprites();

  // if there are no enemies left, set up a new level
  // disabled for GOTY2
  if (!enemyCheck) {
    //currentLevel = currentLevel + 1;
    //gameState = initLevel;
  }
};

// begin loading assets
app.loader.add(assets).load(function () {
  // Set up a new game

  // make stage interactable
  app.stage.interactive = true;

  // set up player object
  player = new Player("player", app);

  // scale view
  app.renderer.resize(viewWidth * zoomScale, viewHeight * zoomScale);
  app.stage.scale.set(zoomScale, zoomScale);

  // center
  app.view.style.position = "absolute";
  app.view.style.left = ((window.innerWidth - app.renderer.width) >> 1) + "px";

  // keep centered on resize
  window.onresize = function (event: Event) {
    app.view.style.position = "absolute";
    app.view.style.left =
      ((window.innerWidth - app.renderer.width) >> 1) + "px";
  };

  // begin game loop
  gameState = initLevel;
  app.ticker.add((delta) => tick(delta));
});

// keeps all of our shit running
let tick = function (delta: any) {
  currentDelta = delta;
  gameState(delta);
  Keyboard.update();
  Mouse.update();
};

// check for collision between two sprites
export let checkSpriteCollision = function (entity1: Entity, entity2: Entity) {
  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
  let sprite1 = entity1.spriteObject;
  let sprite2 = entity2.spriteObject;

  // alsdjfkafds
  let r1 = {
    //Find the center points of each sprite
    centerX: entity1.position.x + sprite1.width / 2,
    centerY: entity1.position.y + sprite1.height / 2,
    //Find the half-widths and half-heights of each sprite
    halfWidth: sprite1.width / 2,
    halfHeight: sprite1.height / 2,
  };

  let r2 = {
    //Find the center points of each sprite
    centerX: entity2.position.x + sprite2.width / 2,
    centerY: entity2.position.y + sprite2.height / 2,
    //Find the half-widths and half-heights of each sprite
    halfWidth: sprite2.width / 2,
    halfHeight: sprite2.height / 2,
  };

  //hit will determine whether there's a collision
  hit = false;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {
    //A collision might be occurring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {
      //There's definitely a collision happening
      hit = true;
    } else {
      //There's no collision on the y axis
      hit = false;
    }
  } else {
    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};

let createEnemy = function (
  spriteName: string,
  speed?: number,
  displayHealthBar?: boolean,
  movementType?: MOVEMENT_TYPE
): Enemy {
  let enemy = new Enemy(spriteName, app, speed, displayHealthBar, movementType);

  return enemy;
};

// check if a number is prime
function isPrime(num: number): boolean {
  for (var i = 2; i < num; i++) if (num % i === 0) return false;
  return num > 1;
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 */
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
