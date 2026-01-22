import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }
 
 preload() {
    // (Optional) Load a tiny loading image or logo here
    // this.load.image("logo", "assets/ui/logo.png");
  }

  create() {
    
    // Prevent canvas blur on pixel art
    this.game.renderer.config.antialias = false;

    // Set background color early
    this.cameras.main.setBackgroundColor("#000000");
    this.scene.start("PreloadScene");
  }
}
