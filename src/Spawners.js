import * as THREE from "three";
import { entity } from "./Entity.js";
import { level_builder } from "./LevelBuilder.js";
import { irregular_grid } from "./IrregularGrid.js";
import { tile_solver } from "./TileSolver.js";
import { room_generator } from "./RoomGenerator.js";

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
      e.AddComponent(new irregular_grid.DrawGrid(this.params));
      e.AddComponent(new tile_solver.TileSolver(this.params));
      e.AddComponent(new room_generator.RoomGenerator(this.params));
      this.Manager.Add(e, "levelBuilder");
      return e;
    }
  }

  return { LevelSpawner: LevelSpawner };
})();
