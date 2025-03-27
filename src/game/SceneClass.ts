

export default class SceneClass extends Phaser.Scene {
    public positions: Record<string, [number, number]> = {};
    public delay: Record<string, number> = {};
    public characters: Record<string, Phaser.Physics.Arcade.Sprite> = {};
    public collidableLayout: number[][];
    public realCoord!: (relativeX: integer, relativeY: integer) => number[];
    public relativeCoord!: (relativeX: integer, relativeY: integer,) => number[];
    public bgWidth!: integer;
    public bgHeight!: integer;
}