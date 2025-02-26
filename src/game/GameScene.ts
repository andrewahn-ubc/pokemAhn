import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bgWidth = 2000; // Width of your background image (for some reason, it's half the actual width (actual: 4000))
  private bgHeight = 2000; // Height of your background image (for some reason, it's half the actual height (actual: 4000))

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("background", "/assets/bg.png");
    this.load.spritesheet("player", "/assets/bron.png", { frameWidth: 60, frameHeight: 60 });
  }

  create() {
    // add background and character
    this.add.image(window.innerWidth/2, window.innerHeight/2, "background");
    this.player = this.physics.add.sprite(window.innerWidth/2, window.innerHeight/2, "player");

    // player can't move "off" the background
    this.physics.world.setBounds(0, 0, this.bgWidth, this.bgHeight);
    this.player.setCollideWorldBounds(true);

    // camera follows the player
    this.cameras.main.startFollow(this.player, true, 1, 1);

    this.anims.create({
      key: "left",
      frames: [{key: "player", frame: 0}],
      frameRate: 20
    });

    this.anims.create({
        key: "front",
        frames: [{key: "player", frame: 1}],
        frameRate: 20
    });

    this.anims.create({
        key: "right",
        frames: [{key: "player", frame: 2}],
        frameRate: 20
    });
      
    if (this.input.keyboard) {
        this.cursors = this.input.keyboard.createCursorKeys();
    }
  }

  update() {
    this.player.setVelocity(0);

    this.player.anims.play('front')

    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-300);
      this.player.anims.play('left')
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(300);
      this.player.anims.play('right')
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-300);
      this.player.anims.play('front')
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(300);
      this.player.anims.play('front')
    }
  }
}
