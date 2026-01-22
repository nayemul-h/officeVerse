// import { Start } from './scenes/Start.js';

// const config = {
//     type: Phaser.AUTO,
//     title: 'Overlord Rising',
//     description: '',
//     parent: 'game-container',
//     width: 1280,
//     height: 720,
//     backgroundColor: '#000000',
//     pixelArt: false,
//     scene: [
//         Start
//     ],
//     scale: {
//         mode: Phaser.Scale.FIT,
//         autoCenter: Phaser.Scale.CENTER_BOTH
//     },
// }

// new Phaser.Game(config);


//           import Game from "./game/Game";

//window.onload = () => {
//  new Game();
//};
import * as Phaser from 'https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.esm.js';
import BootScene from './game/scenes/BootScene.js';
import OfficeScene from './game/scenes/OfficeScene.js';

const config = {
    type: Phaser.AUTO,
    disableVisibilityChange: true,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: [BootScene, OfficeScene]
};

const game = new Phaser.Game(config);
