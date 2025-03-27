import Phaser from "phaser";
import Player from "./Player";

export default class GameScene extends Phaser.Scene {
    private bg!: Phaser.GameObjects.Image;
    // private player!: Phaser.Physics.Arcade.Sprite; // TODO: replace with custom Player object?
    private player!: Player;
    private player_oldman!: Phaser.Physics.Arcade.Sprite; // TODO: remove?
    private characters: Record<string, Phaser.Physics.Arcade.Sprite> = {}; // TODO: will need this here & need to fix the type,
                                                                           // since it should be Character, a parent type of 
                                                                           // Player and NPC
    // keys
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
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
    private positions: Record<string, [number, number]> = {}; // TODO: keep here, pass in
    private spawnX: number = 21; // Default X TODO: will need this here
    private spawnY: number = 15; // Default Y TODO: will need this here
    private npcMoveEvents: Record<string, Phaser.Time.TimerEvent> = {};     // TODO: transfer
    // "center" coordinates (because (0,0) isn't really the "center" of this scene) (in real coordinates)
    private centerX!: integer; // TODO: will need to duplicate this potentially?
    private centerY!: integer; // TODO: ^
    // music
    private backgroundMusic!: Phaser.Sound.BaseSound;
    private playlist: string[] = ["intro", "trap", "loser", "from-eden"];
    private currSong: integer = 0;
    // character movement
    private delay: Record<string, number> = {"player_oldman": 600}; // TODO: keep this here, pass in, edit in player class upon init
    // layout
    //      Legend
    //      1: tree
    //      2: path
    //      3: bush
    //      4: white flower
    //      5: red and white flower
    //      6: red flower
    //      7: nice bush
    //      8: flowerbed
    //      9: short tree
    //      10: rocks
    //      11: house #1
    //      12: house #2
    private layout!: number[][];

    // table that tracks which locations on the map can trigger a new scene - which locations the player can "enter" a new location,
    // as well as which scene a certain location can trigger
    //      Legend
    //      0: not enterable
    //      1: HomeScene
    private enterable: number[][] = new Array(this.dimension).fill(null).map(() => new Array(this.dimension).fill(0)); // TODO: keep here, pass in

    // table that tracks collidable objects
    //      Legend
    //      0: nothing - player can pass through
    //      1: something - player cannot pass through
    public collidableLayout: number[][] = new Array(this.dimension).fill(null).map(() => new Array(this.dimension).fill(0)); // TODO: keep here, pass in

    // initialize our scene
    constructor() {
        super("GameScene");
    }

    // spawns the character at a specified location on the map (in relative coordinates)
    init(data: { x: number, y: number }) {
        if (data.x !== undefined && data.y !== undefined) {
            this.spawnX = data.x;
            this.spawnY = data.y;
        }
    }

