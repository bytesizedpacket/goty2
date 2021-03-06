import { Sprite } from "pixi.js";
import { Application } from "pixi.js";
import { Entity } from "./Entity";

// generic item class
export class Item {
  public spriteObject: Sprite;
  public labelText: string;
  public htmlDiv: any;
  public amount: number;
  constructor(
    spriteName: string,
    app: Application,
    labelText: string,
    amount?: number,
  ) {
    // create our sprite with the given name
    let currentSprite = new Sprite(app.loader.resources[spriteName].texture);

    currentSprite.scale.set(0.75, 0.75);

    // keep this consistent
    currentSprite.name = spriteName;

    this.spriteObject = currentSprite;

    this.labelText = labelText;

    if (amount) {
      this.amount = amount;
    } else {
      this.amount = 1;
    }

    this.htmlDiv = document.createElement("div");
    this.htmlDiv.innerHTML = this.amount + "x " + labelText;
  }

  // use this item on the given target
  public use(from: Entity, target: any, e: any) {
    //console.log(from.labelText + " used " + this.labelText + " on " + target.labelText);
  }
}