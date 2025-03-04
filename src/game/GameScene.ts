import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private bg!: Phaser.GameObjects.Image;
    private player!: Phaser.Physics.Arcade.Sprite;
    private player_oldman!: Phaser.Physics.Arcade.Sprite;
    private characters: Record<string, Phaser.Physics.Arcade.Sprite> = {};
    private closeToNPC: boolean = false;
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
        // the tuple contains the corresponding player's relative coordinates
    private positions: Record<string, [number, number]> = {};
    private mostRecentPlayerMove!: string;
    private moveEvent: Phaser.Time.TimerEvent | null = null;
    private npcMoveEvents: Record<string, Phaser.Time.TimerEvent> = {};
    // "center" coordinates (because (0,0) isn't really the "center" of this scene) (in real coordinates)
    private centerX!: integer;
    private centerY!: integer;
    // music
    private backgroundMusic!: Phaser.Sound.BaseSound;
    // character movement
    private delay: Record<string, number> = {"player": 200, "player_oldman": 600};
    // layout
    //      Legend
    //      1: tree
    //      2: path
    //      11: house #1
    private layout!: number[][];

    // table that tracks collidable objects
    //      Legend
    //      0: nothing - player can pass through
    //      1: something - player cannot pass through
    private collidableLayout: number[][] = new Array(this.dimension).fill(null).map(() => new Array(this.dimension).fill(0));

    // initialize our scene

    constructor() {
        super("GameScene");
    }

    // load the assets

    preload() {
        this.load.image("background", "/assets/bg.png");
        this.load.spritesheet("player", "/assets/players/player.png", { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet("player_oldman", "/assets/players/player_oldman.png", { frameWidth: 32, frameHeight: 48 });
        this.load.image("github", "/assets/github-mark.png");
        this.load.image("tree", "/assets/tree.png");
        this.load.image("bush", "/assets/bush.png");
        // paths
        this.load.image("path-ver", "/assets/paths/path_ver.png");
        this.load.image("path-hor", "/assets/paths/path_hor.png");
        this.load.image("path-tr", "/assets/paths/path_tr.png");
        this.load.image("path-tl", "/assets/paths/path_tl.png");
        this.load.image("path-bl", "/assets/paths/path_bl.png");
        this.load.image("path-br", "/assets/paths/path_br.png");
        this.load.image("path-3-up", "/assets/paths/path_3_up.png");
        this.load.image("path-3-down", "/assets/paths/path_3_down.png");
        this.load.image("path-3-right", "/assets/paths/path_3_right.png");
        this.load.image("path-3-left", "/assets/paths/path_3_left.png");
        this.load.image("path-4", "/assets/paths/path_4.png");
        this.load.image("path-mid", "/assets/paths/path_mid.png");
        this.load.image("path-mid-left", "/assets/paths/path_mid_left.png");
        this.load.image("path-mid-right", "/assets/paths/path_mid_right.png");
        this.load.image("path-mid-up", "/assets/paths/path_mid_up.png");
        this.load.image("path-mid-down", "/assets/paths/path_mid_down.png");
        this.load.image("path-mid-tr", "/assets/paths/path_mid_tr.png");
        this.load.image("path-mid-tl", "/assets/paths/path_mid_tl.png");
        this.load.image("path-mid-br", "/assets/paths/path_mid_br.png");
        this.load.image("path-mid-bl", "/assets/paths/path_mid_bl.png");
        this.load.image("path-solo", "/assets/paths/path_solo.png");
        this.load.image("path-anti-br", "/assets/paths/path_anti_br.png");
        this.load.image("path-anti-bl", "/assets/paths/path_anti_bl.png");
        this.load.image("path-anti-tr", "/assets/paths/path_anti_tr.png");
        this.load.image("path-anti-tl", "/assets/paths/path_anti_tl.png");
        this.load.image("path-funnel-up", "/assets/paths/path_funnel_up.png");
        this.load.image("path-funnel-down", "/assets/paths/path_funnel_down.png");
        this.load.image("path-funnel-right", "/assets/paths/path_funnel_right.png");
        this.load.image("path-funnel-left", "/assets/paths/path_funnel_left.png");
        // buildings
        this.load.image("house-1", "/assets/house_1.png");
        this.load.image("house-2", "/assets/house_2.png");
        // music
        this.load.audio('bgMusic', 'assets/audio/intro.mp3');
        this.load.audio('trap', 'assets/audio/trap.mp3');

        // layout
        fetch("/layout.csv") // Adjust the path based on your setup
        .then((response) => response.text()) // Get CSV as a string
        .then((text) => {
            const rows = text.split("\n").map((row) => row.split(",")); // Convert to 2D array
            const rows_as_numbers = rows.map((row) => (row.map((cell) => Number(cell))))
            this.layout = rows_as_numbers;
        })
        .catch((error) => console.error("Error loading CSV:", error));
    }
 
    // set up the scene!
    create() {
        this.centerX = window.innerWidth/2;
        this.centerY = window.innerHeight/2;
        this.environment = this.physics.add.staticGroup(); // create static group that the player will collide with
        this.setUpWorld();
        // character
        this.player = this.addCharacter(40, 40, "player");
        this.characters["player"] = this.player;
        this.player_oldman = this.addCharacter(38, 38, "player_oldman");
        this.characters["player_oldman"] = this.player_oldman;
        this.player.setCollideWorldBounds(true);

        // character animations
        this.createAnims("player");
        this.createAnims("player_oldman");
        
        // coordinates
        this.xCoord = this.add.text(20,20,'X: 0', { fontSize: '20px', fill: '#fff', backgroundColor: '#000000',});
        this.xCoord.setScrollFactor(0);
        this.yCoord = this.add.text(20,40,'Y: 0', { fontSize: '20px', fill: '#fff', backgroundColor: '#000000', });
        this.yCoord.setScrollFactor(0);

        // centering the player in the viewport
        this.cameras.main.startFollow(this.player, true, 1, 1);
        // create map view
        const secondCamera = this.cameras.add(window.innerWidth - 4 * this.cellWidth, this.cellHeight, this.cellWidth * 3, this.cellHeight * 3); // (x, y, width, height)
        // Move camera to a specific position (x, y)
        secondCamera.scrollX = this.centerX - 100; // Move horizontally
        secondCamera.scrollY = this.centerY - 90; // Move vertically
        secondCamera.setZoom(0.1); // Zoom out
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

    // Positions in relative coordinates
    addCharacter(positionX: number, positionY: number, name: string) {
        const realCoord = this.realCoord(positionX, positionY);
        const player = this.physics.add.sprite(realCoord[0], realCoord[1], name);
        this.positions[name] = [positionX, positionY];

        return player;
    }

    // returns the player's relative coordinates
    getPlayerCoords(characterName: string): [number, number] {
        return this.positions[characterName];
    }

    update() {
        this.player.setVelocity(0);
        // update coordinates
        const relativeCoords = this.getPlayerCoords("player");
        this.xCoord.setText("X: " + Math.floor(relativeCoords[0]));
        this.yCoord.setText("Y: " + Math.floor(relativeCoords[1]));
        this.startMovingNPC(this.player_oldman, "player_oldman")
        this.handleNPCNearPlayer("player_oldman");

        // handle initial arrow click (without this section, there's a pause before player moves)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.stopMoving("player");
            this.moveCharacter('right', this.player, "player")
            this.mostRecentPlayerMove = "right"
            this.arrows.shift()
            this.arrows.push("right")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.stopMoving("player");
            this.moveCharacter('left', this.player, "player")
            this.mostRecentPlayerMove = "left"
            this.arrows.shift()
            this.arrows.push("left")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.stopMoving("player");
            this.moveCharacter('up', this.player, "player")
            this.mostRecentPlayerMove = "up"
            this.arrows.shift()
            this.arrows.push("up")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.stopMoving("player");
            this.moveCharacter('down', this.player, "player")
            this.mostRecentPlayerMove = "down"
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
        this.placeTrees();
        this.placePath();
        // this.placeBushes();
        // this.placeHouses();
        this.placeLayout();

        // text
        const coordinates = this.realCoord(-3,-4);
        this.add.text(coordinates[0],coordinates[1],'ayyyy welcome to my site', { fontSize: '20px', fill: '#000' });

        // links
        // const githubButton = this.placeImage(0, -2, "github");
        // githubButton.setInteractive();
        // githubButton.on("pointerdown", () => {
        //     window.open("https://github.com/andrewahn-ubc", "_blank"); // Open link in new tab
        // });
    }

    // takes in relative coordinates and outputs real coordinates
    realCoord(relativeX: integer, relativeY: integer) {
        const realX = this.centerX + (relativeX - this.dimension/2) * this.cellWidth;
        const realY = this.centerY + (relativeY - this.dimension/2) * this.cellHeight;
        return [realX, realY];
    }

    // takes in real coordinates and outputs relative coordinates
    relativeCoord(realX: integer, realY: integer) {
        const relativeX = Math.floor((realX - this.centerX)/this.cellWidth) + this.dimension/2;
        const relativeY = Math.floor((realY - this.centerY)/this.cellHeight) + this.dimension/2;
        return [relativeX, relativeY];
    }

    placeTrees() {
        for (let i = 1; i  + 1< this.dimension; i += 2) {
            for (let j = 1; j + 1< this.dimension; j += 2) {
                if (this.layout[j][i] == 1) {
                    this.placeImage(i, j, "tree");
                    this.collidableLayout[j][i + 1] = 1;
                    this.collidableLayout[j][i] = 1;
                    this.collidableLayout[j + 1][i + 1] = 1;
                    this.collidableLayout[j + 1][i] = 1;
                }
            }
        }
    }

    placePath() {
        for (let i = 0; i < this.dimension; i++) {
            for (let j = 0; j < this.dimension; j++) {
                const curr = this.layout[j][i] == 2;
                const down = j < this.dimension - 1 ? this.layout[j + 1][i] == 2 : false;
                const up = j > 0 ? this.layout[j - 1][i] == 2 : false;
                const right = i < this.dimension - 1 ? this.layout[j][i + 1] == 2 : false;
                const left = i > 0 ? this.layout[j][i - 1] == 2 : false;
                const br = (i < this.dimension - 1 && j < this.dimension - 1) ? this.layout[j + 1][i + 1] == 2 : false;
                const tl = (i > 0 && j > 0) ? this.layout[j - 1][i - 1] == 2 : false;
                const bl = (i > 0 && j < this.dimension - 1) ? this.layout[j + 1][i - 1] == 2 : false;
                const tr = (i < this.dimension - 1 && j > 0) ? this.layout[j - 1][i + 1] == 2 : false;
                const allCorners = tr && bl && tl && br;
                const anyCorners = tr || bl || tl || br;
                const allSides = up && down && left && right;
                const anySides = up || down || left || right;

                if (!curr) {
                    continue;
                }

                if (!anyCorners && !anySides) {
                    this.placeImage(i, j, "path-solo");
                } else if (allCorners && allSides) {
                    this.placeImage(i, j, "path-mid");
                } else if (!up && !down) {
                    this.placeImage(i, j, "path-hor");
                } else if (!right && !left) {
                    this.placeImage(i, j, "path-ver");
                } else if (up) {
                    if (right) {
                        if (right && left && !down && !tr && !tl) {
                            this.placeImage(i, j, "path-3-up");
                        } else if (right && !left && down && !tr && !br) {
                            this.placeImage(i, j, "path-3-right");
                        } else if (right && !left && down && tr && br) {
                            this.placeImage(i, j, "path-mid-left");
                        } else if (right && left && !down && tr && tl) {
                            this.placeImage(i, j, "path-mid-down");
                        } else if (right && !left && !down && !bl && tr) {
                            this.placeImage(i, j, "path-mid-bl");
                        } else if (allSides && tl && tr && br && !bl) {
                            this.placeImage(i, j, "path-anti-bl");
                        } else if (allSides && tl && tr && !br && bl) {
                            this.placeImage(i, j, "path-anti-br");
                        } else if (allSides && !tl && tr && br && bl) {
                            this.placeImage(i, j, "path-anti-tl");
                        } else if (allSides && tl && !tr && br && bl) {
                            this.placeImage(i, j, "path-anti-tr");
                        } else if (allSides && !tl && !tr && br && bl) {
                            this.placeImage(i, j, "path-funnel-up");
                        } else if (allSides && tl && tr && !br && !bl) {
                            this.placeImage(i, j, "path-funnel-down");
                        } else if (allSides && tl && !tr && !br && bl) {
                            this.placeImage(i, j, "path-funnel-right");
                        } else if (allSides && !tl && tr && br && !bl) {
                            this.placeImage(i, j, "path-funnel-left");
                        }
                    } else {
                        if (!right && left && down && !tl && !bl) {
                            this.placeImage(i, j, "path-3-left");
                        } else if (!right && left && !down && !tl) {
                            this.placeImage(i, j, "path-br");
                        } else if (!right && left && down && bl && tl) {
                            this.placeImage(i, j, "path-mid-right");
                        }  else if (!right && left && !down && tl && !br) {
                            this.placeImage(i, j, "path-mid-br");  
                        }
                    }
                } else if (!up) {
                    if (right) {
                        if (!up && right && left && down && !br && !bl) {
                            this.placeImage(i, j, "path-3-down");
                        } else if (!up && right && !left && down && !br) {
                            this.placeImage(i, j, "path-tl");
                        } else if (!up && right && left && down && bl && br) {
                            this.placeImage(i, j, "path-mid-up");
                        } else if (!up && right && !left && down && !tl && br) {
                            this.placeImage(i, j, "path-mid-tl");
                        } 
                    } else {
                        if (!up && !right && left && down && !bl) {
                            this.placeImage(i, j, "path-tr");
                        } else if (!up && !right && left && down && bl && !tr) {
                            this.placeImage(i, j, "path-mid-tr");
                        }
                    }
                } 
            }
        }
    }

    placeLayout() {
        for (let i = 0; i < this.dimension; i++) {
            for (let j = 0; j < this.dimension; j++) {
                if (this.layout[j][i] == 11 && this.layout[j - 1][i] != 11 && this.layout[j - 1][i] != 11) {
                    this.placeImage(i, j, "house-1");
                    
                    this.collidableLayout[j ][i + 1] = 1;
                    this.collidableLayout[j ][i] = 1;
                    this.collidableLayout[j ][i + 2] = 1;
                    this.collidableLayout[j + 1][i + 1] = 1;
                    this.collidableLayout[j + 1][i] = 1;
                    this.collidableLayout[j + 1][i + 2] = 1;
                }
            }
        }
    }

    placeImage(relativeX: integer, relativeY: integer, assetName: string) {
        const realCoords = this.realCoord(relativeX, relativeY);

        // TODO: set the origin of the image so that its top left corner is flush with the grid system
        const image = this.add.image(realCoords[0], realCoords[1], assetName);
        const xShift = (this.cellWidth/2)/image.width;
        const yShift = (this.cellHeight/2)/image.height;
        image.setOrigin(xShift,yShift);
        return image;
    }

    // lowkey don't need this anymore
    placeBushes() {
        // this.placeGroup([1,1,5,5], "bush");
        return;
    }

    placeHouses() {
        this.placeImage(45, 45 , "house-2");
    }


    // lowkey don't need this anymore
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

    // lowkey don't need this anymore, but it's nice to have
    // place trees in a rectangle starting at index (startX, startY) and ending at (endX, endY), in relative coordinates
    placeGroup(coordinates: integer[], object: string) {
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

        for (let i = startX; i < endX; i += 2) {
            for (let j = startY; j < endY; j += 2) {
                this.placeImage(i, j, object);
            }
        }
    }

    // HARD ASSUMPTION: the character must have 16 frames, 4 per direction (in the order: down, left, right, and up)
    createAnims(character: string) {
        this.anims.create({
            key: character + "-left",
            frames: this.anims.generateFrameNumbers(character, { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: character + "-right",
            frames: this.anims.generateFrameNumbers(character, { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });  
        this.anims.create({
            key: character + "-down",
            frames: this.anims.generateFrameNumbers(character, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: character + "-up",
            frames: this.anims.generateFrameNumbers(character, { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: character + "-still-down",
            frames: [{key: character, frame: 0}],
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: character + "-still-up",
            frames: [{key: character, frame: 12}],
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: character + "-still-left",
            frames: [{key: character, frame: 4}],
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: character + "-still-right",
            frames: [{key: character, frame: 8}],
            frameRate: 10,
            repeat: -1
        });
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
            this.stopMoving("player");
        }
    }

    // helper for actually moving the player
    moveCharacter(direction: string, character: Phaser.Physics.Arcade.Sprite, characterName: string) {
        const relativeCoords = this.getPlayerCoords(characterName); // TODO: abstract to work for any character

        switch (direction) {
            case "left": {
                if (character.x - 50 < -this.bgWidth/2 + window.innerWidth) {
                    console.log("player out of bounds")
                    return
                }

                if (this.collidableLayout[relativeCoords[1]][relativeCoords[0] - 1] == 1) {
                    console.log("cannot move through solid object")
                    return
                }

                this.positions[characterName][0] -= 1;
                const horizontalCoord = this.realCoord(this.positions[characterName][0], 0)[0]; // putting 0 in as the y value bc it doesn't matter

                this.tweens.add({
                    targets: character,  
                    x: horizontalCoord, 
                    duration: this.delay[characterName],         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        character.anims.play(characterName + '-left');
                    },
                    // TODO: abstract this part into its own function
                    onUpdate: (tween: Phaser.Tweens.Tween) => {
                        const relativeCoords = this.getPlayerCoords(characterName);
                        if (this.collidableLayout[relativeCoords[1]][relativeCoords[0]] == 1) {
                            tween.stop();
                        }
                    },
                    onComplete: () => {
                        if (characterName !== "player") {
                            character.anims.play(characterName + '-still-left')
                        }
                    }
                });
                break;}
            case "right": {
                if (character.x + 50 >= this.bgWidth/2) {
                    console.log("player out of bounds");
                    return
                }

                if (this.collidableLayout[relativeCoords[1]][relativeCoords[0] + 1] == 1) {
                    console.log("cannot move through solid object")
                    return
                }

                this.positions[characterName][0] += 1
                const horizontalCoord = this.realCoord(this.positions[characterName][0], 0)[0]; // putting 0 in as the y value bc it doesn't matter

                this.tweens.add({
                    targets: character,  
                    x: horizontalCoord,
                    duration: this.delay[characterName],         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        character.anims.play(characterName + '-right');
                    },
                    onUpdate: (tween: Phaser.Tweens.Tween) => {
                        const relativeCoords = this.getPlayerCoords(characterName);
                        if (this.collidableLayout[relativeCoords[1]][relativeCoords[0]] == 1) {
                            tween.stop();
                        }
                    },
                    onComplete: () => {
                        if (characterName !== "player") {
                            character.anims.play(characterName + '-still-right')
                        }
                    }
                });
                break;}
            case "up": {    
                if (character.y - 50 < -this.bgHeight/2 + window.innerHeight) {
                    console.log("player out of bounds")
                    return
                }

                if (this.collidableLayout[relativeCoords[1] - 1][relativeCoords[0]] == 1) {
                    console.log("cannot move through solid object")
                    return
                }

                this.positions[characterName][1] -= 1;
                const verticalCoord = this.realCoord(0, this.positions[characterName][1])[1]; // putting 0 in as the y value bc it doesn't matter

                this.tweens.add({
                    targets: character,  
                    y: verticalCoord, 
                    duration: this.delay[characterName],         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        character.anims.play(characterName + '-up');
                    },
                    onUpdate: (tween: Phaser.Tweens.Tween) => {
                        const relativeCoords = this.getPlayerCoords(characterName);
                        if (this.collidableLayout[relativeCoords[1]][relativeCoords[0]] == 1) {
                            tween.stop();
                        }
                    },
                    onComplete: () => {
                        if (characterName !== "player") {
                            character.anims.play(characterName + '-still-up')
                        } 
                    }
                });
                break;}
            case "down": {
                if (character.y + 50 >= this.bgHeight/2) {
                    console.log("player out of bounds")
                    return
                }

                if (this.collidableLayout[relativeCoords[1] + 1][relativeCoords[0]] == 1) {
                    console.log("cannot move through solid object")
                    return
                }

                this.positions[characterName][1] += 1;
                const verticalCoord = this.realCoord(0, this.positions[characterName][1])[1]; // putting 0 in as the y value bc it doesn't matter
                
                this.tweens.add({
                    targets: character,  
                    y: verticalCoord, 
                    duration: this.delay[characterName],         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        character.anims.play(characterName + '-down');
                    },
                    onUpdate: (tween: Phaser.Tweens.Tween) => {
                        const relativeCoords = this.getPlayerCoords(characterName);
                        // const nextX = character.x
                        // const nextY = character.y + 300
                        // const nextRelativePosition = this.relativeCoord(nextX, nextY)
                        if (this.collidableLayout[relativeCoords[1]][relativeCoords[0]] == 1) {
                            tween.stop();
                        }
                    },
                    onComplete: () => {
                        if (characterName !== "player") {
                            character.anims.play(characterName + '-still-down')
                        } 
                    }
                });
                break;}
        }
    
    }

    // encodes random movement of NPCs
    startMovingNPC(character: Phaser.Physics.Arcade.Sprite, characterName: string) {
        if (this.npcMoveEvents[characterName]) return;

        this.npcMoveEvents[characterName] = this.time.addEvent({
            delay: this.delay[characterName]*3,
            loop: true,
            callback: () => {
                // randomized movement implemented here
                const actionList = ["left", "right", "up", "down"]
                const listSize = actionList.length
                const randomIndex = Math.floor(Math.random()*listSize)
                const randomAction = actionList[randomIndex]

                this.moveCharacter(randomAction, character, characterName);
                // character.anims.play(characterName + '-still')
            }
        })
    }

    stopMovingNPC(character: string) {
        if (this.npcMoveEvents[character]) {
            this.npcMoveEvents[character].remove();
            this.npcMoveEvents[character] = null; // not sure why this error pops up, since it clearly works
        }
    }

    handleNPCNearPlayer(characterName: string) {
        const inProximity = this.checkProximity(this.positions[characterName], this.positions["player"]);

        const opposites: Record<string, string> = {
            "left": "right",
            "right": "left",
            "up": "down",
            "down": "up"
        }

        if (inProximity) {
            this.closeToNPC = true;
            this.stopMovingNPC(characterName);
            const relativePosition = this.checkRelativePosition(this.positions[characterName], this.positions["player"]);
            this.characters[characterName].anims.play(characterName + '-still-' + relativePosition);
            this.player.anims.play("player-still-" + opposites[relativePosition]);
        } else {
            this.closeToNPC = false;
            this.startMovingNPC(this.characters[characterName], characterName);
        }
    }

    checkProximity(npcPosition: [number, number], playerPosition: [number, number]) {
        const npcX = npcPosition[0];
        const npcY = npcPosition[1];
        const playerX = playerPosition[0];
        const playerY = playerPosition[1];

        const xDifference = npcX - playerX
        const yDifference = npcY - playerY

        if (Math.max(xDifference, -xDifference) <= 1 && Math.max(yDifference, -yDifference) <= 1) {
            return true;
        } else {
            return false;
        }
    }

    // check the relative position of the player to the NPC (assuming player is within 1 tile of the NPC)
    // a value of "left" means the player is on the left side of the NPC
    checkRelativePosition(npcPosition: [number, number], playerPosition: [number, number]) {
        const npcX = npcPosition[0];
        const npcY = npcPosition[1];
        const playerX = playerPosition[0];
        const playerY = playerPosition[1];

        if (npcX > playerX) {
            return "left"
        } else if (npcX < playerX) {
            return "right"
        } else if (npcY > playerY) {
            return "up"
        } else if (npcY < playerY) {
            return "down"
        } else {
            return "left"
        }
    }

    startMoving(direction: string) {
        if (this.moveEvent) return;

        this.moveEvent = this.time.addEvent({
            delay: this.delay["player"],
            loop: true,
            callback: () => {
                this.moveCharacter(direction, this.player, "player");
            }
            
        })
    }

    // only for the main player
    stopMoving(character: string) {
        if (this.moveEvent) {
            this.moveEvent.remove(); // Stop the movement loop
            this.moveEvent = null;
        }
        if (this.mostRecentPlayerMove && !this.closeToNPC) this.player.anims.play(character + '-still-' + this.mostRecentPlayerMove);
    }
}
