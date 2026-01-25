export default class MiniMap {
  constructor(scene, map, x = 20, y = 20, size = 160) {
    this.scene = scene;

    this.camera = scene.cameras.add(x, y, size, size)
      .setZoom(0.2)
      .setName('MiniMap')
      .setBackgroundColor(0x002244);

    this.camera.setBounds(
      0,
      0,
      map.widthInPixels,
      map.heightInPixels
    );

    // 🔵 Circular mask
    const maskShape = scene.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    maskShape.fillCircle(
      x + size / 2,
      y + size / 2,
      size / 2
    );

     const mask = maskShape.createGeometryMask();
    this.camera.setMask(mask);

    // 🟢 Border
    scene.add.circle(
      x + size / 2,
      y + size / 2,
      size / 2
    ).setStrokeStyle(3, 0xffffff)
     .setScrollFactor(0)
     .setDepth(10000);

    // UI objects should NOT appear in minimap
    scene.uiIgnore = scene.uiIgnore || [];
  }

  follow(target) {
    this.camera.startFollow(target);
  }

  destroy() {
    this.scene.cameras.remove(this.camera);
  }

  addPlayerDot(player, color = 0x00ff00) {
  const dot = this.scene.add.circle(
    player.x,
    player.y,
    3,
    color
  );

  dot.setScrollFactor(1); // World space
  dot.setDepth(9999);

  this.camera.ignore(dot); // Optional if you want only dots

  this.scene.events.on('update', () => {
    dot.setPosition(player.x, player.y);
  });

  return dot;
}
}
