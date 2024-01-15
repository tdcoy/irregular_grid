/* 
- Create better debugging tools, ex) pausing inbetween methods so things can be seen being built
1. Create Hex point field
2. Triangulate
3. Create hash table of vertices/edges/triangles (singletons) so that there will only ever be 1 instance of the each, and easier referencing
4. Randomly merge triangles into quads
5. Subdivide each triangle face
    - Find center point, create new vertex inbetween each edge of the quad/triangle
    - This step ensures no trianles are left, they get converted into quads
6. Smoothing/Relaxing edges

7. WFC to determine what tiles can be placed where
8. Marching Cube to place the tiles in the irregular grid
*/

import { entity_manager } from "./src/EntityManager.js";
import { entity } from "./src/Entity.js";
import { threejs_controller } from "./src/ThreeJSController.js";
import { load_controller } from "./src/LoadController.js";
import { spawners } from "./src/Spawners.js";
import { irregular_grid } from "./src/IrregularGrid.js";
import { gizmos } from "./src/Gizmos.js";

class Demo {
  constructor() {
    this.Init();
  }

  Init() {
    this.entityManager = new entity_manager.EntityManager();
    this.previousRAF = null;

    this.LoadControllers();
    this.RAF();
  }

  LoadControllers() {
    // Init Scene and Camera
    const threeJS = new entity.Entity();
    threeJS.AddComponent(new threejs_controller.ThreeJSController());
    this.entityManager.Add(threeJS, "threeJS");

    this._threeJS = threeJS.GetComponent("ThreeJSController");
    this._scene = this._threeJS.scene;
    this._camera = this._threeJS.camera;
    this._gizmos = new gizmos.DrawGizmos(this._scene);

    const basicParams = {
      scene: this._scene,
      camera: this._camera,
      gizmos: this._gizmos,
    };

    // Init Loader (used to load assets)
    const load = new entity.Entity();
    load.AddComponent(new load_controller.LoadController());
    this.entityManager.Add(load, "loader");

    // Init Spawner (handles anything that gets spawned, ex) levels, player, enemies..)
    const spawner = new entity.Entity();
    spawner.AddComponent(new spawners.LevelSpawner(basicParams));

    const grid = new entity.Entity();
    grid.AddComponent(new irregular_grid.DrawGrid(basicParams));

    // Add spawner to entity manager
    this.entityManager.Add(spawner, "spawners");
    this.entityManager.Add(grid, "grid");
    
    // Spawn Entities
    spawner.GetComponent("LevelSpawner").Spawn();
  }

  RAF() {
    requestAnimationFrame((t) => {
      if (this.previousRAF === null) {
        this.previousRAF = t;
      }

      this.RAF();

      this.Step(t - this.previousRAF);
      this.previousRAF = t;
    });
  }

  Step(timeElapsed) {
    const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);

    this.entityManager.Update(timeElapsedS);
    this._threeJS.Render();
  }
}

let App = null;

window.addEventListener("DOMContentLoaded", () => {
  App = new Demo();
});
