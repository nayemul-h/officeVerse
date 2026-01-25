import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';
import { connectMovement, sendMovement } from '../../network/MovementSocket.js';
import { initChat } from '../../network/ChatModule.js';

export default class OfficeScene extends Phaser.Scene {
    constructor() {
        super('OfficeScene');
        this.otherPlayers = {};
        this.nearbyPlayer = null; // Track nearby player for interaction
        this.interactionPrompt = null; // HTML element for prompt
        this.INTERACTION_DISTANCE = 100; // Distance threshold in pixels
    }

    init(data) {
        this.myPlayerName = data?.name || 'Player';
        this.myPlayerId = data?.id || Math.floor(Math.random() * 100000);
        this.myPlayerSkin = data?.skin || 0xffffff;
        this.roomId = data?.roomId;
        this.roomName = data?.roomName;
        this.roomCode = data?.roomCode;
    }

    preload() {
        this.load.tilemapTiledJSON('office_map', 'assets/maps/office_map.json');

        this.load.image('office_tileset', 'assets/tilesets/office_tileset.png');
        this.load.image('office_tileset2', 'assets/tilesets/office_tileset2.png');

        this.load.spritesheet('Owlet_Monster_Walk', 'assets/sprites/Owlet_Monster_Walk_6.png', {
            frameWidth: 32,
            frameHeight: 32
        });

        this.load.spritesheet('Owlet_Monster_Idle', 'assets/sprites/Owlet_Monster_Idle_4.png', {
            frameWidth: 32,
            frameHeight: 32
        });
    }

