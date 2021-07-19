import { Item } from "./Item";
import { Application } from "pixi.js";
import { Entity, Position, STATE } from "./Entity";
import { RemotePlayer } from "./RemotePlayer";
import { io } from "./index";

// the use() function will read this to determine what to do
export enum WEAPON_TYPE {
    MELEE = "melee",
    PROJECTILE = "projectile",
}

export class Weapon extends Item {
    public damage: number;
    public weaponType: WEAPON_TYPE;
    constructor(
        spriteName: string,
        app: Application,
        labelText: string,
        damage: number,
        weaponType: WEAPON_TYPE,
        amount?: number,
    ) {
        super(spriteName, app, labelText, amount);
        this.damage = damage;
        this.weaponType = weaponType;
    }

    public use(from: Entity, target: any, e: any) {
        let clickPos: Position = e.data.global; // the screen coordinates of where the user clicked (top left pixel is 0,0)
        switch (target.constructor) {
            case RemotePlayer:
                // limit our distance
                if (from.distanceTo(target) < 80 && target.state == STATE.ACTIVE) {
                    io.emit("playerDamage", target.playerId, this.damage);
                    target.damage(this.damage);
                }
                break;
            default:
                // any entity
                //console.log(clickPos);
                break;
        }

        super.use(from, target, e);
    }
}