import Phaser from "phaser";

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super("LoginScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#020617");

    const { width, height } = this.scale;

    this.add.text(width / 2, 120, "LOGIN", {
      fontSize: "42px",
      color: "#4ade80"
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 20, "Press ENTER to login", {
      fontSize: "18px",
      color: "#94a3b8"
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => {
      console.log("Login success");
      this.scene.start("LobbyScene");
    });

    this.input.once("pointerdown", () => {
      this.scene.start("LobbyScene");
    });
  }
}
