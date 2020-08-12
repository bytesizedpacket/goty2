import { Sprite } from "pixi.js";
import { Application } from "pixi.js";
import { Entity, STATE, MOVEMENT_TYPE, Position } from "./Entity";
import { player, debugLog } from "./index";
import {
  entities,
  checkSpriteCollision,
  currentDelta,
  viewHeight,
  viewWidth
} from "./index";

// main remote player object
export class RemotePlayer extends Entity {
  public playerId: string;
  public playerData: { position: { x: number, y: number }, health: number, state: STATE, name: string };
  constructor(
    spriteName: string,
    app: Application,
    playerId: string,
    playerData: { position: { x: number, y: number }, health: number, state: STATE, name: string },
    speed?: number,
    displayHealthBar?: boolean,
    movementType?: MOVEMENT_TYPE,
    position?: Position,
    labelText?: string
  ) {
    if (playerData.name) {
      super(spriteName, app, speed, displayHealthBar, movementType, position, playerData.name);
    } else {
      super(spriteName, app, speed, displayHealthBar, movementType, position, playerId);
    }
    this.playerId = playerId;
    this.playerData = playerData;
    debugLog("Player " + playerId + " / " + playerData.name + " created!");
  }

  // run every frame
  public tick() {
    super.tick();

    this.position = this.playerData.position;
    this.health = this.playerData.health;
    this.state = this.playerData.state;

    // kill if we're dead
    //if (this.state == STATE.DEAD) this.destroy();
  }

  // attack player!
  public damage(amount: number) {
    if (this.state == STATE.ACTIVE) super.damage(amount);
  }

}