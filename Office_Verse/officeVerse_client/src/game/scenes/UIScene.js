// Use this import everywhere
import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';


import ChatBox from "../ui/ChatBox.js";
import PlayerList from "../ui/PlayerList.js";
import MiniMap from "../ui/MiniMap.js";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  init(data) {
    // Receive references from OfficeScene
    this.player = data.player;
    this.map = data.map;
  }

  create() {
    // 🔒 UI should not move with camera
    this.cameras.main.setScroll(0, 0);

    // --- CHAT ---
    this.chatBox = new ChatBox(this);

    // --- PLAYER LIST ---
    this.playerList = new PlayerList(this);

    // --- MINIMAP ---
    if (this.map && this.player) {
      this.miniMap = new MiniMap(this, this.map);
      this.miniMap.follow(this.player);
      // Player dot
      this.miniMap.addPlayerDot(this.player);
    }

    // Black Screen remedy
    this.cameras.main.setScroll(0, 0);
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');


    // --- UI TOGGLE KEYS ---
    this.input.keyboard.on("keydown-T", () => {
      this.chatBox.setVisible(!this.chatBox.background.visible);
    });

    this.input.keyboard.on("keydown-P", () => {
      this.playerList.setVisible(!this.playerList.background.visible);
    });
  }

  addChatMessage(username, message) {
    this.chatBox.addMessage(username, message);
  }

  addPlayer(id, name) {
    this.playerList.addPlayer(id, name);
  }

  removePlayer(id) {
    this.playerList.removePlayer(id);
  }
}
