import Phaser from "phaser";

export default class HomeScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;

    constructor() {
        super({ key: "HomeScene" });
    }

    preload() {
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image("background", "/assets/bg.png");
    }

    create() {
        this.background = this.add.image(0, 0, "background");
        this.input.manager.enabled = true;
        this.input.once("pointerdown", () => {
            this.scene.start("GameScene", { x: 21, y: 13 })
        }, this)
    }

    update() {

    }
}