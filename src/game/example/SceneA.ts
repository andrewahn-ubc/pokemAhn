import { Player } from './Player';

class SceneA extends Phaser.Scene {
    private player!: Player;

    constructor() {
        super({ key: 'sceneA' });
    }

    create() {
        // Create the player instance
        this.player = new Player(this, 100, 300);

        // Example: Add collision with a ground layer
        const ground = this.physics.add.staticGroup();
        ground.create(400, 568, 'ground').setScale(2).refreshBody();
        this.physics.add.collider(this.player, ground);

        // Example: Switch to another scene
        if (this.input.keyboard) {
            this.input.keyboard.on('keydown-F', () => {
                this.scene.start('sceneB', { x: this.player.x, y: this.player.y });
            });
        }
    }

    update() {
        this.player.update();
    }
}
