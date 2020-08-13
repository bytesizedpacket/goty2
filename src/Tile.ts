import { app, player } from "./index";
import { Sprite } from "pixi.js";
import { Position } from "./Entity";
export enum TILE_TYPE {
  FLOOR = "tile-floor",
  WALL = "tile-wall"
}

export class Tile {
  public tileType: TILE_TYPE;
  public spriteObject: Sprite;
  public position: Position;
  public labelText: string;

  constructor(tileType: TILE_TYPE, position: Position) {
    this.tileType = tileType;
    this.position = position;

    switch (this.tileType) {
      case TILE_TYPE.FLOOR:
        this.spriteObject = new Sprite(
          app.loader.resources[TILE_TYPE.FLOOR].texture
        );
        this.labelText = "Floor";
        break;
      case TILE_TYPE.WALL:
        this.spriteObject = new Sprite(
          app.loader.resources[TILE_TYPE.WALL].texture
        );
        this.labelText = "Wall";
        break;
    }

    this.spriteObject.interactive = true;
  }

  // it has been clicked!
  public onClick(e: any) {
    // call the player's interact() on this
    player.interact(this, e);
  }
}
