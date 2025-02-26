import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private player!: Phaser.Physics.Arcade.Sprite;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private bgWidth!: integer;
    private bgHeight!: integer;
    private xCoord!: Phaser.GameObjects.Text;
    private yCoord!: Phaser.GameObjects.Text;
    private bg!: Phaser.GameObjects.Image;
    // the background is divided into a n x n grid full of cells
    private dimension = 80;
    private cellWidth!: integer;
    private cellHeight!: integer; 
    // number of moves made in the horizontal and vertical directions (right and bottom are +ve)
    private numHor = 0;
    private numVer = 0;
    private moveEvent: Phaser.Time.TimerEvent | null = null;
    // "center" coordinates (because (0,0) isn't really the "center" of this scene)
    private centerX!: integer;
    private centerY!: integer;

    constructor() {
        super("GameScene");
    }

    preload() {
        this.load.image("background", "/assets/bg.png");
        this.load.spritesheet("player", "/assets/bron.png", { frameWidth: 60, frameHeight: 60 });
        this.load.image("github", "/assets/github-mark.png");
        this.load.image("tree", "/assets/tree.png");
        this.load.image("bush", "/assets/bush.png");
        // paths
        this.load.image("path-ver", "/assets/path_ver.png");
        this.load.image("path-hor", "/assets/path_hor.png");
        this.load.image("path-tr", "/assets/path_tr.png");
        this.load.image("path-tl", "/assets/path_tl.png");
        this.load.image("path-bl", "/assets/path_bl.png");
        this.load.image("path-br", "/assets/path_br.png");
    }

    create() {
        // background
        this.bg = this.add.image(window.innerWidth/2, window.innerHeight/2, "background");
        this.bgWidth = this.bg.width;
        this.bgHeight = this.bg.height;
        this.centerX = window.innerWidth/2;
        this.centerY = window.innerHeight/2;
        // set cell dimensions
        this.cellWidth = this.bgWidth / this.dimension;
        this.cellHeight = this.bgHeight / this.dimension;
        // trees, paths, bushes
        this.placeForest();
        this.add.image(window.innerWidth/2 + 250, window.innerHeight/2 + 200, "bush");
        this.add.image(window.innerWidth/2 + 300, window.innerHeight/2 + 200, "path-ver");
        this.add.image(window.innerWidth/2 + 350, window.innerHeight/2 + 200, "path-hor");
        this.add.image(window.innerWidth/2 + 400, window.innerHeight/2 + 200, "path-tr");
        this.add.image(window.innerWidth/2 + 450, window.innerHeight/2 + 200, "path-tl");
        this.add.image(window.innerWidth/2 + 500, window.innerHeight/2 + 200, "path-bl");
        this.add.image(window.innerWidth/2 + 550, window.innerHeight/2 + 200, "path-br");
        // character
        this.player = this.physics.add.sprite(window.innerWidth/2, window.innerHeight/2, "player");
        // character frames
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
        this.add.text(window.innerWidth/2 - 8*this.cellHeight, window.innerHeight/2 - 4*this.cellWidth, 'Hey, welcome to my website!', { fontSize: '50px', fill: '#000' });

        // bounding player within background
        this.physics.world.setBounds(
            -this.bgWidth/2 + window.innerWidth, 
            -this.bgHeight/2 + window.innerHeight, 
            this.bgWidth - window.innerWidth, 
            this.bgHeight - window.innerHeight);
        this.player.setCollideWorldBounds(true);

        // centering the player in the viewport
        this.cameras.main.startFollow(this.player, true, 1, 1);
            
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    update() {
        this.player.setVelocity(0);
        // default frame is "front"
        this.player.anims.play('front')
        // update coordinates
        this.xCoord.setText("X: " + this.player.x)
        this.yCoord.setText("Y: " + this.player.y)

        // handle initial arrow click (without this section, there's a pause before player moves)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.moveCharacter('right')
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.moveCharacter('left')
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.moveCharacter('up')
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.moveCharacter('down')
        }

        // handle arrow key "press-and-hold"
        this.handleMovement();

        // zoom functionality using + and - symbols
        if (this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS).isDown) {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + 0.03, 0.1, 2));
        }
        if (this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS).isDown) {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - 0.03, 0.1, 2));
        }
    }

    placeForest() {
        // perimeter
        this.placeTrees(-40,-40,40,-20);
        this.placeTrees(-40,20,40,40);
        this.placeTrees(-40,-20,-20,20);
        this.placeTrees(20,-20,40,20);

        // title
        this.placeTrees(-9,-5,10,-4);
    }

    // imagining the background as a dimension x dimension matrix, 
    // place trees starting at index (startX, startY) and ending at (endX, endY)
    // input coordinates are in our grid coordinates, not the actual coordinates
    placeTrees(startX: integer, startY: integer, endX: integer, endY: integer) {
        if (startX >= endX || startY >= endY || 
            startX < this.centerX - this.bgWidth/2 || 
            startY < this.centerY - this.bgHeight/2) {
            console.log("dimensions are messed up lowkey");
            return
        }

        const startX_coord = this.centerX + startX * this.cellWidth
        const startY_coord = this.centerY + startY * this.cellHeight
        const endX_coord = this.centerX + endX * this.cellWidth
        const endY_coord = this.centerY + endY * this.cellHeight

        for (let i = startX_coord; i < endX_coord; i += this.cellWidth) {
            for (let j = startY_coord; j < endY_coord; j += this.cellHeight) {
                this.add.image(i, j, "tree");
            }
        }
    }

    stopMoving() {
        if (this.moveEvent) {
            this.moveEvent.remove(); // Stop the movement loop
            this.moveEvent = null;
        }
    }

    // helper for deciding how player should move
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

    // helper for actually moving the player
    moveCharacter(direction: string) {
        switch (direction) {
            case "left":
                if (this.player.x - 50 < -this.bgWidth/2 + window.innerWidth) {
                    console.log("player out of bounds")
                    return
                }
                this.numHor -= 1;
                this.tweens.add({
                    targets: this.player,  
                    x: this.centerX + this.numHor * this.cellWidth, 
                    duration: 200,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false
                });
                break;
            case "right":
                if (this.player.x + 50 >= this.bgWidth/2) {
                    console.log("player out of bounds")
                    return
                }
                this.numHor += 1
                this.tweens.add({
                    targets: this.player,  
                    x: this.centerX + this.numHor * this.cellWidth, 
                    duration: 200,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false     
                });
                break;
            case "up":
                if (this.player.y - 50 < -this.bgHeight/2 + window.innerHeight) {
                    console.log("player out of bounds")
                    return
                }
                this.numVer -= 1;
                this.tweens.add({
                    targets: this.player,  
                    y: this.centerY + this.numVer * this.cellHeight, 
                    duration: 200,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false   
                });
                break;
            case "down":
                if (this.player.y + 50 >= this.bgHeight/2) {
                    console.log("player out of bounds")
                    return
                }
                this.numVer += 1;
                this.tweens.add({
                    targets: this.player,  
                    y: this.centerY + this.numVer * this.cellHeight, 
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
