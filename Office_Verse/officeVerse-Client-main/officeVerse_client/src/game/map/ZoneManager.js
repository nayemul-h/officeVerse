export default class ZoneManager {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;
    this.zones = this.scene.physics.add.staticGroup();
  }

  createZones() {
    const zoneLayer = this.map.getObjectLayer('zone');

    if (!zoneLayer) return;

    zoneLayer.objects.forEach(obj => {
      const zone = this.scene.add.rectangle(
        obj.x + obj.width / 2,
        obj.y + obj.height / 2,
        obj.width,
        obj.height
      );

      this.scene.physics.add.existing(zone, true);
      zone.name = obj.name;

      this.zones.add(zone);
    });

    return this.zones;
  }
}
