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
        // Find the HTML loading screen and hide it
        const loadingScreen = document.getElementById('loading-screen');
        const loginScreen = document.getElementById('login-screen');

        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';

                // Show Login Screen
                if (loginScreen) {
                    loginScreen.style.display = 'flex';

                    // Setup Skin Selection Logic
                    const skins = document.querySelectorAll('.skin-option');
                    let selectedSkin = '0xffffff';

                    skins.forEach(skin => {
                        skin.onclick = () => {
                            // remove class from all
                            skins.forEach(s => s.classList.remove('selected'));
                            // add to clicked
                            skin.classList.add('selected');
                            // set value
                            selectedSkin = skin.getAttribute('data-color');
                        };
                    });

                    // Store reference for the button handler below
                    this.selectedSkin = selectedSkin;
                }
            }, 500); // Wait for fade out
        }

        // Handle Login Logic
        const loginBtn = document.getElementById('login-btn');
        if (loginBtn) {
            loginBtn.onclick = () => {
                const nameInput = document.getElementById('player-name');
                const idInput = document.getElementById('player-id');
                const name = nameInput.value.trim() || 'Player';
                const id = idInput.value ? parseInt(idInput.value) : Math.floor(Math.random() * 100000);

                // Get currently selected skin from DOM
                const activeSkin = document.querySelector('.skin-option.selected')?.getAttribute('data-color') || '0xffffff';

                if (name) {
                    // Hide Login
                    if (loginScreen) loginScreen.style.display = 'none';

                    // Start Game with Data
                    this.scene.start('OfficeScene', { name: name, id: id, skin: activeSkin });
                }
            };
        }
    }
}
