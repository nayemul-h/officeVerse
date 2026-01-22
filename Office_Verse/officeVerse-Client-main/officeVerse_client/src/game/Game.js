import Phaser from "phaser";

import BootScene from "./scenes/BootScene.js";
import PreloadScene from "./scenes/PreloadScene.js";
import OfficeScene from "./scenes/OfficeScene.js";

import LauncherScene from "./launcher/LauncherScene.js";
import LoginScene from "./launcher/LoginScene.js";
import LobbyScene from "./launcher/LobbyScene.js";

export default class Game extends Phaser.Game {
  constructor() {
    super({
      type: Phaser.AUTO,
      parent: "game-container",
      width: 640,
      height: 480,

      physics: {
        default: "arcade",
        arcade: {
          debug: false
        }
      },

      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },

      scene: [
        BootScene,
        PreloadScene,
        LauncherScene,
        LoginScene,
        LobbyScene,
        OfficeScene,
        // runs parallel with officeScene
        UIScene
      ]
    });
  }
}
