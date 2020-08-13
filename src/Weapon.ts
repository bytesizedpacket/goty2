import { Item } from "./Item";
import { Application } from "pixi.js";
import { Entity, STATE } from "./Entity";
import { RemotePlayer } from "./RemotePlayer";
import { io } from "./index";

export enum WEAPON_TYPE {
    MELEE = "melee",
    PROJECTILE = "projectile",
}

export class Weapon extends Item {
    public damage: number;
    constructor(
        spriteName: string,
        app: Application,
        labelText: string,
        damage: number,
        amount?: number,
    ) {
        super(spriteName, app, labelText, amount);
        this.damage = damage;
    }

    public use(from: Entity, target: any) {
        super.use(from, target);

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
                break;
        }
    }
}