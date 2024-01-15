import * as THREE from "https://unpkg.com/three@0.127.0/build/three.module.js";
import { entity } from "./Entity.js";
import { render_component } from "./RenderComponent.js";

export const level_builder = (() => {
  class LevelBuilder extends entity.Component {
    constructor(_params) {
      super();
      this.params = _params;
      this.spawned = false;
      this.materials = {};
    }

    Update(timeElapsed) {
      if (this.spawned) {
        return;
      }
      this.spawned = true;

      // Test Cube
      const cube = new entity.Entity();
      cube.SetPosition(new THREE.Vector3(0, 0, 0));
      cube.AddComponent(
        new render_component.RenderComponent({
          scene: this.params.scene,
          resourcePath: "./models/",
          resourceName: "cube.glb",
          scale: new THREE.Vector3(1, 1, 1),
          emissive: new THREE.Color(0x000000),
          color: new THREE.Color(0xffffff),
        })
      );
      this.Manager.Add(cube);
    }
  }

  return { LevelBuilder: LevelBuilder };
})();
