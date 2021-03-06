import { Sprite } from "pixi.js";
import { Graphics } from "pixi.js";
import { Container } from "pixi.js";
import { Text } from "pixi.js";
import { Application } from "pixi.js";
import { entities, currentMap } from "./index";
import { app, player, viewWidth, viewHeight, statusText } from "./index";
import { DamageNumber } from "./DamageNumber";
import { TILE_TYPE } from "./Tile";
import { Item } from "./Item";

export enum STATE {
  ACTIVE,
  INACTIVE, // won't move or do anything
  DEAD, // will remove itself from the game/memory
  AFK, // other player is afk!
}

export enum MOVEMENT_TYPE {
  // we map these to the enemy sprite names so the levels.json is easier to use
  DEFAULT = "enemy-default", // regular movement
  FLY = "enemy-fly", // "orbit" movement
  PLAYER = "player",
}

export enum DIRECTION {
  WEST = "west",
  EAST = "east",
}

// we use this independently from the screen/sprite coordingates
export interface Position {
  x: number;
  y: number;
}

// generic entity class
export class Entity {
  public spriteObject: Sprite;
  public label: Text;
  public labelText: string;
  public healthBar: Container;
  public movementType: MOVEMENT_TYPE;
  public outlineHealthBar: Graphics;
  public rearHealthBar: Graphics;
  public frontHealthBar: Graphics;
  public equippedItem: number = 0; // index of inventory
  public inventory: Item[] = [];
  public state: STATE;
  public health: number = 100;
  public speed: number;
  public velX: number = 0; // velocity X
  public velY: number = 0; // velocity Y
  public position: Position;
  public tilePosition: Position; // this represents our tile location on the map (regular position is exact pixels)
  public faceDirection: DIRECTION;
  private currentItemSprite: Sprite;

  constructor(
    spriteName: string,
    app: Application,
    speed?: number,
    displayHealthBar?: boolean,
    movementType?: MOVEMENT_TYPE,
    position?: Position,
    labelText?: string
  ) {
    // create our sprite with the given name
    let currentSprite = new Sprite(app.loader.resources[spriteName].texture);

    // keep this consistent
    currentSprite.name = spriteName;

    // make sure we can click it
    currentSprite.interactive = true;

    this.spriteObject = currentSprite;

    // default to 2 speed if not specified
    if (speed) {
      this.speed = speed;
    } else {
      this.speed = 1;
    }

    this.speed = this.speed * 2; // since 1 is too slow, but I like 1 being the player speed

    this.velX = 0;
    this.velY = 0;

    // set up our health bar (enabled by default)
    if (displayHealthBar == undefined || displayHealthBar) {
      this.healthBar = new Container();

      // create the outline rectangle
      this.outlineHealthBar = new Graphics();
      this.outlineHealthBar.beginFill(0x000000);
      this.outlineHealthBar.drawRect(0, 0, this.spriteObject.width + 2, 4);
      this.outlineHealthBar.endFill();
      this.healthBar.addChild(this.outlineHealthBar);

      // create the back red rectangle
      this.rearHealthBar = new Graphics();
      this.rearHealthBar.beginFill(0xff3300);
      this.rearHealthBar.drawRect(1, 1, this.spriteObject.width, 2); // same width as the sprite
      this.rearHealthBar.endFill();
      this.healthBar.addChild(this.rearHealthBar);

      //Create the front green rectangle
      this.frontHealthBar = new Graphics();
      this.frontHealthBar.beginFill(0x00ff00);
      this.frontHealthBar.drawRect(1, 1, this.spriteObject.width, 2);
      this.frontHealthBar.endFill();
      this.healthBar.addChild(this.frontHealthBar);

      app.stage.addChild(this.healthBar);
    }

    if (labelText) {
      this.labelText = labelText;
      this.label = new Text(labelText, { font: "30px Roboto Condensed", fill: "white", dropShadow: true, dropShadowBlur: 2 });
      this.label.scale.set(0.3, 0.3);
      this.label.x -= (this.label.width / 2) - 10;
      this.label.y -= this.spriteObject.height * 2 - 5;
      this.label.interactive = false; // otherwise players can attack the nametags
      this.healthBar.addChild(this.label);
    }

    if (movementType) {
      this.movementType = movementType;
    } else {
      this.movementType = MOVEMENT_TYPE.DEFAULT;
    }

    // give us our position
    if (position) {
      this.position = position;
    } else {
      this.position = { x: 0, y: 0 };
    }

    // initiate as alive
    this.state = STATE.ACTIVE;

    // make it clickable (calls this.onClick)
    // this is jank
    // also, this is jank
    let tthis = this;
    this.spriteObject.on("mousedown", function (e: any) {
      tthis.onClick(e);
    });

    this.faceDirection = DIRECTION.WEST;

    // add it to the game
    app.stage.addChild(this.spriteObject);
    entities.push(this);
  }

  // keep healthbar under entity and displaying correct amount of health
  public updateHealthBar() {
    // make sure we actually have a health bar
    if (this.healthBar != undefined) {
      // put 2px it under the entity
      if (this.faceDirection == DIRECTION.EAST) {
        this.healthBar.position.set(
          this.spriteObject.x - this.outlineHealthBar.width + 1,
          this.spriteObject.y + this.spriteObject.height + 2
        );
      } else {
        this.healthBar.position.set(
          this.spriteObject.x - 1,
          this.spriteObject.y + this.spriteObject.height + 2
        );
      }

      // change size of green to represent current health
      this.frontHealthBar.width =
        (this.health * this.rearHealthBar.width) / 100;
    }
  }

