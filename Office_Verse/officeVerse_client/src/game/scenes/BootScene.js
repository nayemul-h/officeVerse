import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    preload() {
        // Preload assets here
        // For now, we simulate a load time or load placeholders
        // this.load.image('tiles', 'assets/tiles.png'); 
        // this.load.image('player', 'assets/player.png');
    }

    create() {
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');

        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    if (loginScreen) {
                        loginScreen.style.display = 'flex';
                        this.initLoginUI();
                    }
                }, 500);
            }, 1000); // Reduced splash time for faster dev/testing
        }
    }

    initLoginUI() {
        const tabs = document.querySelectorAll('.login-tab');
        const forms = document.querySelectorAll('.role-form');
        const skins = document.querySelectorAll('.skin-option');
        const createBtn = document.getElementById('create-office-btn');
        const joinBtn = document.getElementById('join-office-btn');

        // Initial state: buttons disabled until socket connects
        if (createBtn) createBtn.disabled = true;
        if (joinBtn) joinBtn.disabled = true;
        if (createBtn) createBtn.textContent = 'Connecting...';
        if (joinBtn) joinBtn.textContent = 'Connecting...';

        let selectedRole = 'boss';
        let selectedSkin = '0xffffff';
        let pendingAction = null;
        this.confirmedPlayerId = null;

        // Tab Switching
        tabs.forEach(tab => {
            tab.onclick = () => {
                tabs.forEach(t => t.classList.remove('active'));
                forms.forEach(f => f.classList.remove('active'));

                tab.classList.add('active');
                selectedRole = tab.getAttribute('data-role');
                document.getElementById(`${selectedRole}-form`).classList.add('active');
            };
        });

        // Skin Selection
        skins.forEach(skin => {
            skin.onclick = () => {
                skins.forEach(s => s.classList.remove('selected'));
                skin.classList.add('selected');
                selectedSkin = skin.getAttribute('data-color');
            };
        });

        // Room WebSocket for Login Coordination - FIXED ENDPOINT to /rooms
        const roomSocket = new WebSocket('ws://localhost:8080/rooms');

        roomSocket.onopen = () => {
            console.log('Room Socket Connected for Login');
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.textContent = 'Create Office';
            }
            if (joinBtn) {
                joinBtn.disabled = false;
                joinBtn.textContent = 'Join Office';
            }
        };

        roomSocket.onerror = (err) => {
            console.error('Room Socket Error:', err);
            alert('Failed to connect to the game server. Please ensure the backend is running at localhost:8080');
            if (createBtn) createBtn.textContent = 'Connection Error';
            if (joinBtn) joinBtn.textContent = 'Connection Error';
        };

        roomSocket.onclose = () => {
            console.log('Room Socket Closed');
            if (createBtn) createBtn.disabled = true;
            if (joinBtn) joinBtn.disabled = true;
        };

        roomSocket.onmessage = (event) => {
            const response = JSON.parse(event.data);
            console.log('Room Response:', response);

            if (response.type === 'registered') {
                this.confirmedPlayerId = response.data.playerId;
                if (pendingAction) {
                    roomSocket.send(JSON.stringify(pendingAction));
                    pendingAction = null;
                }
            } else if (response.type === 'roomCreated' || response.type === 'joinedRoom') {
                const room = response.data.room;
                const nameInput = document.getElementById(`${selectedRole}-name`);
                const playerName = nameInput.value.trim() || 'Player';
                const playerId = this.confirmedPlayerId || Math.floor(Math.random() * 100000);

                // Start Game with Room Data
                document.getElementById('login-screen').style.display = 'none';

                this.scene.start('OfficeScene', {
                    name: playerName,
                    id: playerId,
                    skin: selectedSkin,
                    roomId: room.id,
                    roomName: room.name,
                    roomCode: room.joinCode
                });

                roomSocket.close();
            } else if (response.type === 'error') {
                alert('Error: ' + response.data.message);
                if (createBtn) {
                    createBtn.disabled = false;
                    createBtn.textContent = 'Create Office';
                }
                if (joinBtn) {
                    joinBtn.disabled = false;
                    joinBtn.textContent = 'Join Office';
                }
                pendingAction = null;
            }
        };

        // Boss Flow
        createBtn.onclick = () => {
            const name = document.getElementById('boss-name').value.trim();
            const officeName = document.getElementById('office-name').value.trim();

            if (!name || !officeName) {
                alert('Please enter your name and an office name');
                return;
            }

            if (roomSocket.readyState !== WebSocket.OPEN) {
                alert('Connection lost. Please refresh the page.');
                return;
            }

            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';

            // Store action to execute after registration
            pendingAction = {
                type: 'createRoom',
                data: { roomName: officeName, maxPlayers: 20, isPrivate: true }
            };

            // Register first: send name
            roomSocket.send(JSON.stringify({
                type: 'join',
                data: { playerName: name }
            }));
        };

        // Employee Flow
        joinBtn.onclick = () => {
            const name = document.getElementById('employee-name').value.trim();
            const code = document.getElementById('join-code').value.trim().toUpperCase();

            if (!name || !code) {
                alert('Please enter your name and the 6-digit office code');
                return;
            }

            if (roomSocket.readyState !== WebSocket.OPEN) {
                alert('Connection lost. Please refresh the page.');
                return;
            }

            joinBtn.disabled = true;
            joinBtn.textContent = 'Joining...';

            // Store action to execute after registration
            pendingAction = {
                type: 'joinRoomByCode',
                data: { joinCode: code }
            };

            // Register first: send name
            roomSocket.send(JSON.stringify({
                type: 'join',
                data: { playerName: name }
            }));
        };
    }
}