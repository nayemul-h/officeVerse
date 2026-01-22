import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';
import { connectMovement, sendMovement } from '../../network/MovementSocket.js';
import { initChat } from '../../network/ChatModule.js';

export default class OfficeScene extends Phaser.Scene {
    constructor() {
        super('OfficeScene');
        this.otherPlayers = {};
    }
    preload() {
        // Load exported JSON map
        this.load.tilemapTiledJSON('office_map', 'assets/maps/office_map.json');
        // Load tileset image referenced in JSON
        this.load.image('office_tileset', 'assets/tilesets/office_tileset.png');
        // Player sprite
        this.load.spritesheet(
            "Owlet_Monster_Walk",
            "assets/sprites/Owlet_Monster_Walk_6.png",
            {
                frameWidth: 32,
                frameHeight: 32
            }
        );
        this.load.spritesheet(
            "Owlet_Monster_Idle",
            "assets/sprites/Owlet_Monster_Idle_4.png",
            {
                frameWidth: 32,
                frameHeight: 32
            }
        );
    }

    create() {
        // Debug


        // Generate Random Player ID
        this.myPlayerId = Math.floor(Math.random() * 100000);
        console.log("My Player ID:", this.myPlayerId);

        // Initialize Chat
        initChat(this.myPlayerId);

        // Debug Text
        this.debugText = this.add.text(10, 10, 'Connecting...', { font: '16px Courier', fill: '#00ff00', backgroundColor: '#000000' });
        this.debugText.setScrollFactor(0); // Fix to screen
        this.debugText.setDepth(9999);

        // Interact Prompt
        this.interactText = this.add.text(0, 0, 'Press E to Interact', {
            font: '14px Arial',
            fill: '#ffffff',
            backgroundColor: '#000000aa',
            padding: { x: 4, y: 4 }
        });
        this.interactText.setDepth(10000);
        this.interactText.setVisible(false);
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        connectMovement(this, (data) => {
            // Handle Messages
            // Format: "Broadcast:id:x:y"
            const parts = data.split(':');
            if (parts[0] === 'Broadcast') {
                const id = parseInt(parts[1]);
                const x = parseInt(parts[2]);
                const y = parseInt(parts[3]);

                this.handleRemoteMovement(id, x, y);

                // Short update for debug
                this.debugText.setText(`ID: ${this.myPlayerId}\nRX: P${id} at ${x},${y}`);
            } else if (parts[0] === 'PlayerLeft') {
                const id = parseInt(parts[1]);
                console.log("Player Left:", id);
                if (this.otherPlayers[id]) {
                    this.otherPlayers[id].destroy();
                    delete this.otherPlayers[id];
                    this.debugText.setText(`Player ${id} Left`);
                }
            } else {
                console.log("RX:", data);
            }
        });

        // 💓 Heartbeat: Send position every 1s to ensure new players see us
        // Using setInterval so it runs even if tab is backgrounded (browser throttles to ~1s)
        setInterval(() => {
            if (this.player && this.player.body) {
                sendMovement(this.myPlayerId + ":" + Math.round(this.player.x) + ":" + Math.round(this.player.y));
            }
        }, 1000);

        // Create Tiled map
        const office_map = this.make.tilemap({ key: 'office_map' });
        // Match the tileset name in Tiled
        const office_tileset = office_map.addTilesetImage('office_tileset', 'office_tileset');
        // Layer names must exactly match Tiled
        const floor = office_map.createLayer('floor', office_tileset, 0, 0);
        const wall = office_map.createLayer('wall', office_tileset, 0, 0);
        const furniture = office_map.createLayer("furniture", office_tileset);
        //furniture.setDepth(100);
        const collision = office_map.createLayer("collision", office_tileset);
        //Prevents UI from rendering inside the minimap camera
        this.scene.get("UIScene")?.cameras.main.ignore([
            floor,
            wall,
            furniture,
            collision
        ]);
        // Enable collision tiles
        collision.setCollisionByProperty({ collides: true });
        // fixes gray box
        collision.setVisible(false)
        // Add player
        this.player = this.physics.add.sprite(200, 200, 'Owlet_Monster_Idle', 0);
        // 🔴 FORCE A VISIBLE FRAME
        //this.player.setFrame(0);
        this.player.setScale(2);
        //this.player.setOrigin(0.5, 1);
        // 🔑 SHRINK BODY TO FEET AREA
        //this.player.body.setSize(80, 90); ///90
        //this.player.body.setOffset(88, 166); //166
        //this.player.setDepth(1000);

        this.physics.add.collider(this.player, collision);
        // Camera follow player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(
            0,
            0,
            office_map.widthInPixels,
            office_map.heightInPixels
        );
        // FORCE-disable body debug
        this.player.body.debugShowBody = false;
        this.player.body.debugShowVelocity = false;
        // camera
        // Animations
        this.createAnimations();
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        // creates idle animation
        this.player.anims.play('idle', true);
        // Launches UI scene
        this.scene.launch("UIScene", {
            player: this.player,
            map: office_map
        });
    }

    createAnimations() {
        // DOWN (front)
        this.anims.create({
            key: 'walk-down',
            frames: this.anims.generateFrameNumbers('Owlet_Monster_Walk', {
                start: 0,
                end: 5
            }),
            frameRate: 10,
            repeat: -1
        });
        // LEFT
        this.anims.create({
            key: 'walk-left',
            frames: this.anims.generateFrameNumbers('Owlet_Monster_Walk', {
                start: 0,
                end: 5
            }),
            frameRate: 10,
            repeat: -1
        });
        // RIGHT flipped
        this.anims.create({
            key: 'walk-right',
            frames: this.anims.generateFrameNumbers('Owlet_Monster_Walk', {
                start: 0,
                end: 5
            }),
            frameRate: 10,
            repeat: -1
        });
        // UP (back)
        this.anims.create({
            key: 'walk-up',
            frames: this.anims.generateFrameNumbers('Owlet_Monster_Walk', {
                start: 0,
                end: 5
            }),
            frameRate: 10,
            repeat: -1
        });
        // IDLE (front-facing, VISIBLE)
        // IDLE (front-facing)
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('Owlet_Monster_Idle', {
                start: 0,
                end: 3
            }),
            frameRate: 4,
            repeat: -1
        });
    }
    update() {
        const speed = 120;
        const body = this.player.body;
        body.setVelocity(0);
        let anim = 'idle';
        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
            this.player.setFlipX(true);
            anim = 'walk-left';
        }
        else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
            this.player.setFlipX(false); // 🔑 FIX
            anim = 'walk-right';
        }
        else if (this.cursors.up.isDown) {
            body.setVelocityY(-speed);
            anim = 'walk-up';
        }
        else if (this.cursors.down.isDown) {
            body.setVelocityY(speed);
            anim = 'walk-down';
        }

        if (this.player.anims.currentAnim?.key !== anim) {
            this.player.anims.play(anim, true);
        }
        this.player.setDepth(this.player.y);

        // Network Update
        if (Math.abs(body.velocity.x) > 0 || Math.abs(body.velocity.y) > 0) {
            sendMovement(this.myPlayerId + ":" + Math.round(this.player.x) + ":" + Math.round(this.player.y));
        }

        // Interaction Check
        this.checkInteraction();
    }

    checkInteraction() {
        let closestPlayer = null;
        let minDist = 60; // Interaction radius

        Object.keys(this.otherPlayers).forEach(id => {
            const other = this.otherPlayers[id];
            if (!other) return;

            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, other.x, other.y);
            if (dist < minDist) {
                closestPlayer = other;
                // Determine Interaction target ID
                closestPlayer.playerId = id;
            }
        });

        if (closestPlayer) {
            this.interactText.setPosition(closestPlayer.x - this.interactText.width / 2, closestPlayer.y - 40);
            this.interactText.setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
                console.log(`Interacted with Player ${closestPlayer.playerId}`);
                // Visual feedback
                this.tweens.add({
                    targets: closestPlayer,
                    alpha: 0.5,
                    duration: 100,
                    yoyo: true,
                    repeat: 1
                });
            }
        } else {
            this.interactText.setVisible(false);
        }
    }
    handleRemoteMovement(id, x, y) {
        if (id === this.myPlayerId) return; // Ignore self

        if (this.otherPlayers[id]) {
            // Update existing sprite
            this.otherPlayers[id].setPosition(x, y);
            this.otherPlayers[id].setDepth(y);
        } else {
            // Create new sprite
            console.log("Creating new player sprite for ID:", id);
            const otherPlayer = this.physics.add.sprite(x, y, 'Owlet_Monster_Idle', 0);
            otherPlayer.setScale(2);
            otherPlayer.setDepth(y);
            this.otherPlayers[id] = otherPlayer;
        }
    }
}