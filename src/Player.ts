import { TILE_TYPE } from "./Tile";
import { MOVEMENT_TYPE, DIRECTION } from "./Entity";
import { HealthPack } from "./HealthPack";
import { Application } from "pixi.js";
import {
  entities,
  currentDelta,
  viewHeight,
  viewWidth,
  currentMap,
} from "./index";
import { checkSpriteCollision, io, playerName } from "./index";
import { Entity, STATE } from "./Entity";
import { Enemy } from "./Enemy";
import { Item } from "./Item"
import { RemotePlayer } from "./RemotePlayer";
// @ts-ignore
import * as Keyboard from "pixi.js-keyboard";
// @ts-ignore
import * as Mouse from "pixi.js-mouse";
import { Weapon, WEAPON_TYPE } from "./Weapon";

// useful variables
let statusDiv = document.getElementById("level");

// main player object
export class Player extends Entity {
  public score: number = 0;
  constructor(
    spriteName: string,
    app: Application,
    speed?: number,
    displayHealthBar?: boolean
  ) {
    super(spriteName, app, speed, displayHealthBar);
    this.movementType = MOVEMENT_TYPE.PLAYER;
    console.log("Player has been initialized", this);

    this.addItemToInventory(new Weapon("sword", app, "Sword", 25, WEAPON_TYPE.MELEE));
    this.addItemToInventory(new Weapon("gun", app, "Gun", 10, WEAPON_TYPE.PROJECTILE));
  }

  // this will run every frame
  public tick() {
    super.tick();
    let tthis = this; // we do this because the forEach fucks with the `this` keyword

    if (this.health <= 0) {
      statusDiv.innerHTML = "Uh-oh spaghetti-o's! You're <b>dead.</b>";
    } else {
      // we're still alive!

      // only if the player is alive...
      if (this.state == STATE.ACTIVE) {
        // handle input!
        if (Keyboard.isKeyDown("KeyS", "ArrowDown")) {
          this.velY = this.speed;
        } else {
          if (!Keyboard.isKeyDown("KeyW", "ArrowUp")) this.velY = 0;
        }

        if (Keyboard.isKeyDown("KeyD", "ArrowRight")) {
          this.velX = this.speed;
          this.faceDirection = DIRECTION.EAST;
        } else {
          if (!Keyboard.isKeyDown("KeyA", "ArrowLeft")) this.velX = 0;
        }

        if (Keyboard.isKeyDown("KeyW", "ArrowUp")) {
          this.velY = this.speed * -1;
        } else {
          if (!Keyboard.isKeyDown("KeyS", "ArrowDown")) this.velY = 0;
        }

        if (Keyboard.isKeyDown("KeyA", "ArrowLeft")) {
          this.velX = this.speed * -1;
          this.faceDirection = DIRECTION.WEST;
        } else {
          if (!Keyboard.isKeyDown("KeyD", "ArrowRight")) this.velX = 0;
        }

        // change weapon!
        // TODO: more robust inventory management
        if (Keyboard.isKeyDown("KeyE")) {
          this.setEquippedItem(1);
        }
        if (Keyboard.isKeyDown("KeyQ")) {
          this.setEquippedItem(0);
        }
      }

      const prevPos = { x: this.position.x, y: this.position.y };

      // try our movement on x axis
      this.position.x += this.velX * currentDelta;
      if (this.checkMapCollision()) this.position.x = prevPos.x;

      // try our movement on y axis
      this.position.y += this.velY * currentDelta;
      if (this.checkMapCollision()) this.position.y = prevPos.y;

      // check for collision
      entities.forEach(function (entity: Entity) {
        // also are we colliding with it?
        if (checkSpriteCollision(tthis, entity)) {
          switch (entity.constructor) {
            case Enemy:
              tthis.damage(1);
              break;
            case HealthPack:
              // TODO: move this to item.pickUp() so we don't have to do this with a switch/individual item classes
              tthis.heal(100);
              entity.destroy();
              break;
          }
        }
      });
    }

    // since we handle movement here
    this.updateSprite();

    // TODO: make this a UI somehow
    /*
    this.inventoryDisplay.innerHTML = "";
    this.inventory.forEach(item => {
      this.inventoryDisplay.appendChild(item.htmlDiv);
    });
    */
  }

  // tell the server we died
  public damage(amount: number) {
    super.damage(amount);

    this.health -= amount;

    if (this.health <= 0) {
      io.emit('playerDeath', true); // tell the server we died
      this.position.x = 999999999; // we're dead so bye
    }
  }

  // sets the player's current score
  public setScore(score: number) {
    this.score = score;
    // TODO: render this within the game window
    statusDiv.innerHTML = "Current Score: " + this.score;
  }

  // when entities are clicked, they trigger this function on the player
  public interact(target: any, e: any) {
    // TODO: different weapons
    if (this.state == STATE.ACTIVE) {
      // make sure we aren't clicking ourselves
      if (!(target instanceof Player)) {
        this.inventory[this.equippedItem].use(this, target, e);
      }
    }
  }

  // send player's info to the server
  public serverSync() {

    // we can't send the inventory directly since that would try to upload the sprite/graphics
    // so we need to reconstruct a new array with only the info we need
    let inventory: any = [];
    this.inventory.forEach(item => {
      inventory.push({
        name: item.labelText,
        amount: item.amount,
        spriteName: item.spriteObject.name,
      });
    });

    io.emit('playerUpdate', {
      position: this.position,
      health: this.health,
      state: this.state,
      name: playerName,
      inventory: inventory,
      equippedItem: this.equippedItem,
      faceDirection: this.faceDirection,
    });
  }

  protected checkMapCollision(): boolean {
    // check in a 3x3 radius around this entity
    for (let stepX = 0; stepX < 3; stepX++) {
      for (let stepY = 0; stepY < 3; stepY++) {
        // if we're checking something outside the map, this won't exist
        if (currentMap.tiles[this.tilePosition.x - (stepX - 1)] != undefined) {
          let currentTile =
            currentMap.tiles[this.tilePosition.x - (stepX - 1)][
            this.tilePosition.y - (stepY - 1)
            ];
          if (currentTile != undefined) {
            if (currentTile.tileType == TILE_TYPE.WALL) {
              //Define the variables we'll need to calculate
              let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;
              let sprite1 = this.spriteObject;
              let sprite2 = currentTile.spriteObject;

              // alsdjfkafds
              let r1 = {
                //Find the center points of each sprite
                centerX: this.position.x + sprite1.width / 2,
                centerY: this.position.y + sprite1.height / 2,
                //Find the half-widths and half-heights of each sprite
                halfWidth: sprite1.width / 2 - 1, // subtract 1 so we can squeeze through 1 tile gaps
                halfHeight: sprite1.height / 2 - 1,
              };

              let r2 = {
                //Find the center points of each sprite
                centerX: currentTile.position.x + sprite2.width / 2,
                centerY: currentTile.position.y + sprite2.height / 2,
                //Find the half-widths and half-heights of each sprite
                halfWidth: sprite2.width / 2 - 1, // subtract 1 so we can squeeze through 1 tile gaps
                halfHeight: sprite2.height / 2 - 1,
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

              if (hit == true) return true;
            }
          }
        }
      }
    }
    return false;
  }
}
