import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private bgWidth = 2370; // Width of your background image (for some reason, it's half the actual width (actual: 4000))
  private bgHeight = 2370; // Height of your background image (for some reason, it's half the actual height (actual: 4000))
  private xCoord!: Phaser.GameObjects.Text;
  private yCoord!: Phaser.GameObjects.Text;
  private bg!: Phaser.GameObjects.Image;
  // the background is divided into a n x n grid full of cells
  private dimension = 40;
  private cellWidth = 0;
  private cellHeight = 0; 
  // number of moves made in the horizontal and vertical directions (right and bottom are +ve)
  private numHor = 0;
  private numVer = 0;
  private moveEvent: Phaser.Time.TimerEvent | null = null;
  // initial player coordinates
  private initPlayerX = 0;
  private initPlayerY = 0;

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
    this.bg = this.add.image(window.innerWidth/2, window.innerHeight/2, "background");
    console.log(this.bg.width, this.bg.height);
    this.bgWidth = this.bg.width;
    this.bgHeight = this.bg.height;
    this.player = this.physics.add.sprite(window.innerWidth/2, window.innerHeight/2, "player");
    this.initPlayerX = window.innerWidth/2;
    this.initPlayerY = window.innerHeight/2;
    // set cell dimensions
    this.cellWidth = this.bgWidth / this.dimension;
    this.cellHeight = this.bgHeight / this.dimension;

    // coordinates
    this.xCoord = this.add.text(20,20,'X: 0', { fontSize: '20px', fill: '#256' });
    this.xCoord.setScrollFactor(0);
    this.yCoord = this.add.text(20,40,'Y: 0', { fontSize: '20px', fill: '#256' });
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
    this.physics.world.setBounds(
        -this.bgWidth/2 + window.innerWidth, 
        -this.bgHeight/2 + window.innerHeight, 
        this.bgWidth - window.innerWidth, 
        this.bgHeight - window.innerHeight);
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

    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
        this.moveCharacter('right')
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
        this.moveCharacter('left')
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
        this.moveCharacter('up')
    } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
        this.moveCharacter('down')
    }

    this.handleMovement();
  }

  stopMoving() {
    if (this.moveEvent) {
        this.moveEvent.remove(); // Stop the movement loop
        this.moveEvent = null;
    }
}

    handleMovement() {
        if (this.cursors.left.isDown) {
            this.startMoving('left')
            this.player.anims.play('left')
        } else if (this.cursors.right.isDown) {
            this.startMoving('right')
            this.player.anims.play('right')
        } else if (this.cursors.up.isDown) {
            this.startMoving('up')
            this.player.anims.play('front')
        } else if (this.cursors.down.isDown) {
            this.startMoving('down')
            this.player.anims.play('front')
        } else {
            this.stopMoving();
        }
    }

    moveCharacter(direction: string) {
        switch (direction) {
            case "left":
                this.numHor -= 1;
                this.tweens.add({
                    targets: this.player,  
                    x: this.initPlayerX + this.numHor * this.cellWidth, 
                    duration: 200,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false
                });
                break;
            case "right":
                this.numHor += 1
                this.tweens.add({
                    targets: this.player,  
                    x: this.initPlayerX + this.numHor * this.cellWidth, 
                    duration: 200,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false     
                });
                break;
            case "up":
                this.numVer -= 1;
                this.tweens.add({
                    targets: this.player,  
                    y: this.initPlayerY + this.numVer * this.cellHeight, 
                    duration: 200,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false   
                });
                break;
            case "down":
                this.numVer += 1;
                this.tweens.add({
                    targets: this.player,  
                    y: this.initPlayerY + this.numVer * this.cellHeight, 
                    duration: 200,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false 
                });
                break;
        }
    
      }

    startMoving(direction: string) {
        if (this.moveEvent) return;

        this.moveEvent = this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                this.moveCharacter(direction)
            }
            
        })
    }
}
