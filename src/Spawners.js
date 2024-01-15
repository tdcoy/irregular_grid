import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { entity } from "./Entity.js";
import { level_builder } from "./LevelBuilder.js";

export const spawners = (() => {
  class LevelSpawner extends entity.Component {
    constructor(_params) {
      super();
      this.params = _params;
    }

    Spawn() {
      const e = new entity.Entity();
      e.SetPosition(new THREE.Vector3(0, 0, 0));
      e.AddComponent(new level_builder.LevelBuilder(this.params));

      this.Manager.Add(e, "levelBuilder");
      return e;
    }
  }

  return { LevelSpawner: LevelSpawner };
})();