    create() {
        /* ---------------- ROOM INFO ---------------- */
        const roomInfo = document.getElementById('room-info-ui');
        if (roomInfo) {
            roomInfo.style.display = 'block';
            document.getElementById('room-display-name').textContent = `Office: ${this.roomName}`;
            document.getElementById('room-display-code').textContent = `Code: ${this.roomCode}`;
        }

        /* ---------------- CHAT ---------------- */
        initChat(this.myPlayerId, this.myPlayerName, this.roomId, this.roomCode);

        /* ---------------- MAP ---------------- */
        const map = this.make.tilemap({ key: 'office_map' });

        const tileset1 = map.addTilesetImage('office_tileset', 'office_tileset');
        const tileset2 = map.addTilesetImage('office_tileset2', 'office_tileset2');

        const floor = map.createLayer('floor', [tileset1, tileset2], 0, 0);
        const wall = map.createLayer('wall', [tileset1, tileset2], 0, 0);
        const furniture = map.createLayer('furniture', [tileset1, tileset2], 0, 0);
        const collision = map.createLayer('collision', [tileset1, tileset2], 0, 0);

        collision.setCollisionByProperty({ collides: true });
        collision.setVisible(false);
        //this.physics.add.collider(this.player, collisionLayer);

        /* ---------------- PLAYER ---------------- */
        this.player = this.physics.add.sprite(64, 64, 'Owlet_Monster_Idle', 0);
        this.player.setScale(1.25);
        this.player.setTint(this.myPlayerSkin);

        // TOP-DOWN SETTINGS (CRITICAL)
        this.player.body.setAllowGravity(false);
        this.player.body.setCollideWorldBounds(false);
        this.player.body.setSize(20, 20);
        this.player.body.setOffset(6, 10);

        this.physics.add.collider(this.player, collision);

        /* ---------------- CAMERA ---------------- */
        /* ---------------- CAMERA ---------------- */
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

        /* ---------------- MINIMAP ---------------- */
        // Calculate zoom to fit map into 150x150 box
        const mapWidth = map.widthInPixels;
        const mapHeight = map.heightInPixels;
        const minimapSize = 150; // Smaller size as requested
        const zoomX = minimapSize / mapWidth;
        const zoomY = minimapSize / mapHeight;
        const minimapZoom = Math.min(zoomX, zoomY);

        // Position: Bottom Right with padding
        const padding = 20;
        const camX = this.scale.width - minimapSize - padding;
        const camY = this.scale.height - minimapSize - padding;

        this.minimap = this.cameras.add(camX, camY, minimapSize, minimapSize);
        this.minimap.setZoom(0.35); // Zoomed out slightly to show more context if needed, or matched to size
        // To show the *whole* map in the minimap window:
        // this.minimap.setZoom(minimapZoom); 
        // But user wants "minimap like this" (usually zoomed in somewhat centered on player). 
        // Previous value was 0.5. Let's try 0.4 for a slightly wider view in the smaller window? 
        // Or keep 0.5. Let's stick closer to 0.5 but maybe adjust if it feels too cramped in 150px.
        // Actually, if window is smaller, 0.5 shows LESS area. To show same area, we'd need lower zoom.
        this.minimap.setZoom(0.4);

        this.minimap.setBackgroundColor(0x000000);
        this.minimap.setAlpha(0.9);
        this.minimap.startFollow(this.player);

        // Round Minimap Mask
        const maskShape = this.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillCircle(camX + minimapSize / 2, camY + minimapSize / 2, minimapSize / 2);
        maskShape.setScrollFactor(0);
        const mask = maskShape.createGeometryMask();
        this.minimap.setMask(mask);

        // Minimap Border
        const border = this.add.graphics();
        border.lineStyle(4, 0xffffff, 1);
        border.strokeCircle(camX + minimapSize / 2, camY + minimapSize / 2, minimapSize / 2);
        border.setScrollFactor(0);
        border.setDepth(9999);
        this.minimap.ignore(border);

        /* ---------------- ROOM LABELS (Minimap Only) ---------------- */
        const roomLabels = [];

        // 1. Get zones from map data
        const zoneLayer = map.getObjectLayer('zone');
        if (zoneLayer && zoneLayer.objects) {
            zoneLayer.objects.forEach(obj => {
                // Map internal names to display names
                let name = obj.name;
                if (name === 'meetingRoom') {
                    name = 'Meeting Room';
                    this.meetingRoomPos = { x: obj.x + obj.width / 2, y: obj.y + obj.height / 2 };
                }
                if (name === 'genAI') name = 'Server Room';
                if (name === 'gaming') name = 'Break Room';
                if (name === 'exit') return; // Skip exit

                roomLabels.push({
                    name: name,
                    x: obj.x + obj.width / 2,
                    y: obj.y + obj.height / 2
                });
            });
        }

        // 2. Add missing rooms manually (estimates based on map layout)
        const manualRooms = [
            { name: 'Boss Room', x: 1050, y: 120 },
            { name: 'Office', x: 600, y: 150 },
            { name: 'Executive Room', x: 950, y: 500 },
            { name: 'Cafeteria', x: 400, y: 580 },
            { name: 'Lobby', x: 150, y: 450 },
            { name: 'Reception', x: 150, y: 700 }
        ];

        // Merge manual rooms (avoid duplicates if they exist in map)
        manualRooms.forEach(room => {
            if (!roomLabels.find(r => r.name === room.name)) {
                roomLabels.push(room);
            }
        });

        // 3. Create Visuals
        roomLabels.forEach(room => {
            // Text
            const text = this.add.text(room.x, room.y, room.name, {
                font: '20px Arial', // Increased size
                fill: '#ffffff',
                fontStyle: 'bold',
                align: 'center'
            }).setOrigin(0.5);

            // Background (Rounded Rect)
            const padding = 10; // Increased padding
            const width = text.width + padding * 2;
            const height = text.height + padding * 2;

            const bg = this.add.graphics();
            bg.fillStyle(0x2d3436, 0.8); // Dark background with transparency
            bg.fillRoundedRect(room.x - width / 2, room.y - height / 2, width, height, 8);
            bg.lineStyle(2, 0xffffff, 0.8); // Thicker, more visible border
            bg.strokeRoundedRect(room.x - width / 2, room.y - height / 2, width, height, 8);

            bg.setDepth(9998);
            text.setDepth(9999);

            // Important: Main camera ignores these labels
            this.cameras.main.ignore(text);
            this.cameras.main.ignore(bg);
        });

        /* ---------------- UI IGNORE ---------------- */
        this.scene.get('UIScene')?.cameras.main.ignore([
            floor,
            wall,
            furniture,
            collision
        ]);

        /* ---------------- NAME TAG ---------------- */
        this.playerNameText = this.add.text(this.player.x, this.player.y - 40, this.myPlayerName, {
            font: '14px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        /* ---------------- INPUT ---------------- */
        this.cursors = this.input.keyboard.createCursorKeys();

        // E key for proximity interaction
        this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        // F key for Meeting
        this.fKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.isInMeetingZone = false;

        /* ---------------- ANIMATIONS ---------------- */
        this.createAnimations();
        this.player.play('idle');

        /* ---------------- NETWORK ---------------- */
        connectMovement(this, data => this.handleNetwork(data));
    }

    createAnimations() {
        this.anims.create({
            key: 'walk',
            frames: this.anims.generateFrameNumbers('Owlet_Monster_Walk', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('Owlet_Monster_Idle', { start: 0, end: 3 }),
            frameRate: 4,
            repeat: -1
        });
    }

    update(time, delta) {
        const speed = 125;
        const body = this.player.body;

        body.setVelocity(0);

        let moving = false;
        let animToPlay = 'idle';

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
            this.player.setFlipX(true);
            moving = true;
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
            this.player.setFlipX(false);
            moving = true;
        }

        if (this.cursors.up.isDown) {
            body.setVelocityY(-speed);
            moving = true;
        } else if (this.cursors.down.isDown) {
            body.setVelocityY(speed);
            moving = true;
        }

        if (moving) {
            animToPlay = 'walk';
            this.player.play('walk', true);
        } else {
            animToPlay = 'idle';
            this.player.play('idle', true);
        }

        this.player.setDepth(this.player.y);
        this.playerNameText.setPosition(this.player.x, this.player.y - 40);
        this.playerNameText.setDepth(this.player.y + 1000);

        // Throttled Network Update
        this.lastSent = this.lastSent || 0;
        if (time > this.lastSent + 50) {
            if (moving || time > this.lastSent + 1000) {
                const flipXVal = this.player.flipX ? 1 : 0;
                // Sanitize name to remove colons which break the protocol
                const safeName = (this.myPlayerName || 'Player').replace(/:/g, '');
                sendMovement(
                    `${this.roomId}:${this.myPlayerId}:${Math.round(this.player.x)}:${Math.round(this.player.y)}:${safeName}:${this.myPlayerSkin}:${animToPlay}:${flipXVal}`
                );
                this.lastSent = time;
            }
        }

        // Proximity detection and interaction
        this.updateProximityInteraction();
        this.updateMeetingInteraction();

        // Handle E key press for proximity chat
        if (Phaser.Input.Keyboard.JustDown(this.eKey) && this.nearbyPlayer) {
            // Check if chat input is not focused (avoid triggering when typing)
            const chatInput = document.getElementById('chat-input');
            if (document.activeElement !== chatInput) {
                this.initiateProximityChat(this.nearbyPlayer.id);
            }
        }
    }

    handleNetwork(data) {
        try {
            // Handle player disconnect messages
            if (data.startsWith('PlayerLeft:')) {
                const parts = data.split(':');
                const playerId = Number(parts[1]);
                this.handlePlayerLeft(playerId);
                return;
            }

            const parts = data.split(':');
            if (parts[0] !== 'Broadcast') return;

            const id = Number(parts[1]);
            if (id === this.myPlayerId) return;

            const x = Number(parts[2]);
            const y = Number(parts[3]);
            const name = parts[4] || 'Player';
            // Safe parse skin
            const skin = parseInt(parts[5]) || 0xffffff;

            // Validate animation key (default to idle if missing or invalid)
            let anim = parts[6];
            if (anim !== 'walk' && anim !== 'idle') anim = 'idle';

            const flipX = parts[7] === '1';

            if (!this.otherPlayers[id]) {
                const sprite = this.physics.add.sprite(x, y, 'Owlet_Monster_Idle');
                sprite.body.setAllowGravity(false);
                sprite.setTint(skin);

                // Play animation safely
                sprite.play(anim, true);
                sprite.setFlipX(flipX);

                const label = this.add.text(x, y - 40, name, {
                    font: '14px Arial',
                    fill: '#fff',
                    stroke: '#000',
                    strokeThickness: 3
                }).setOrigin(0.5);

                this.otherPlayers[id] = { sprite, label };
            } else {
                const other = this.otherPlayers[id];

                // Check if sprite still exists (wasn't destroyed)
                if (other.sprite && other.sprite.active) {
                    other.sprite.play(anim, true);
                    other.sprite.setFlipX(flipX);

                    if (other.moveTween) other.moveTween.stop();

                    other.moveTween = this.tweens.add({
                        targets: [other.sprite, other.label],
                        x: x,
                        y: { value: y, duration: 100 },
                        duration: 100,
                        onUpdate: () => {
                            if (other.sprite.active) {
                                other.sprite.setDepth(other.sprite.y);
                                other.label.setPosition(other.sprite.x, other.sprite.y - 40);
                                other.label.setDepth(other.sprite.y + 1000);
                            }
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Error handling network message:', err, data);
        }
    }

    handlePlayerLeft(playerId) {
        try {
            const other = this.otherPlayers[playerId];
            if (other) {
                // Stop any ongoing tweens
                if (other.moveTween) {
                    other.moveTween.stop();
                }

                // Destroy sprite and label
                if (other.sprite) {
                    other.sprite.destroy();
                }
                if (other.label) {
                    other.label.destroy();
                }

                // Remove from tracking
                delete this.otherPlayers[playerId];

                console.log(`Player ${playerId} left the game`);
            }
        } catch (err) {
            console.error('Error handling player disconnect:', err, playerId);
        }
    }

    updateProximityInteraction() {
        let closestPlayer = null;
        let closestDistance = this.INTERACTION_DISTANCE;

        // Find the closest player within interaction distance
        for (const [id, other] of Object.entries(this.otherPlayers)) {
            if (other.sprite && other.sprite.active) {
                const distance = Phaser.Math.Distance.Between(
                    this.player.x, this.player.y,
                    other.sprite.x, other.sprite.y
                );

                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestPlayer = { id: parseInt(id), sprite: other.sprite, label: other.label };
                }
            }
        }

        // Update nearby player and prompt
        if (closestPlayer) {
            this.nearbyPlayer = closestPlayer;
            this.showInteractionPrompt(closestPlayer);
        } else {
            this.nearbyPlayer = null;
            this.hideInteractionPrompt();
        }
    }

    showInteractionPrompt(player) {
        // Create prompt as Phaser text (matches name tag style)
        if (!this.interactionPrompt) {
            this.interactionPrompt = this.add.text(0, 0, '', {
                font: '14px Arial',
                fill: '#4a90e2',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }

        // Update prompt content and position
        this.interactionPrompt.setText('[E] Interact');
        this.interactionPrompt.setPosition(player.sprite.x, player.sprite.y - 55);
        this.interactionPrompt.setDepth(player.sprite.y + 2000); // Above name tags
        this.interactionPrompt.setVisible(true);

        // Don't show prompts on minimap
        if (this.minimap) {
            this.minimap.ignore(this.interactionPrompt);
        }
    }

    hideInteractionPrompt() {
        if (this.interactionPrompt) {
            this.interactionPrompt.setVisible(false);
        }
    }

    initiateProximityChat(playerId) {
        // Call the global function exposed by ChatModule
        if (window.selectPlayerForChat) {
            window.selectPlayerForChat(playerId);
            console.log(`Initiated proximity chat with player ${playerId}`);
        } else {
            console.error('selectPlayerForChat function not available');
        }
    }

    updateMeetingInteraction() {
        if (!this.meetingRoomPos) return;

        const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            this.meetingRoomPos.x, this.meetingRoomPos.y
        );

        // Interaction radius for meeting table (e.g., 150px)
        const MEETING_RADIUS = 150;

        if (dist < MEETING_RADIUS) {
            if (!this.isInMeetingZone) {
                this.isInMeetingZone = true;
                // Show prompt specific for meeting
                this.showMeetingPrompt();
            }
        } else {
            if (this.isInMeetingZone) {
                this.isInMeetingZone = false;
                this.hideMeetingPrompt();
                // Optional: Auto-leave meeting if walking away? 
                // Creating a manual leave might be safer, but user asked for "join".
                // Let's stick to manual join. If they walk away, maybe we should leave?
                // For now, let's keep it manual join/leave or auto-leave. 
                // Implementing auto-leave on exit zone is typical for value.
                if (window.leaveMeetingRoom) window.leaveMeetingRoom();
            }
        }

        if (this.isInMeetingZone && Phaser.Input.Keyboard.JustDown(this.fKey)) {
            // Google Meet Integration
            const isBoss = this.myPlayerName.toLowerCase().includes('boss');

            if (isBoss) {
                // 1. Boss Logic
                const confirmCreate = confirm("Do you want to start a Google Meet?");
                if (confirmCreate) {
                    // Open new meeting
                    window.open('https://meet.google.com/new', '_blank');

                    // Prompt for code to share
                    setTimeout(() => {
                        const code = prompt("Please copy the Meeting Code/Link and paste it here to share with employees:");
                        if (code && window.sendGlobalMessage) {
                            window.sendGlobalMessage(`📢 JOIN MEETING: ${code}`);
                        }
                    }, 1000);
                }
            } else {
                // 2. Employee Logic
                const confirmJoin = confirm("Open Google Meet to join the meeting?");
                if (confirmJoin) {
                    window.open('https://meet.google.com/', '_blank');
                }
            }
        }
    }

    showMeetingPrompt() {
        if (!this.meetingPrompt) {
            this.meetingPrompt = this.add.text(0, 0, '', {
                font: '16px Arial',
                fill: '#00ff00',
                backgroundColor: '#00000088',
                padding: { x: 5, y: 5 },
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
        }
        this.meetingPrompt.setText('Press F to Join Meeting');
        this.meetingPrompt.setPosition(this.meetingRoomPos.x, this.meetingRoomPos.y - 80);
        this.meetingPrompt.setDepth(9999);
        this.meetingPrompt.setVisible(true);
        if (this.minimap) this.minimap.ignore(this.meetingPrompt);
    }

    hideMeetingPrompt() {
        if (this.meetingPrompt) {
            this.meetingPrompt.setVisible(false);
        }
    }
}
