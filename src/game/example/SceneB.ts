import { Player } from './Player.ts';

class SceneB extends Phaser.Scene {
    private player!: Player;
    private playerX: number;
    private playerY: number;

    constructor() {
        super({ key: 'sceneB' });
    }

    init(data: { x: number; y: number }) {
        this.playerX = data.x ?? 100;
        this.playerY = data.y ?? 300;
    }

    create() {
        // Create player at new position
        this.player = new Player(this, this.playerX, this.playerY);

        // Add collision detection if needed
        const ground = this.physics.add.staticGroup();
        ground.create(400, 568, 'ground').setScale(2).refreshBody();
        this.physics.add.collider(this.player, ground);
    }

    update() {
        this.player.update();
    }
}