  // update the sprite with our current position
  public updateSprite() {
    // set the sprite to our position relative to the player
    let offsetX = viewWidth / 2 - player.spriteObject.width / 2;
    let offsetY = viewHeight / 2 - player.spriteObject.height / 2;

    // direction towards player
    let toPlayerX = player.position.x - this.position.x;
    let toPlayerY = player.position.y - this.position.y;

    this.spriteObject.position.set(offsetX - toPlayerX, offsetY - toPlayerY);

    if (this.faceDirection == DIRECTION.EAST) {
      this.spriteObject.scale.set(-1, 1);
      this.spriteObject.position.x += this.spriteObject.width;
    } else {
      this.spriteObject.scale.set(1, 1);
    }

    this.updateHealthBar();
  }

  // runs every frame
  // this DOES NOT GET CALLED if the state is INACTIVE
  public tick() {

    // update our tile position
    this.tilePosition = {
      x: Math.round(this.position.x / 16),
      y: Math.round(this.position.y / 16),
    };

    // uh oh spaghettios it's dead
    if (this.health <= 0) {
      this.health = 0; // prevents the healthbar from descending into deader-than-dead
      this.state = STATE.DEAD;
      if (this.label) {
        statusText.text = this.label.text + " died";
      }
    }

    if (this.labelText) {
      // display AFK indicator and hide health bar
      if (this.state == STATE.AFK) {
        this.label.text = this.labelText + " (AFK)";
        this.outlineHealthBar.visible = false;
        this.frontHealthBar.visible = false;
        this.rearHealthBar.visible = false;
      } else if (this.state == STATE.DEAD) {
        this.label.text = this.labelText + " (DEAD)";
        this.outlineHealthBar.visible = true;
        this.frontHealthBar.visible = true;
        this.rearHealthBar.visible = true;
      } else {
        this.label.text = this.labelText;
        this.outlineHealthBar.visible = true;
        this.frontHealthBar.visible = true;
        this.rearHealthBar.visible = true;
      }
    }

    this.updateSprite();
  }

  // oof ow ouch that hurt
  // this ignores the current state of the entity
  public damage(amount: number) {
    // TODO: implement defense stat that affects actual damage output

    // we don't actually reduce health since the server should handle this, this effectively just shows the damagenumber

    new DamageNumber(amount.toString(), this, "red");
  }

  // give us some health back
  public heal(amount: number) {
    this.health += amount;
    if (this.health > 100) this.health = 100; // don't overheal

    new DamageNumber(amount.toString(), this, "green");
  }

  // it has been clicked!
  public onClick(e: any) {
    // call the player's interact() on this
    player.interact(this, e);
  }

  // add an item to this entity's inventory
  public addItemToInventory(item: Item) {
    this.inventory.push(item);

    this.updateEquippedSprite();
  }

  // set the equipped item
  public setEquippedItem(index: number) {
    this.equippedItem = index;
    this.updateEquippedSprite();
  }

  // update equipped sprite
  public updateEquippedSprite() {
    if (this.inventory[this.equippedItem]) {
      this.spriteObject.removeChild(this.currentItemSprite);
      this.currentItemSprite = this.inventory[this.equippedItem].spriteObject;
      this.spriteObject.addChild(this.currentItemSprite);
      this.currentItemSprite.y = this.spriteObject.height / 2 - 8;
      this.currentItemSprite.x = -9;
    }
  }

  // what is the distance to the specified entity?
  public distanceTo(target: Entity): number {
    let toEntityX = target.position.x - this.position.x;
    let toEntityY = target.position.y - this.position.y;
    let toEnemyLength = Math.sqrt(
      toEntityX * toEntityX + toEntityY * toEntityY
    );

    return toEnemyLength;
  }

  // destroy this entity from the game :c
  public destroy() {
    app.stage.removeChild(this.spriteObject);
    if (this.healthBar) {
      app.stage.removeChild(this.healthBar);
      this.healthBar.destroy();
    }
    entities.splice(entities.indexOf(this), 1);
    this.spriteObject.destroy();
  }

  protected checkMapCollision() {
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
                halfWidth: sprite1.width / 2,
                halfHeight: sprite1.height / 2,
              };

              let r2 = {
                //Find the center points of each sprite
                centerX: currentTile.position.x + sprite2.width / 2,
                centerY: currentTile.position.y + sprite2.height / 2,
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

              if (hit) {
                let toTileX = currentTile.position.x - this.position.x;
                let toTileY = currentTile.position.y - this.position.y;
                let toTileLength = Math.sqrt(
                  toTileX * toTileX + toTileY * toTileY
                );
                toTileX = toTileX / toTileLength;
                toTileY = toTileY / toTileLength;

                // bump the entity away from what it just collided with
                this.velX = toTileX * -0.5 * this.speed;
                this.velY = toTileY * -0.5 * this.speed;
              }
            }
          }
        }
      }
    }
  }
}