    // load the assets
    preload() {
        // this.load.setBaseURL('https://cdn.phaserfiles.com/v385');
        this.load.image("background", "/assets/bg.png");
        this.load.spritesheet("player", "/assets/players/player.png", { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet("player_oldman", "/assets/players/player_oldman.png", { frameWidth: 32, frameHeight: 48 });
        this.load.image("tree", "/assets/tree.png");
        this.load.image("tree-short", "/assets/tree_short.png");
        this.load.image("bush", "/assets/bush.png");
        this.load.image("flower-white", "/assets/flower_white.png");
        this.load.image("flower-redwhite", "/assets/flower_redwhite.png");
        this.load.image("flower-red", "/assets/flower_red.png");
        this.load.image("nice-bush", "/assets/nice_bush.png");
        this.load.image("flowerbed", "/assets/flowerbed.png");
        this.load.image("rocks", "/assets/rocks.png");
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
        this.load.image("path-end-left", "/assets/paths/path_end_left.png");
        this.load.image("path-end-up", "/assets/paths/path_end_up.png");
        this.load.image("path-end-right", "/assets/paths/path_end_right.png");
        this.load.image("path-end-down", "/assets/paths/path_end_down.png");
        this.load.image("path-right-tl", "/assets/paths/path_right_tl.png");
        this.load.image("path-right-bl", "/assets/paths/path_right_bl.png");
        this.load.image("path-left-tr", "/assets/paths/path_left_tr.png");
        this.load.image("path-left-br", "/assets/paths/path_left_br.png");
        this.load.image("path-up-br", "/assets/paths/path_up_br.png");
        this.load.image("path-up-bl", "/assets/paths/path_up_bl.png");
        this.load.image("path-down-tr", "/assets/paths/path_down_tr.png");
        this.load.image("path-down-tl", "/assets/paths/path_down_tl.png");
        // buildings
        this.load.image("house-1", "/assets/house_1.png");
        this.load.image("house-2", "/assets/house_2.png");
        // music
        this.load.audio('bgMusic', 'assets/audio/intro.mp3');
        this.load.audio('trap', 'assets/audio/trap.mp3');
        this.load.audio('loser', 'assets/audio/loser.mp3');
        this.load.audio('from-eden', 'assets/audio/from-eden.mp3');

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
        this.setUpWorld();
        
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
        secondCamera.setZoom(0.2); // Zoom out
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
            this.input.keyboard.on('keydown-M', () => {
                this.backgroundMusic.stop();
                this.currSong = (this.currSong + 1) % this.playlist.length;
                const nextSong = this.playlist[this.currSong];
                this.backgroundMusic = this.sound.add(nextSong, {loop:true, volume: 0.5});
                this.backgroundMusic.play();
            });
        }

        this.input.manager.enabled = true;
    }

    update() {
        this.player.setVelocity(0); // TODO: wtf is this
        this.player.update();
        // update coordinates
        const relativeCoords = this.player.getPlayerCoords("player");
        this.xCoord.setText("X: " + Math.floor(relativeCoords[0]));
        this.yCoord.setText("Y: " + Math.floor(relativeCoords[1]));

        // this.startMovingNPC("player_oldman")
        // this.handleNPCNearPlayer("player_oldman");

        // zoom functionality using + and - symbols
        if (this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS).isDown) {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + 0.03, 0.1, 2));
        }
        if (this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS).isDown) {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - 0.03, 0.1, 2));
        }

        // allow player to enter different scenes if at the correct location and if triggered
        this.handleScenes();
    }

    // Positions in relative coordinates
    addCharacter(positionX: number, positionY: number, name: string) {
        const realCoord = this.realCoord(positionX, positionY);

        const boundRealCoord = this.realCoord.bind(this)
        const boundRelativeCoord = this.relativeCoord.bind(this)

        const player = new Player(this, realCoord[0], realCoord[1], name, this.positions, this.delay, this.characters, 
            this.collidableLayout, boundRealCoord, boundRelativeCoord, this.bgWidth, this.bgHeight);
        // const player = this.physics.add.sprite(realCoord[0], realCoord[1], name); // replace this with our 
        this.positions[name] = [positionX, positionY]; // need to track character's position in the current map
        this.characters[name] = player; // need to keep track of character object

        // this.createAnims(name);

        return player;
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
        this.placePath();
        this.placeTreesAndFlowerbeds();
        this.placeLayout();

        this.player = this.addCharacter(this.spawnX, this.spawnY, "player");
        this.player.anims.play("player-still-down"); // TODO: figure out how to make the player face down upon respawning
        // this.player_oldman = this.addCharacter(38, 38, "player_oldman");
        // this.player.setCollideWorldBounds(true);
    }

    handleScenes() {
        const currCoord = this.player.getPlayerCoords("player");
        // TODO: edit the line below so that can do this.enterable[x][y] instead of [y][x] (more intuitive)
        if (this.enterable[currCoord[1]][currCoord[0]] !== 0) {
            if (!this.input.keyboard) return;
            this.input.keyboard.on("keydown-ENTER", () => {
                this.backgroundMusic.pause();
                this.scene.start("HomeScene")
            })
        }
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

    placeTreesAndFlowerbeds() {
        for (let i = 1; i  + 1< this.dimension; i += 2) {
            for (let j = 1; j + 1< this.dimension; j += 2) {
                if (this.layout[j][i] == 1) {
                    this.placeImage(i, j, "tree");
                    this.collidableLayout[j][i + 1] = 1;
                    this.collidableLayout[j][i] = 1;
                    this.collidableLayout[j + 1][i + 1] = 1;
                    this.collidableLayout[j + 1][i] = 1;
                } else if (this.layout[j][i] == 8) {
                    this.placeImage(i, j, "flowerbed");
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
                } else if (!up && !down && left && right) {
                    this.placeImage(i, j, "path-hor");
                } else if (!right && !left && up && down) {
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
                        } else if (!left && !down && !bl) {
                            this.placeImage(i, j, "path-bl");
                        } else if (!tr && !left && down && br) {
                            this.placeImage(i, j, "path-left-tr");
                        } else if (tr && !left && down && !br) {
                            this.placeImage(i, j, "path-left-br");
                        } else if (!tr && left && !down && tl) {
                            this.placeImage(i, j, "path-down-tr");
                        } else if (tr && left && !down && !tl) {
                            this.placeImage(i, j, "path-down-tl");
                        }
                    } else if (!right) {
                        if (left && down && !tl && !bl) {
                            this.placeImage(i, j, "path-3-left");
                        } else if (left && !down && !tl) {
                            this.placeImage(i, j, "path-br");
                        } else if (left && down && bl && tl) {
                            this.placeImage(i, j, "path-mid-right");
                        } else if (left && !down && tl && !br) {
                            this.placeImage(i, j, "path-mid-br");  
                        } else if (!left && !down) {
                            this.placeImage(i, j, "path-end-down");
                        } else if (!tl && left && down && bl) {
                            this.placeImage(i, j, "path-right-tl");
                        } else if (tl && left && down && !bl) {
                            this.placeImage(i, j, "path-right-tl");
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
                        } else if (!down && !left) {
                            this.placeImage(i, j, "path-end-left");
                        } else if (bl && left && down && !br) {
                            this.placeImage(i, j, "path-up-br");
                        } else if (!bl && left && down && br) {
                            this.placeImage(i, j, "path-up-bl");
                        }
                    } else if (!right) {
                        if (left && down && !bl) {
                            this.placeImage(i, j, "path-tr");
                        } else if (left && down && bl && !tr) {
                            this.placeImage(i, j, "path-mid-tr");
                        } else if (!left && down) {
                            this.placeImage(i, j, "path-end-up");
                        } else if (left && !down) {
                            this.placeImage(i, j, "path-end-right");
                        }
                    }
                } 
            }
        }
    }

    placeLayout() {
        for (let i = 0; i < this.dimension; i++) {
            for (let j = 0; j < this.dimension; j++) {
                if (this.layout[j][i] == 3) {
                    this.placeImage(i, j, "bush");
                } else if (this.layout[j][i] == 4) {
                    this.placeImage(i, j, "flower-white");
                } else if (this.layout[j][i] == 5) {
                    this.placeImage(i, j, "flower-redwhite");
                } else if (this.layout[j][i] == 6) {
                    this.placeImage(i, j, "flower-red");
                } else if (this.layout[j][i] == 7) {
                    this.placeImage(i, j, "nice-bush");
                } else if (this.layout[j][i] == 9) {
                    this.placeImage(i, j, "tree-short");
                } else if (this.layout[j][i] == 10) {
                    this.placeImage(i, j, "rocks");
                } else if (this.layout[j][i] == 11 && this.layout[j - 1][i] != 11 && this.layout[j][i - 1] != 11) {
                    this.placeImage(i, j, "house-1");
                    
                    this.collidableLayout[j ][i + 1] = 1;
                    this.collidableLayout[j ][i] = 1;
                    this.collidableLayout[j ][i + 2] = 1;
                    this.collidableLayout[j + 1][i + 1] = 1;
                    this.collidableLayout[j + 1][i] = 1;
                    this.collidableLayout[j + 1][i + 2] = 1;

                    this.enterable[j + 2][i + 1] = 1;
                } else if (this.layout[j][i] == 12 && this.layout[j - 1][i] != 12 && this.layout[j - 1][i] != 12) {
                    this.placeImage(i, j, "house-2");
                    
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
        const xShift = (image.width > this.cellWidth) ? (this.cellWidth/2)/image.width : 0.5;
        const yShift = (image.height > this.cellHeight) ? (this.cellHeight/2)/image.height : 0.5;
        image.setOrigin(xShift,yShift);
        return image;
    }

    // // encodes random movement of NPCs
    // startMovingNPC(characterName: string) {
    //     if (this.npcMoveEvents[characterName]) return;

    //     this.npcMoveEvents[characterName] = this.time.addEvent({
    //         delay: this.delay[characterName]*5,
    //         loop: true,
    //         callback: () => {
    //             // randomized movement implemented here
    //             const actionList = ["left", "right", "up", "down"]
    //             const listSize = actionList.length
    //             const randomIndex = Math.floor(Math.random()*listSize)
    //             const randomAction = actionList[randomIndex]

    //             this.moveCharacter(randomAction, characterName);
    //             // character.anims.play(characterName + '-still')
    //         }
    //     })
    // }

    // stopMovingNPC(character: string) {
    //     if (this.npcMoveEvents[character]) {
    //         this.npcMoveEvents[character].remove();
    //         this.npcMoveEvents[character] = null; // not sure why this error pops up, since it clearly works
    //     }
    // }

    // handleNPCNearPlayer(characterName: string) {
    //     const inProximity = this.checkProximity(this.positions[characterName], this.positions["player"]);

    //     const opposites: Record<string, string> = {
    //         "left": "right",
    //         "right": "left",
    //         "up": "down",
    //         "down": "up"
    //     }

    //     if (inProximity) {
    //         this.player.closeToNPC = true;
    //         this.stopMovingNPC(characterName);
    //         const relativePosition = this.checkRelativePosition(this.positions[characterName], this.positions["player"]);
    //         this.characters[characterName].anims.play(characterName + '-still-' + relativePosition);
    //         this.player.anims.play("player-still-" + opposites[relativePosition]);
    //     } else {
    //         this.player.closeToNPC = false;
    //         this.startMovingNPC(characterName);
    //     }
    // }

    // checkProximity(npcPosition: [number, number], playerPosition: [number, number]) {
    //     const npcX = npcPosition[0];
    //     const npcY = npcPosition[1];
    //     const playerX = playerPosition[0];
    //     const playerY = playerPosition[1];

    //     const xDifference = npcX - playerX
    //     const yDifference = npcY - playerY

    //     if (Math.max(xDifference, -xDifference) <= 1 && Math.max(yDifference, -yDifference) <= 1) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }

    // // check the relative position of the player to the NPC (assuming player is within 1 tile of the NPC)
    // // a value of "left" means the player is on the left side of the NPC
    // checkRelativePosition(npcPosition: [number, number], playerPosition: [number, number]) {
    //     const npcX = npcPosition[0];
    //     const npcY = npcPosition[1];
    //     const playerX = playerPosition[0];
    //     const playerY = playerPosition[1];

    //     if (npcX > playerX) {
    //         return "left"
    //     } else if (npcX < playerX) {
    //         return "right"
    //     } else if (npcY > playerY) {
    //         return "up"
    //     } else if (npcY < playerY) {
    //         return "down"
    //     } else {
    //         return "left"
    //     }
    // }
}
