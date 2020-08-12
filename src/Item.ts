import { Sprite } from "pixi.js";
import { Graphics } from "pixi.js";
import { Container } from "pixi.js";
import { Application } from "pixi.js";
import { app, player, viewWidth, viewHeight, statusText } from "./index";

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

    currentSprite.scale.set(-0.75, 0.75);

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
}