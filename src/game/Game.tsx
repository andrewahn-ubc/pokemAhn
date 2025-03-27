import { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameScene from "./MainScene";
import HomeScene from "./HomeScene";

const Game: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameRef.current || undefined,
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 } } },
      scene: [GameScene, HomeScene],
      audio: {
        disableWebAudio: false  // Ensure WebAudio is enabled
    }
    };

    const game = new Phaser.Game(config);

    return () => game.destroy(true);
  }, []);

  return <div ref={gameRef} />;
};

export default Game;
