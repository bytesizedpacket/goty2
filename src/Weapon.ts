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

    public use(from: Entity, target: any) {
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

        super.use(from, target);
    }
}