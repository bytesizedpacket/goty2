import { Application } from "pixi.js";
import { Entity, STATE, MOVEMENT_TYPE, Position, DIRECTION } from "./Entity";
import { debugLog, app, PlayerData } from "./index";
import { Item } from "./Item";

// main remote player object
export class RemotePlayer extends Entity {
  public playerId: string;
  public playerData: PlayerData;
  constructor(
    spriteName: string,
    app: Application,
    playerId: string,
    playerData: PlayerData,
    speed?: number,
    displayHealthBar?: boolean,
    movementType?: MOVEMENT_TYPE,
    position?: Position
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
    this.equippedItem = this.playerData.equippedItem;
    this.faceDirection = this.playerData.faceDirection;

    this.inventory = [];
    if (this.playerData.inventory) this.playerData.inventory.forEach((itemData: any) => {
      this.addItemToInventory(new Item(itemData.spriteName, app, itemData.name, itemData.amount));
    });

    // kill if we're dead
    //if (this.state == STATE.DEAD) this.destroy();
  }

  // attack player!
  public damage(amount: number) {
    if (this.state == STATE.ACTIVE) super.damage(amount);
  }

}