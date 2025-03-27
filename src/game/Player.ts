import Phaser from "phaser"

export default class Player extends Phaser.Physics.Arcade.Sprite {
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private positions: Record<string, [number, number]> = {};
    private characters: Record<string, Phaser.Physics.Arcade.Sprite>; // store the player & NPCs in the current scene
    private arrows: string[] = [];
    private moveEvent: Phaser.Time.TimerEvent | null = null;
    private delay: number = 200;
    private mostRecentPlayerMove!: string;
    public closeToNPC: boolean = false;
    private collidableLayout: number[][];
    private realCoord: (relativeX: integer, relativeY: integer) => number[];
    private relativeCoord: (relativeX: integer, relativeY: integer) => number[];
    private bgWidth: integer;
    private bgHeight: integer;

    constructor(scene: Phaser.Scene, x: number, y: number, characterName: string, positions: Record<string, [number, number]>, 
        delay: Record<string, number>, characters: Record<string, Phaser.Physics.Arcade.Sprite>, collidableLayout: number[][],
        realCoord: (relativeX: integer, relativeY: integer) => number[], relativeCoord: (relativeX: integer, relativeY: integer,) => number[],
        bgWidth: integer, bgHeight: integer) {

        super(scene, x, y, characterName);

        // add to the scene (using .existing since we're adding an existing character, 
        // whereas we'd sometimes create the character and add them to the scene at the same time)
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // physics
        this.setCollideWorldBounds(true);

        // animations
        this.createAnims(characterName);

        // delay
        delay["characterName"] = this.delay;

        this.positions = positions;
        this.characters = characters;
        this.collidableLayout = collidableLayout;
        this.realCoord = realCoord;
        this.relativeCoord = relativeCoord;
        this.bgWidth = bgWidth;
        this.bgHeight = bgHeight;

        // input handling
        if (scene.input.keyboard) {
            this.cursors = scene.input.keyboard.createCursorKeys();
        }
    }

    init() {
        // not sure what to put here
    }

    create() {
        // not sure what to put here
    }

