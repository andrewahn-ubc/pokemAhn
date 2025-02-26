import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private bg!: Phaser.GameObjects.Image;
    private player!: Phaser.Physics.Arcade.Sprite;
    // keys
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private arrows: string[] = [];
    // background dimensions
    private bgWidth!: integer;
    private bgHeight!: integer;
    // for displaying the coordinates
    private xCoord!: Phaser.GameObjects.Text;
    private yCoord!: Phaser.GameObjects.Text;
    // the background is divided into a n x n grid full of cells
    private dimension = 80; // the background has to be square
    private cellWidth!: integer;
    private cellHeight!: integer; 
    // number of moves made in the horizontal and vertical directions (right and bottom are +ve)
    private numHor = 0;
    private numVer = 0;
    private moveEvent: Phaser.Time.TimerEvent | null = null;
    // "center" coordinates (because (0,0) isn't really the "center" of this scene) (in real coordinates)
    private centerX!: integer;
    private centerY!: integer;
    // music
    private backgroundMusic!: Phaser.Sound.BaseSound;
    // character movement
    private delay = 75; // 200 is optimal

    // initialize our scene

    constructor() {
        super("GameScene");
    }

    // load the assets

    preload() {
        this.load.image("background", "/assets/bg.png");
        this.load.spritesheet("player", "/assets/player.png", { frameWidth: 48, frameHeight: 48 });
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
        // music
        this.load.audio('bgMusic', 'assets/audio/intro.mp3');
    }

    // set up the scene!

    create() {
        this.setUpWorld();
        // character
        this.player = this.physics.add.sprite(window.innerWidth/2, window.innerHeight/2, "player");
        this.player.setCollideWorldBounds(true);
        // character animations
        this.createAnims();
        // coordinates
        this.xCoord = this.add.text(20,20,'X: 0', { fontSize: '20px', fill: '#256' });
        this.xCoord.setScrollFactor(0);
        this.yCoord = this.add.text(20,40,'Y: 0', { fontSize: '20px', fill: '#256' });
        this.yCoord.setScrollFactor(0);

        // centering the player in the viewport
        this.cameras.main.startFollow(this.player, true, 1, 1);
        // create map view
        const secondCamera = this.cameras.add(window.innerWidth - 4 * this.cellWidth, this.cellHeight, this.cellWidth * 3, this.cellHeight * 3); // (x, y, width, height)
        // Move camera to a specific position (x, y)
        secondCamera.scrollX = this.centerX - 50; // Move horizontally
        secondCamera.scrollY = this.centerY - 50; // Move vertically
        secondCamera.setZoom(0.04); // Zoom out
        secondCamera.setBackgroundColor(0x000000); // Black background

        // background music 
        this.backgroundMusic = this.sound.add('bgMusic', {
            loop: true,  // Loop the music
            volume: 0.5  // Set volume (0.0 to 1.0)
        });
        this.backgroundMusic.play();
        if (this.input.keyboard) {
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
            this.spaceKey.on('down', () => {
                if (this.backgroundMusic.isPlaying) {
                    this.backgroundMusic.pause();
                } else {
                    this.backgroundMusic.resume();
                }
            });
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    update() {
        this.player.setVelocity(0);
        // update coordinates
        const relativeCoords = this.relativeCoord(this.player.x, this.player.y);
        this.xCoord.setText("X: " + Math.floor(relativeCoords[0]));
        this.yCoord.setText("Y: " + Math.floor(relativeCoords[1]));

        // handle initial arrow click (without this section, there's a pause before player moves)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.stopMoving();
            this.moveCharacter('right')
            this.arrows.shift()
            this.arrows.push("right")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.stopMoving();
            this.moveCharacter('left')
            this.arrows.shift()
            this.arrows.push("left")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.stopMoving();
            this.moveCharacter('up')
            this.arrows.shift()
            this.arrows.push("up")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.stopMoving();
            this.moveCharacter('down')
            this.arrows.shift()
            this.arrows.push("down")
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

    setUpWorld() {
        // background
        this.centerX = window.innerWidth/2 - 1;
        this.centerY = window.innerHeight/2 - 12;
        this.bg = this.add.image(this.centerX, this.centerY, "background");
        this.bgWidth = this.bg.width;
        this.bgHeight = this.bg.height;

        // setting boundaries
        this.physics.world.setBounds(
            -this.bgWidth/2 + window.innerWidth, 
            -this.bgHeight/2 + window.innerHeight, 
            this.bgWidth - window.innerWidth, 
            this.bgHeight - window.innerHeight);

        // set cell dimensions
        this.cellWidth = this.bgWidth / this.dimension;
        this.cellHeight = this.bgHeight / this.dimension;

        // trees, paths, bushes
        this.placeForest();

        // links
        // const githubButton = this.placeImage(0, -2, "github");
        // githubButton.setInteractive();
        // githubButton.on("pointerdown", () => {
        //     window.open("https://github.com/andrewahn-ubc", "_blank"); // Open link in new tab
        // });

        // roads
        this.placeRoads();
    }

    // takes in relative coordinates and outputs real coordinates
    realCoord(relativeX: integer, relativeY: integer) {
        const realX = this.centerX + relativeX * this.cellWidth;
        const realY = this.centerY + relativeY * this.cellHeight;
        return [realX, realY];
    }

    // takes in real coordinates and outputs relative coordinates
    relativeCoord(realX: integer, realY: integer) {
        const relativeX = Math.floor((realX - this.centerX)/this.cellWidth);
        const relativeY = Math.floor((realY - this.centerY)/this.cellHeight);
        return [relativeX, relativeY];
    }

    placeImage(relativeX: integer, relativeY: integer, assetName: string) {
        const realCoords = this.realCoord(relativeX, relativeY);
        const image = this.add.image(realCoords[0], realCoords[1], assetName);
        return image;
    }

    placeForest() {
        // perimeter
        this.placeTrees([-40,-40,40,-20]);
        this.placeTrees([-40,20,40,40]);
        this.placeTrees([-40,-20,-20,20]);
        this.placeTrees([20,-20,40,20]);
        // smoothing
        this.placeTrees([-20,-20,-14,-14]);
        this.placeTrees([-14,-20,-10,-16]);
        this.placeTrees([-20,-14,-16,-9]);
        this.placeTrees([-20,-9,-18,-4]);
        this.placeTrees([-10,-20,-4,-18]);
        this.placeTrees([-16,-16,-13,-13]);

        this.placeTrees(this.rotate([-20,-20,-14,-14]));
        this.placeTrees(this.rotate([-14,-20,-10,-16]));
        this.placeTrees(this.rotate([-20,-14,-16,-9]));
        this.placeTrees(this.rotate([-20,-9,-18,-4]));
        this.placeTrees(this.rotate([-10,-20,-4,-18]));
        this.placeTrees(this.rotate([-16,-16,-13,-13]));

        this.placeTrees(this.rotate(this.rotate([-20,-20,-14,-14])));
        this.placeTrees(this.rotate(this.rotate([-14,-20,-10,-16])));
        this.placeTrees(this.rotate(this.rotate([-20,-14,-16,-9])));
        this.placeTrees(this.rotate(this.rotate([-20,-9,-18,-4])));
        this.placeTrees(this.rotate(this.rotate([-10,-20,-4,-18])));
        this.placeTrees(this.rotate(this.rotate([-16,-16,-13,-13])));

        this.placeTrees(this.rotate(this.rotate(this.rotate([-20,-20,-14,-14]))));
        this.placeTrees(this.rotate(this.rotate(this.rotate([-14,-20,-10,-16]))));
        this.placeTrees(this.rotate(this.rotate(this.rotate([-20,-14,-16,-9]))));
        this.placeTrees(this.rotate(this.rotate(this.rotate([-20,-9,-18,-4]))));
        this.placeTrees(this.rotate(this.rotate(this.rotate([-10,-20,-4,-18]))));
        this.placeTrees(this.rotate(this.rotate(this.rotate([-16,-16,-13,-13]))));
    }

    placeRoads() {
        this.placePath(0, 0, 15, "v"); // bottom middle vertical

        this.placePath(-7, 7, 15, "h"); // bottom upper horizontal
        this.placePath(-5, 12, 11, "h"); // bottom lower horizontal

        // rectangle
        this.placePath(-13, 0, 26, "h");
        this.placePath(-10, -8, 8, "v");
        this.placePath(9, -8, 8, "v");
        this.placePath(-10, -9, 20, "h");
        
        this.placePath(-5, -13, 4, "v"); // top left vertical
        this.placePath(4, -13, 4, "v"); // top right vertical
    }

    // place a straight path (either horizontal or vertical) given relative coordinates
    placePath(startX: integer, startY: integer, length: integer, direction: string) {
        if (direction === "h") {
            for (let i = 0; i < length; i++) {
                this.placeImage(startX + i, startY, "path-hor");
            }
        } else if (direction === "v") {
            for (let i = 0; i < length; i++) {
                this.placeImage(startX, startY + i, "path-ver");
            }
        }
    }

    // given two coordinates in the form [x1, y1, x2, y2], return a version rotated by 90 degrees clockwise 
    rotate(coordinates: integer[]) {
        const x1 = coordinates[0];
        const y1 = coordinates[1];
        const x2 = coordinates[2];
        const y2 = coordinates[3];

        // multiplies each coordinate by the rotation matrix
        // [0 -1]
        // [1, 0]
        // then adjusts coordinates to ensure we're passing the top left and bottom right corner of the desired forest
        // (without this adjustment, we would return the top right and bottom left corner, due to rotation)
        coordinates[0] = -y2;
        coordinates[1] = x1;
        coordinates[2] = -y1;
        coordinates[3] = x2;

        return coordinates;
    }

    // place trees in a rectangle starting at index (startX, startY) and ending at (endX, endY), in relative coordinates
    placeTrees(coordinates: integer[]) {
        const startX = coordinates[0];
        const startY = coordinates[1];
        const endX = coordinates[2];
        const endY = coordinates[3];

        if (startX >= endX || startY >= endY || 
            startX < -this.dimension/2 || 
            startY < -this.dimension/2 ||
            endX > this.dimension/2 ||
            endY > this.dimension/2) {
            console.log("dimensions are messed up lowkey");
            return
        }

        for (let i = startX; i < endX; i++) {
            for (let j = startY; j < endY; j++) {
                this.placeImage(i, j, "tree");
            }
        }
    }

    createAnims() {
        this.anims.create({
            key: "left",
            frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "right",
            frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });  
        this.anims.create({
            key: "down",
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "up",
            frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: "still",
            frames: [{key: "player", frame: 0}],
            frameRate: 10,
            repeat: -1
        });
    }

    stopMoving() {
        if (this.moveEvent) {
            this.moveEvent.remove(); // Stop the movement loop
            this.moveEvent = null;
        }
        this.player.anims.play('still')
    }

    // helper for deciding how player should move
    handleMovement() {
        if (this.arrows[0] == 'left' && !this.cursors.left.isDown) {
            this.arrows.shift();
        }
        if (this.arrows[0] == 'right' && !this.cursors.right.isDown) {
            this.arrows.shift();
        }
        if (this.arrows[0] == 'up' && !this.cursors.up.isDown) {
            this.arrows.shift();
        }
        if (this.arrows[0] == 'down' && !this.cursors.down.isDown) {
            this.arrows.shift();
        }

        if (this.arrows[0] == 'left') {
            this.startMoving('left')
        } else if (this.arrows[0] == 'right') {
            this.startMoving('right')
        } else if (this.arrows[0] == 'up') {
            this.startMoving('up')
        } else if (this.arrows[0] == 'down') {
            this.startMoving('down')
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
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.player.anims.play('left');
                    }
                });
                break;
            case "right":
                if (this.player.x + 50 >= this.bgWidth/2) {
                    console.log("player out of bounds");
                    return
                }
                this.numHor += 1
                this.tweens.add({
                    targets: this.player,  
                    x: this.centerX + this.numHor * this.cellWidth, 
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.player.anims.play('right');
                    }   
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
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.player.anims.play('up');
                    } 
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
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.player.anims.play('down');
                    } 
                });
                break;
        }
    
    }

    startMoving(direction: string) {
        if (this.moveEvent) return;

        this.moveEvent = this.time.addEvent({
            delay: this.delay,
            loop: true,
            callback: () => {
                this.moveCharacter(direction)
            }
            
        })
    }
}
