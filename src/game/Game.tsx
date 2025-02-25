import { useEffect, useRef } from "react";
import Phaser from "phaser";

const Game: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current || undefined,
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
      scene: {
        preload,
        create,
        update,
      },
    };

    const game = new Phaser.Game(config);

    function preload(this: Phaser.Scene) {
      this.load.image("background", "/assets/bg.png"); // Your custom Pokémon-style map
      this.load.spritesheet("player", "/assets/star.png", { frameWidth: 60, frameHeight: 70 });
    }

    function create(this: Phaser.Scene) {
      this.add.image(400, 300, "background"); // Background map

      const player = this.physics.add.sprite(400, 300, "player");

      this.anims.create({
        key: "walk",
        frames: this.anims.generateFrameNumbers("player", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1,
      });

      this.input.keyboard?.on("keydown-W", () => player.setVelocityY(-100));
      this.input.keyboard?.on("keydown-S", () => player.setVelocityY(100));
      this.input.keyboard?.on("keydown-A", () => player.setVelocityX(-100));
      this.input.keyboard?.on("keydown-D", () => player.setVelocityX(100));
      this.input.keyboard?.on("keyup", () => player.setVelocity(0, 0));
    }

    function update(this: Phaser.Scene) {}

    return () => game.destroy(true);
  }, []);

  return <div ref={gameRef} />;
};

export default Game;
