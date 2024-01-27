import * as THREE from "three";
import { entity } from "./Entity.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { trilinear_lattice } from "./TrilinearLattice.js";

/* 
  -Stencil buffer for doors/windows

  - Create tiles
    - flip and rotated versions?
  - indexing
*/
export const tile_solver = (() => {
  class TileSolver extends entity.Component {
    constructor(_params) {
      super();
      this.params = _params;

      //this.loadMesh(cells[0]);
    }

    InitComponent() {}

    setupTiles(room) {
      const cells = room.cells().slice();
      let tiles = [];

      // Create tiles
      for (let i = 0; i < cells.length; i++) {
        let tile = new Tile(cells[i]);
        tiles.push(tile);
      }

      // Set adjacent tiles
      for (let i = 0; i < tiles.length; i++) {
        let adjCells = tiles[i].cell().adjacent();

        for (let j = 0; j < adjCells.length; j++) {
          for (let k = 0; k < tiles.length; k++) {
            if (tiles[k].cell() === adjCells[j]) {
              tiles[i]._adjacent.push(tiles[k]);
            }
          }
        }
      }

      for (let i = 1; i < tiles.length; i++) {
        room.addTile(tiles[i]);
      }
    }

    generateTile(room) {
      let cells = room.cells();

      for (let i = 0; i < cells.length; i++) {
        this.loadMesh(cells[i]);
      }
    }

    solve() {
      const n = 100;
      const iterations = 0;

      while (cells.length > 0) {
        for (let i = 0; i < cells.length; i++) {
          findTile(cells[i]);
        }

        iterations++;
        if (iterations > n) {
          console.log("Too many iterations");
          break;
        }
      }
    }

    findTile(cell) {
      const adjCells = cell.adjacent();

      for (let i = 0; i < adjCells.length; i++) {}
    }

    loadMesh(cell, mesh) {
      const verts = cell.vertexs();

      //#region Create Trilinear Lattice
      const lattice = new trilinear_lattice.TrilinearLattice(
        new THREE.Vector3(-5, -5, -5),
        new THREE.Vector3(5, 5, 5)
      );

      const v0 = new THREE.Vector3(
        verts[0].vector().x,
        -5,
        verts[0].vector().y
      );
      const v1 = new THREE.Vector3(
        verts[1].vector().x,
        -5,
        verts[1].vector().y
      );
      const v2 = new THREE.Vector3(
        verts[2].vector().x,
        -5,
        verts[2].vector().y
      );
      const v3 = new THREE.Vector3(
        verts[3].vector().x,
        -5,
        verts[3].vector().y
      );
      lattice.setFootPrint(v1, v0, v3, v2, 10);
      //#endregion

      // Load mesh "./dist/models/test_wall.glb"
      const loader = new GLTFLoader();
      loader.setPath("./dist/models/");
      loader.load("floor_centered.glb", (gltf) => {
        const cube = gltf.scene;

        // Shadows
        cube.traverse(function (object) {
          if (object.isMesh) object.castShadow = true;
        });
        // Stops model from disapearing
        cube.traverse((child) => {
          child.frustumCulled = false;
        });

        // Interpolate tile vertices to cell position
        for (let i = 0; i < cube.children.length; i++) {
          if (cube.children[i].isMesh) {
            const geometry = cube.children[i].geometry;
            const position = geometry.attributes.position;

            // Get position vector
            for (let j = 0; j < position.count; j++) {
              let v3 = new THREE.Vector3().fromBufferAttribute(
                geometry.attributes.position,
                j
              );

              // Calculate interpolation
              let transform = this.interpolate(
                lattice.cube,
                lattice.minBound,
                lattice.maxBound,
                v3
              );

              // Set position data
              geometry.attributes.position.array[j * 3] = transform.x;
              geometry.attributes.position.array[j * 3 + 1] = transform.y;
              geometry.attributes.position.array[j * 3 + 2] = transform.z;
            }
          }
        }

        this.params.scene.add(cube);
      });
    }

    /*
        https://en.wikipedia.org/wiki/Trilinear_interpolation

        ~~~~~~~~~~~~~Wiki Example~~~~~~~~~~~~~         ~~~~~~~Lattice Cube~~~~~~~
            Front Face            Back Face           Front Face    Back Face
          c001------c101      c011-------c111           2----3        6----7
            |        |          |          |    --->    |    |        |    |
            |        |          |          |            0----1        4----5
          c000------c100      c010-------c110

        - minBound & maxBound come from bounds of cube to be morphed
        - p is the point to be translated from the morphed mesh
        - Lattice cube calculated from irregular grid face where verts: {0, 1, 4, 5} make up the irregulare grid face

        ~~~~~~~~~~~~~~~~~~~Interpolation~~~~~~~~~~~~~~~~~~~~~
        Differences between the current points position in relation to the bounds and the lattice cube:        
        xd = p.x - minBound.x / maxBound.x - minBound.x
        yd = p.y - minBound.y / maxBound.y - minBound.y
        zd = p.z - minBound.z / maxBound.z - minBound.z

        Interpolate along x axis:
        c00 = cube0(1 - xd) + cube1(xd)
        c01 = cube2(1 - xd) + cube3(xd)
        c10 = cube4(1 - xd) + cube5(xd)
        c11 = cube6(1 - xd) + cube7(xd)

        Interpolate along y axis:
        c0 = c00(1 - yd) + c10(yd)
        c1 = c01(1 - yd) + c11(yd)

        Interpolate along z axis
        c = c0(1 - zd) + c1(zd)

        Where c is the predicted value for where the point p, should lie after the translation.
     */
    interpolate(cube, _min, _max, _p) {
      //#region Setup
      let min = _min.clone();
      let max = _max.clone();
      let p = _p.clone();

      let xd = (p.x - min.x) / (max.x - min.x);
      let yd = (p.y - min.y) / (max.y - min.y);
      let zd = (p.z - min.z) / (max.z - min.z);

      let c00,
        c01,
        c10,
        c11,
        c0,
        c1,
        c = new THREE.Vector3();

      let cube0 = cube[0].clone();
      let cube1 = cube[1].clone();
      let cube2 = cube[2].clone();
      let cube3 = cube[3].clone();
      let cube4 = cube[4].clone();
      let cube5 = cube[5].clone();
      let cube6 = cube[6].clone();
      let cube7 = cube[7].clone();
      //#endregion

      // Interpolate along x axis
      c00 = cube0.multiplyScalar(1 - xd).add(cube1.multiplyScalar(xd));
      c01 = cube4.multiplyScalar(1 - xd).add(cube5.multiplyScalar(xd));
      c10 = cube2.multiplyScalar(1 - xd).add(cube3.multiplyScalar(xd));
      c11 = cube6.multiplyScalar(1 - xd).add(cube7.multiplyScalar(xd));

      // Interpolate along y axis
      c0 = c00.multiplyScalar(1 - yd).add(c10.multiplyScalar(yd));
      c1 = c01.multiplyScalar(1 - yd).add(c11.multiplyScalar(yd));

      // Interpolate along z axis
      c = c0.multiplyScalar(1 - zd).add(c1.multiplyScalar(zd));

      return c;
    }
  }

  class Room {
    constructor(center, size) {
      this._tiles = [];
      this._center = this.setCenter(center);
      this._size = size;
    }

    tiles() {
      return this._tiles;
    }

    addTile(t) {
      this._tiles.push(t);
    }

    setCenter(c) {
      this.addTile(c);
      return c;
    }

    center() {
      return this._center;
    }

    size() {
      return this._size;
    }
  }

  class Tile {
    constructor(cell) {
      this._cell = cell;
      this._adjacent = [];
    }

    setAdjacent() {}

    cell() {
      return this._cell;
    }
  }
  return { TileSolver: TileSolver };
})();
