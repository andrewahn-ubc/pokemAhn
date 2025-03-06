import Phaser from "phaser";
import GameScene from "./GameScene";

export default class HomeScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private player!: Phaser.Physics.Arcade.Sprite;

    constructor() {
        super({ key: "HomeScene" });
    }

    preload() {
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image("background", "/assets/bg.png");
        this.load.spritesheet("player", "/assets/players/player.png", { frameWidth: 48, frameHeight: 48 });
    }

    create() {
        this.background = this.add.image(0, 0, "background");
        // this.player = this.addCharacter(this.spawnX, this.spawnY, "player");

        this.input.manager.enabled = true;
        this.input.once("pointerdown", () => {
            this.scene.start("GameScene", { x: 21, y: 13 })
        }, this)
    }

    update() {

    }
}