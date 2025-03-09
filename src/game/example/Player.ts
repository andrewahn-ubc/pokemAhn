export class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'playerTexture'); // Load sprite

        // Add to scene & enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set physics properties
        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        this.setGravityY(300);

        // Input handling
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
        }
    }

    update() {
        // Handle movement input
        if (this.cursors.left.isDown) {
            this.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(160);
        } else {
            this.setVelocityX(0);
        }

        // Jumping
        if (this.cursors.up.isDown && this.body?.touching.down) {
            this.setVelocityY(-330);
        }
    }
}