    update() {
        console.log(`Player position: x=${this.x}, y=${this.y}`);

        // handle initial arrow click (without this section, there's a pause before player moves)
        if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
            this.stopMoving("player");
            this.moveCharacter('right', "player")
            this.mostRecentPlayerMove = "right"
            this.arrows.shift()
            this.arrows.push("right")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
            this.stopMoving("player");
            this.moveCharacter('left', "player")
            this.mostRecentPlayerMove = "left"
            this.arrows.shift()
            this.arrows.push("left")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
            this.stopMoving("player");
            this.moveCharacter('up', "player")
            this.mostRecentPlayerMove = "up"
            this.arrows.shift()
            this.arrows.push("up")
        } else if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) {
            this.stopMoving("player");
            this.moveCharacter('down', "player")
            this.mostRecentPlayerMove = "down"
            this.arrows.shift()
            this.arrows.push("down")
        }

        // handle arrow key "press-and-hold"
        this.handleMovement();
    }

    // returns the player's relative coordinates
    getPlayerCoords(characterName: string): [number, number] {
        return this.positions[characterName];
    }

    // HARD ASSUMPTION: the character must have 16 frames, 4 per direction (in the order: down, left, right, and up)
    createAnims(character: string) {
        this.scene.anims.create({
            key: character + "-left",
            frames: this.anims.generateFrameNumbers(character, { start: 4, end: 7 }),
            frameRate: 10,
            repeat: -1
        });
        this.scene.anims.create({
            key: character + "-right",
            frames: this.anims.generateFrameNumbers(character, { start: 8, end: 11 }),
            frameRate: 10,
            repeat: -1
        });  
        this.scene.anims.create({
            key: character + "-down",
            frames: this.anims.generateFrameNumbers(character, { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
        this.scene.anims.create({
            key: character + "-up",
            frames: this.anims.generateFrameNumbers(character, { start: 12, end: 15 }),
            frameRate: 10,
            repeat: -1
        });
        this.scene.anims.create({
            key: character + "-still-down",
            frames: [{key: character, frame: 0}],
            frameRate: 10,
            repeat: -1
        });
        this.scene.anims.create({
            key: character + "-still-up",
            frames: [{key: character, frame: 12}],
            frameRate: 10,
            repeat: -1
        });
        this.scene.anims.create({
            key: character + "-still-left",
            frames: [{key: character, frame: 4}],
            frameRate: 10,
            repeat: -1
        });
        this.scene.anims.create({
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

    startMoving(direction: string) {
        if (this.moveEvent) return;

        this.moveEvent = this.scene.time.addEvent({
            delay: this.delay,
            loop: true,
            callback: () => {
                this.moveCharacter(direction, "player");
            }
            
        })
    }

    stopMoving(character: string) {
        if (this.moveEvent) {
            this.moveEvent.remove(); // Stop the movement loop
            this.moveEvent = null;
        }
        if (this.mostRecentPlayerMove && !this.closeToNPC) this.anims.play(character + '-still-' + this.mostRecentPlayerMove);
    }

    // helper for actually moving the player
    moveCharacter(direction: string, characterName: string) {
        const relativeCoords = this.getPlayerCoords(characterName); 
        const character = this.characters[characterName];

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

                this.scene.tweens.add({
                    targets: this,  
                    x: horizontalCoord, 
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.anims.play(characterName + '-left');
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
                            this.anims.play(characterName + '-still-left')
                        }
                    }
                });
                break;}
            case "right": {
                if (this.x + 50 >= this.bgWidth/2) {
                    console.log("player out of bounds");
                    return
                }

                if (this.collidableLayout[relativeCoords[1]][relativeCoords[0] + 1] == 1) {
                    console.log("cannot move through solid object")
                    return
                }

                this.positions[characterName][0] += 1
                const horizontalCoord = this.realCoord(this.positions[characterName][0], 0)[0]; // putting 0 in as the y value bc it doesn't matter

                this.scene.tweens.add({
                    targets: this,  
                    x: horizontalCoord,
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.anims.play(characterName + '-right');
                    },
                    onUpdate: (tween: Phaser.Tweens.Tween) => {
                        const relativeCoords = this.getPlayerCoords(characterName);
                        if (this.collidableLayout[relativeCoords[1]][relativeCoords[0]] == 1) {
                            tween.stop();
                        }
                    },
                    onComplete: () => {
                        if (characterName !== "player") {
                            this.anims.play(characterName + '-still-right')
                        }
                    }
                });
                break;}
            case "up": {    
                if (this.y - 50 < -this.bgHeight/2 + window.innerHeight) {
                    console.log("player out of bounds")
                    return
                }

                if (this.collidableLayout[relativeCoords[1] - 1][relativeCoords[0]] == 1) {
                    console.log("cannot move through solid object")
                    return
                }

                this.positions[characterName][1] -= 1;
                const verticalCoord = this.realCoord(0, this.positions[characterName][1])[1]; // putting 0 in as the y value bc it doesn't matter

                this.scene.tweens.add({
                    targets: this,  
                    y: verticalCoord, 
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.anims.play(characterName + '-up');
                    },
                    onUpdate: (tween: Phaser.Tweens.Tween) => {
                        const relativeCoords = this.getPlayerCoords(characterName);
                        if (this.collidableLayout[relativeCoords[1]][relativeCoords[0]] == 1) {
                            tween.stop();
                        }
                    },
                    onComplete: () => {
                        if (characterName !== "player") {
                            this.anims.play(characterName + '-still-up')
                        } 
                    }
                });
                break;}
            case "down": {
                if (this.y + 50 >= this.bgHeight/2) {
                    console.log("player out of bounds")
                    return
                }

                if (this.collidableLayout[relativeCoords[1] + 1][relativeCoords[0]] == 1) {
                    console.log("cannot move through solid object")
                    return
                }

                this.positions[characterName][1] += 1;
                const verticalCoord = this.realCoord(0, this.positions[characterName][1])[1]; // putting 0 in as the y value bc it doesn't matter
                
                this.scene.tweens.add({
                    targets: this,  
                    y: verticalCoord, 
                    duration: this.delay,         
                    ease: 'Linear',        
                    repeat: 0,             
                    yoyo: false,
                    onStart: () => {
                        this.anims.play(characterName + '-down');
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
                            this.anims.play(characterName + '-still-down')
                        } 
                    }
                });
                break;}
        }
    
    }
}