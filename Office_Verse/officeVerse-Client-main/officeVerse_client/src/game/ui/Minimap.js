export default class MiniMap {
  constructor(scene, map, x = 460, y = 20, size = 160) {
    this.scene = scene;

    this.camera = scene.cameras.add(x, y, size, size)
      .setZoom(0.2)
      .setName('MiniMap');

    this.camera.setBounds(
      0,
      0,
      map.widthInPixels,
      map.heightInPixels
    );

    this.camera.setBackgroundColor(0x002244);

    // Prevent minimap from moving with main camera
    this.camera.ignore(scene.uiIgnore || []);
  }

  follow(target) {
    this.camera.startFollow(target);
  }

  destroy() {
    this.scene.cameras.remove(this.camera);
  }
}
