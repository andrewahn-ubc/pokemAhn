import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
    private loadingText!: Phaser.GameObjects.Text;
    private bg!: Phaser.GameObjects.Image;
    private player!: Phaser.Physics.Arcade.Sprite;
    // NPCs
    private npc_text: Record<string, Phaser.GameObjects.Text | undefined> = {};
    private npc_textbox!: Phaser.GameObjects.Image;
    private npc_convo_started = false;
    private npc_currently_talking = "";
    private npc_started_convo = true;
    private npc_convos: Record<string, string[]> = {};
    private npc_convo_starter: Record<string, string> = {};
    private npc_prompts: Record<string, string> = {};
    private player_text!: Phaser.GameObjects.Text | undefined;
    private player_textbox!: Phaser.GameObjects.Image;
    private player_text_created = false;  // track if we've already created it
    private player_text_active = false;
    private keyboardListenerAdded = false;
    private dialogueWidth = 200;
    private characters: Record<string, Phaser.Physics.Arcade.Sprite> = {};
    private closeToNPC: boolean = false;
    // keys
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private spaceKey!: Phaser.Input.Keyboard.Key;
    private enterKey!: Phaser.Input.Keyboard.Key;
    private arrows: string[] = [];
    private wasEnterPressed = false;
    // background dimensions
    private bgWidth!: integer;
    private bgHeight!: integer;
    // for displaying the coordinates
    private xCoord!: Phaser.GameObjects.Text;
    private yCoord!: Phaser.GameObjects.Text;
    // for subtitle instructions
    private subtitles!: Phaser.GameObjects.Text;
    // the background is divided into a n x n grid full of cells
    private dimension = 80; // the background has to be square
    private cellWidth!: integer;
    private cellHeight!: integer; 
    // number of moves made in the horizontal and vertical directions (right and bottom are +ve)
        // the tuple contains the corresponding player's relative coordinates
    private positions: Record<string, [number, number]> = {};
    private mostRecentPlayerMove!: string;
    private moveEvent: Phaser.Time.TimerEvent | null = null;
    private npcMoveEvents: Record<string, Phaser.Time.TimerEvent | null> = {};
    private delay: Record<string, number> = {};
    private npcTickSpeed: integer = 4;
    private instructionZone: [[number, number], [number, number]] = [[0,0],[0,0]]; // [top left corner, bottom right corner]
    // "center" coordinates (because (0,0) isn't really the "center" of this scene) (in real coordinates)
    private centerX!: integer;
    private centerY!: integer;
    // music
    private backgroundMusic!: Phaser.Sound.BaseSound;
    private playlist: string[] = ["bgMusic", "wouldthati", "why", "mistake", "1036", "wurli", "baby", "spacecadet", "thnkfast"];
    private nextSongIndex = 0;
    
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
    // table that tracks collidable objects
    //      Legend
    //      0: nothing - player can pass through
    //      1: something - player cannot pass through
    private collidableLayout: number[][] = new Array(this.dimension).fill(null).map(() => new Array(this.dimension).fill(0));

    async sendDialogueRequest(prompt: string) {
        try {
            const response = await fetch("https://pokemahn-api.top/", {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({ prompt }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            return data.response;
        } catch (error: unknown) {
            let sliceIndex = 0;
            for (let i = prompt.length - 1; i >= 0; i--) {
                if (prompt[i] == " ") {
                    sliceIndex = i
                    console.log(prompt[i])
                    break;
                }
            }
            return prompt.slice(0, sliceIndex + 1) + "Oops. I'll have to get back to you later. Andrew's fetch request failed."
        }
    }

    // initialize our scene
    constructor() {
        super("GameScene");
    }

    // load the assets

    preload() {
        // show loading scene
        this.cameras.main.setBackgroundColor("#000000");
        const {width, height} = this.scale
        this.loadingText = this.add.text(width/2, height/2, "loading PokemAhn...", {
            "fontSize": "24px",
            color: "white"
        })
        this.loadingText.setOrigin(0.5, 0.5);
        // background
        this.load.image("background", "/assets/bg.png");
        // characters
        this.load.spritesheet("player", "/assets/players/player.png", { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet("Piplup", "/assets/players/pokemon_piplup.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("Turtwig", "/assets/players/pokemon_turtwig.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("Chimchar", "/assets/players/pokemon_chimchar.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("Staravia", "/assets/players/pokemon_staravia.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("Pikachu", "/assets/players/pokemon_pikachu.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("Mamoswine", "/assets/players/pokemon_mamoswine.png", { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet("Arceus", "/assets/players/pokemon_arceus.png", { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet("Old Man", "/assets/players/player_oldman.png", { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet("Nurse Joy", "/assets/players/player_nursejoy.png", { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet("Professor Oak", "/assets/players/player_profoak.png", { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet("Dawn", "/assets/players/player_dawn.png", { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet("Boy 1", "/assets/players/player_boy1.png", { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet("Girl 1", "/assets/players/player_girl1.png", { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet("Grandma", "/assets/players/player_grandma.png", { frameWidth: 32, frameHeight: 48 });
        this.load.spritesheet("Baby", "/assets/players/player_baby.png", { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet("Cynthia", "/assets/players/player_cynthia.png", { frameWidth: 48, frameHeight: 48 });
        this.load.spritesheet("Bicycle Kid", "/assets/players/player_bicycle.png", { frameWidth: 48, frameHeight: 48 });
        // mischelaneous
        this.load.image("textbox", "/assets/textbox.png");
        this.load.image("github", "/assets/github-mark.png");
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
        this.load.audio('baby', 'assets/audio/baby-stillwoozy.mp3');
        this.load.audio('mistake', 'assets/audio/mistake-kenititus.mp3');
        this.load.audio('1036', 'assets/audio/1036-beabadoobee.mp3');
        this.load.audio('spacecadet', 'assets/audio/spacecadet-beabadoobee.mp3');
        this.load.audio('thnkfast', 'assets/audio/thinkfast-dominicfike.mp3');
        this.load.audio('why', 'assets/audio/why-dominicfike.mp3');
        this.load.audio('wouldthati', 'assets/audio/wouldthati-hozier.mp3');
        this.load.audio('wurli', 'assets/audio/wurli-dominicfike.mp3');

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
        this.loadingText.text = "" 
        this.centerX = window.innerWidth/2;
        this.centerY = window.innerHeight/2;
        this.setUpWorld();
        // show instructions
        this.add.text(this.centerX - 100, this.centerY,'        ↑\npress ←   → to move\n        ↓', { fontSize: '20px', color: 'black'}).setOrigin(0.5,0.5);
        this.add.text(this.centerX - 100, this.centerY + 50,'press TAB to pause music', { fontSize: '20px', color: 'black'}).setOrigin(0.5,0.5);
        this.add.text(this.centerX - 100, this.centerY + 100,'press 1 to change song', { fontSize: '20px', color: 'black'}).setOrigin(0.5,0.5);
        this.instructionZone[0] = [31,35];
        this.instructionZone[1] = [42,47];
        // character
        this.addCharacter("Old Man", 500, "Welcome, traveler. What brings you to our town?", "You are an old man NPC in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hello\nOld Man: Welcome traveler.\nPlayer: Thank you\n");
        this.addCharacter("Nurse Joy", 350, "Hi! Are your pokemon doing alright?", "You are a young female nurse NPC in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi!\nNurse Joy: Welcome to our town!!\nPlayer: Thank you!\n");
        this.addCharacter("Professor Oak", 400, "Hey there, kid. Which pokemon would you like to choose?", "You are a middle-aged, male, Pokémon professor NPC in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nProfessor Oak: Welcome, kid.\nPlayer: Thank you\n");
        this.addCharacter("Piplup", 200, "I love bubbles.", "You are a water-type Penguine-based baby Pokemon NPC named Piplup in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nPiplup: I love water.\nPlayer: Nice to meet you!\n");
        this.addCharacter("Chimchar", 220, "OOH OOH AH AH FIRE.", "You are a fire-type Monkey-based baby Pokemon NPC named Chimchar in a Pokémon-style game. Speak cheerily and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nChimchar: I love fire.\nPlayer: Nice to meet you!\n");
        this.addCharacter("Turtwig", 305, "Do you like the twig on my head?", "You are a turtle-based grass-type baby Pokemon NPC named Turtwig in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nTurtwig: I love leaves.\nPlayer: You are so cute!\n");
        this.addCharacter("Staravia", 50, "Chirp", "You are a flying-type bird-based Pokemon NPC named Staravia in a Pokémon-style game. Speak cheerily and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nStaravia: I love flying.\nPlayer: Nice to meet you!\n");
        this.addCharacter("Pikachu", 200, "Pika pika!", "You are a lightning-type rat-based Pokemon NPC named Pikachu in a Pokémon-style game. Speak cheerily and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nPikachu: I'm gonna try my best today.\nPlayer: You're awesome!\n");
        // this.addCharacter("Mamoswine", 600, "I'm a mammoth lol.", "You are a Ice/Ground-type Mammoth-based adult Pokemon NPC named Mamoswine in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nMamoswine: I'm so big.\nPlayer: You are so big!\n");
        // this.addCharacter("Arceus", 700, "The time has come! Prepare for justice.", "You are a Pokemon God NPC named Arceus in a Pokémon-style game, and you created the entire universe. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nArceus: I'm a God.\nPlayer: You are amazing.\n");
        this.addCharacter("Dawn", 300, "Hey! Let's go train together.", "You are a teenage girl Pokemon trainer in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nDawn: Hi!!.\nPlayer: Let's be friends.\n");
        this.addCharacter("Boy 1", 280, "2018 LeBron is the most complete basketball player of all time.", "You are a young boy NPC in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi\nBoy 1: What's up?\nPlayer: Not much.\n");
        this.addCharacter("Girl 1", 350, "The sky is so pretty today.", "You are a young girl NPC in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi little girl.\nGirl 1: I miss my mommy.\nPlayer: I'm sorry little girl.\n");
        this.addCharacter("Grandma", 420, "I'm going home. My cats need me.", "You are an old woman NPC in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi grandma, what are you doing?\nGrandma: I'm on my way home.\nPlayer: I see, have a good day.\n");
        this.addCharacter("Baby", 100, "Goo goo gah gah lol.", "You are a baby NPC in a Pokémon-style game. Speak warmly and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi baby, what's your name?\nBaby: Goo goo gah gah lol.\nPlayer: I see, have a good day.\n");
        this.addCharacter("Cynthia", 310, "The history here is truly fascinating.", "You are a expert female Pokemon trainer in a Pokémon-style game. Speak confidently and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi, could we have a pokemon battle?\nCynthia: I would never waste my time on you.\nPlayer: I see, have a good day.\n");
        this.addCharacter("Bicycle Kid", 200, "You could never beat me in a Pokemon battle. I'm goated.", "You are a boy riding a bicycle in a Pokémon-style game, and you train pokemon too. Speak confidently and briefly.\nReply with a friendly sentence of 5–10 words. \nPlayer: Hi, could we have a pokemon battle?\nBicycle Kid: You don't stand a chance against me.\nPlayer: We'll have to find out.\n");
        this.player = this.addCharacter("player", 200, "", "", 38, 43);
        this.player.setCollideWorldBounds(true);
        
        // coordinates
        this.xCoord = this.add.text(20,20,'X: 0', { fontSize: '20px', color: '#fff', backgroundColor: '#000000',});
        this.xCoord.setScrollFactor(0);
        this.yCoord = this.add.text(20,40,'Y: 0', { fontSize: '20px', color: '#fff', backgroundColor: '#000000', });
        this.yCoord.setScrollFactor(0);

        // subtitle instructions for the user
        this.subtitles = this.add.text(this.centerX, this.centerY + 300, "", { fontSize: '18px', color: 'black', backgroundColor: "white"})
        this.subtitles.setScrollFactor(0)
        this.subtitles.setOrigin(0.5, 0.5)

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
            this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
            this.spaceKey.on('down', () => {
                if (this.backgroundMusic.isPlaying) {
                    this.backgroundMusic.pause();
                } else {
                    this.backgroundMusic.resume();
                }
            });
            this.cursors = this.input.keyboard.createCursorKeys();
            this.input.keyboard.on('keydown', (event: KeyboardEvent) => {
                if (event.key === '1') {  
                    this.backgroundMusic.stop();
                    this.nextSongIndex = (this.nextSongIndex + 1) % this.playlist.length
                    this.backgroundMusic = this.sound.add(this.playlist[this.nextSongIndex], { loop: true, volume: 0.5 });
                    this.backgroundMusic.play();
                }
            });
        }

        // for handling conversations
        if (this.input.keyboard) {
            this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        }
    }

    // Positions in relative coordinates
    addCharacter(name: string, delay: number, convo_starter: string, prompt: string, positionX?: number, positionY?: number) {
        let realCoord = [0,0]

        if (positionX == undefined || positionY == undefined) {
            const [positionX, positionY] = this.generateValidSpawnPoint()
            realCoord = this.realCoord(positionX, positionY);
            this.positions[name] = [positionX, positionY];
        } else {
            realCoord = this.realCoord(positionX, positionY);
            this.positions[name] = [positionX, positionY];
        }

        const player = this.physics.add.sprite(realCoord[0], realCoord[1], name);
        this.characters[name] = player;
        this.createAnims(name);
        this.delay[name] = this.npcTickSpeed*delay;
        if (name === "player") this.delay[name] = delay;
        this.npc_convos[name] = [];
        this.npc_convo_starter[name] = convo_starter;
        this.npc_prompts[name] = prompt;
        return player;
    }

    generateValidSpawnPoint() {
        let foundValidSpawnPoint = false
        let randomX = 0
        let randomY = 0
        
        while (!foundValidSpawnPoint) {
            // randomX = Math.round(Math.random()*this.dimension/2) + this.dimension/4;
            // randomY = Math.round(Math.random()*this.dimension/2) + this.dimension/4;
            randomX = Math.round(Math.random()*this.dimension);
            randomY = Math.round(Math.random()*this.dimension);

            if (randomX < 2 || randomX > 78 || randomY < 2 || randomY > 78) continue

            if (this.instructionZone[0][0] < randomX && randomX < this.instructionZone[1][0] 
                && this.instructionZone[0][1] < randomY && randomY < this.instructionZone[1][1]) {
                continue
            }

            if (this.collidableLayout[randomY][randomX] == 0) {
                foundValidSpawnPoint = true
            }
        }

        return [randomX, randomY]
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
        this.handleNPC("Old Man")
        this.handleNPC("Nurse Joy")
        this.handleNPC("Professor Oak")
        this.handleNPC("Piplup")
        this.handleNPC("Chimchar")
        this.handleNPC("Turtwig")
        this.handleNPC("Staravia")
        this.handleNPC("Pikachu")
        // this.handleNPC("Mamoswine")
        // this.handleNPC("Arceus")
        this.handleNPC("Dawn")
        this.handleNPC("Boy 1")
        this.handleNPC("Girl 1")
        this.handleNPC("Grandma")
        this.handleNPC("Baby")
        this.handleNPC("Cynthia")
        this.handleNPC("Bicycle Kid")
        this.handleNPCsFarFromPlayer()

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

        // zoom functionality using + and - symbols
        if (this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.PLUS).isDown) {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom + 0.03, 0.1, 2));
        }
        if (this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.MINUS).isDown) {
            this.cameras.main.setZoom(Phaser.Math.Clamp(this.cameras.main.zoom - 0.03, 0.1, 2));
        }
    }

    handleNPC(npm_name: string) {
        this.startMovingNPC(npm_name);
        this.handleNPCNearPlayer(npm_name);
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
        this.placeTreesAndFlowerbeds();
        this.placePath();
        this.placeLayout();
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
        const image = this.add.image(realCoords[0], realCoords[1], assetName);
        const xShift = (image.width > this.cellWidth) ? (this.cellWidth/2)/image.width : 0.5;
        const yShift = (image.height > this.cellHeight) ? (this.cellHeight/2)/image.height : 0.5;
        image.setOrigin(xShift,yShift);
        return image;
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
    moveCharacter(direction: string, characterName: string) {
        const relativeCoords = this.getPlayerCoords(characterName); // TODO: abstract to work for any character
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
    startMovingNPC(characterName: string) {
        if (this.npcMoveEvents[characterName]) return;

        this.npcMoveEvents[characterName] = this.time.addEvent({
            delay: this.delay[characterName]*5,
            loop: true,
            callback: () => {
                // randomized movement implemented here
                const actionList = ["left", "right", "up", "down"]
                const listSize = actionList.length
                const randomIndex = Math.floor(Math.random()*listSize)
                const randomAction = actionList[randomIndex]

                this.moveCharacter(randomAction, characterName);
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
        if (this.npc_currently_talking !== characterName && this.npc_convo_started) return
        
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
            this.npc_currently_talking = characterName;
            const relativePosition = this.checkRelativePosition(this.positions[characterName], this.positions["player"]);
            this.characters[characterName].anims.play(characterName + '-still-' + relativePosition);
            this.player.anims.play("player-still-" + opposites[relativePosition]);

            const [npcX, npcY] = this.realCoord(this.positions[characterName][0], this.positions[characterName][1])
            const [playerX, playerY] = this.realCoord(this.positions["player"][0], this.positions["player"][1])
            let npcXOffset = 0
            let npcYOffset = 0
            let playerXOffset = 0
            let playerYOffset = 0

            switch (relativePosition) {
                case "left":
                    npcXOffset = 70
                    npcYOffset = -40
                    playerXOffset = -300
                    playerYOffset = -40
                    break;
                case "right":
                    npcXOffset = -300
                    npcYOffset = -40
                    playerXOffset = 70
                    playerYOffset = -40
                    break;
                case "up":
                    npcXOffset = -90
                    npcYOffset = 60 
                    playerXOffset = -90
                    playerYOffset = -120
                    break;
                case "down":
                    npcXOffset = -90
                    npcYOffset = -120
                    playerXOffset = -90
                    playerYOffset = 60
                    break;
            }

            // Collect user text.
            this.player_text_active = true;

            // Create text only once
            if (!this.player_text_created) {
                this.player_textbox = this.add.image(playerX + playerXOffset + 110, playerY + playerYOffset + 35, "textbox");
                this.player_text = this.add.text(playerX + playerXOffset, playerY + playerYOffset, '', { fontFamily: 'Arial', color: 'black', wordWrap: { width: this.dialogueWidth }, align: "center"});
                this.player_text_created = true;
                this.subtitles.text = "(press Enter or type to start conversation)"

                // Add keyboard listener once
                if (!this.keyboardListenerAdded) {
                    if (this.input.keyboard && this.player_text !== undefined) {
                        this.input.keyboard.on('keydown', event => {
                            if (this.subtitles.text === "(type your message)") {
                                this.subtitles.text = "(press Enter to send message)"
                            }
                            if (!this.player_text_active) return;
                            if (!this.player_text) return;
                
                            // Handle backspace
                            if (event.key === "Backspace" && this.player_text.text.length > 0) { 
                                this.player_text.text = this.player_text.text.substring(0, this.player_text.text.length - 1);
                            } 
                            // Handle normal characters
                            else if (event.key.length === 1) { // only single-character keys
                                if (this.player_text.text.length >= 80) return;
                                this.player_text.text += event.key;
                            }
                        });
                    }
                    this.keyboardListenerAdded = true;
                }
                
            }

            if (this.player_text) {
                if (this.player_text.text == "") {
                    if (this.player_textbox) {
                        this.player_textbox.destroy()
                    }
                } else {
                    if (!this.player_textbox.active) {
                        this.player_textbox = this.add.image(playerX + playerXOffset + 110, playerY + playerYOffset + 35, "textbox");
                        this.player_textbox.setDepth(0)
                        this.player_text.setDepth(1)
                        this.player_text.x = playerX + playerXOffset
                        this.player_text.y = playerY + playerYOffset
                        this.npc_convo_started = true
                    }
                }
            }

            if (this.npc_text[characterName] == undefined && !this.npc_convo_started) {
                if (this.enterKey.isDown && !this.wasEnterPressed) {
                    this.wasEnterPressed = true
                    this.npc_textbox = this.add.image(npcX + npcXOffset + 110, npcY + npcYOffset + 35, "textbox");
                    this.npc_convos[characterName].push(this.npc_convo_starter[characterName])
                    this.npc_text[characterName] = this.add.text(npcX + npcXOffset, npcY + npcYOffset, this.npc_convo_starter[characterName], { fontFamily: 'Arial', color: 'black', wordWrap: { width: this.dialogueWidth }, align: "center"})
                    if (this.subtitles.text === "(press Enter or type to start conversation)") {
                        this.subtitles.text = "(type your message)"
                    }
                }
            } else {
                if (this.npc_text[characterName] == undefined && this.npc_convo_started) {
                    if (this.enterKey.isDown && !this.wasEnterPressed) {
                        this.npc_textbox = this.add.image(npcX + npcXOffset + 110, npcY + npcYOffset + 35, "textbox");
                        this.npc_text[characterName] = this.add.text(npcX + npcXOffset, npcY + npcYOffset, "                 . . .", { fontFamily: 'Arial', color: 'black', wordWrap: { width: this.dialogueWidth }, align: "center"})
                    }
                    this.npc_started_convo = false;
                }
                if (this.player_text) {
                    // Upon pressing Enter, generate NPC's next response
                    if (this.enterKey.isDown && !this.wasEnterPressed) {
                        this.subtitles.text = ""
                        this.npc_convos[characterName].push(this.player_text.text)
                        const prompt = this.createPrompt(this.npc_convos[characterName], characterName)
                        const promptLength = prompt.length
                        const primedPrompt = prompt + this.chooseStarterWord()
                        this.player_text.text = ""
                        if (!this.npc_text[characterName]) return
                        this.npc_text[characterName].text = "                 . . ."
                        this.sendDialogueRequest(primedPrompt)
                        .then((next_npc_response) => {
                            if (this.npc_text[characterName] == undefined) return;
                            const responseLength = next_npc_response.length
                            console.log(next_npc_response)
                            next_npc_response = next_npc_response.slice(promptLength,responseLength)
                            const indexOfPlayerDialogue = next_npc_response.indexOf("Player")
                            if (indexOfPlayerDialogue != -1) {
                                next_npc_response = next_npc_response.slice(0,indexOfPlayerDialogue)
                            }
                            const indexOfNPCDialogue = next_npc_response.indexOf(characterName)
                            if (indexOfNPCDialogue != -1) {
                                next_npc_response = next_npc_response.slice(0,indexOfNPCDialogue)
                            }
                            this.npc_convos[characterName].push(next_npc_response)
                            this.npc_text[characterName].destroy()
                            this.npc_text[characterName] = this.add.text(npcX + npcXOffset, npcY + npcYOffset, next_npc_response, { fontFamily: 'Arial', color: 'black', wordWrap: { width: this.dialogueWidth }, align: "center"})
                            this.subtitles.text = "(type your message)"
                        })
                        this.wasEnterPressed = true;
                    }
                    if (this.enterKey.isUp) {
                        this.wasEnterPressed = false;
                    }
                }
            }
        } else {
            this.closeToNPC = false;
            this.startMovingNPC(characterName);
        }
    }

    chooseStarterWord() {
        const starterWords: Record<string, number> = {
            "Ah": 10,
            "Well": 10,
            "The": 8,
            "It": 5,
            "Oh": 4,
            "Be": 3,
            "Wow": 1,
        };
        let sumWeights = 0
        for (const word in starterWords) {
            sumWeights += starterWords[word]
        }
        let random = Math.random() * sumWeights

        for (const word in starterWords) {
            if (random < starterWords[word]) return word
            random -= starterWords[word]
        } 

        return starterWords[starterWords.length - 1]
    }
    

    createPrompt(convo: string[], npc_name: string) {
        let prompt = this.npc_prompts[npc_name]

        let it_is_npc_turn = false;
        if (this.npc_started_convo) {
            it_is_npc_turn = true;
        }

        for (const msg of convo) {
            if (it_is_npc_turn) {
                prompt = prompt + npc_name + ": " + msg + "\n"
            } else {
                prompt = prompt + "Player: " + msg + "\n"
            }
            it_is_npc_turn = !it_is_npc_turn
        }
        
        if (it_is_npc_turn) {
            prompt = prompt + npc_name + ": "
        } else {
            prompt = prompt + "Player" + ": "
        }

        return prompt
    }

    handleNPCsFarFromPlayer() {
        let far_from_every_npc = true

        for (const characterName in this.positions) {
            if (characterName === "player") continue

            const inProximity = this.checkProximity(this.positions[characterName], this.positions["player"]);
            if (inProximity) {
                far_from_every_npc = false
            }

            if (!inProximity && this.npc_currently_talking === characterName) {
                if (this.npc_text[characterName]) {
                    this.npc_text[characterName].destroy();
                }
                if (this.npc_textbox) {
                    this.npc_textbox.destroy();
                }
                this.wasEnterPressed = false;
                this.npc_text[characterName] = undefined;
                this.npc_convos[characterName] = this.npc_convos[characterName].slice(0,0)
                this.npc_convo_started = false
                this.npc_convo_started
                this.npc_started_convo = true
                if (this.npc_currently_talking === characterName) {
                    this.npc_currently_talking = ""
                }
            } 
        }

        if (far_from_every_npc && this.player_text !== undefined) {
            this.player_text.destroy();
            this.player_textbox.destroy();
            this.player_text = undefined;
            this.player_text_active = false;
            this.player_text_created = false;
            this.subtitles.text = "";
            this.npc_currently_talking = "";
        }
    }

    // Returns true if npc and player are close 
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
                this.moveCharacter(direction, "player");
            }
            
        })
    }

    // only for the main player
    stopMoving(character: string) {
        if (this.moveEvent) {
            this.moveEvent.remove(); // Stop the movement loop
            this.moveEvent = null;
        }
        if (this.mostRecentPlayerMove && !this.closeToNPC) {
            const activeTweens = this.tweens.getTweensOf(this.player);
            if (activeTweens.length === 0) {
                this.player.anims.play(character + '-still-' + this.mostRecentPlayerMove);
            }
        }
    }
}
