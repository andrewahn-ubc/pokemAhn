import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bgWidth = 2000; // Width of your background image (for some reason, it's half the actual width (actual: 4000))
  private bgHeight = 2000; // Height of your background image (for some reason, it's half the actual height (actual: 4000))
  private xCoord!: Phaser.GameObjects.Text;
  private yCoord!: Phaser.GameObjects.Text;

  constructor() {
    super("GameScene");
  }

  preload() {
    this.load.image("background", "/assets/bg.png");
    this.load.spritesheet("player", "/assets/bron.png", { frameWidth: 60, frameHeight: 60 });
    this.load.image("github", "/assets/github-mark.png");
  }

  create() {
    // background and character
    this.add.image(window.innerWidth/2, window.innerHeight/2, "background");
    this.player = this.physics.add.sprite(window.innerWidth/2, window.innerHeight/2, "player");

    // coordinates
    this.xCoord = this.add.text(20,20,'X: 0', { fontSize: '20px', fill: '#000' });
    this.xCoord.setScrollFactor(0);
    this.yCoord = this.add.text(20,40,'Y: 0', { fontSize: '20px', fill: '#000' });
    this.yCoord.setScrollFactor(0);

    // links
    const githubButton = this.add.image(window.innerWidth/2, window.innerHeight/2 - 100, "github").setScale(0.25);
    githubButton.setInteractive();
    githubButton.on("pointerdown", () => {
        window.open("https://github.com/andrewahn-ubc", "_blank"); // Open link in new tab
    });

    // welcome
    this.add.text(window.innerWidth/2 - 400, window.innerHeight/2 - 200, 'Hey, welcome to my website!', { fontSize: '50px', fill: '#000' });

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
    this.xCoord.setText("X: " + this.player.x)
    this.yCoord.setText("Y: " + this.player.y)

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
