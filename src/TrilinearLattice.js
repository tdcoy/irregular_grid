import * as THREE from "three";

// https://github.com/sketchpunklabs/irregular_grid/blob/main/trilinear/TrilinearLattice.js
export const trilinear_lattice = (() => {
  class TrilinearLattice {
    constructor(min = null, max = null) {
      if (min && max) {
        this.init();
        this.setBounds(min, max);
      }
    }

    init() {
      this.minBound = new THREE.Vector3();
      this.maxBound = new THREE.Vector3();
      this.cube = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 0),
      ];
    }

    setBounds(min, max) {
      this.minBound = new THREE.Vector3();
      this.minBound.copy(min);
      this.maxBound = new THREE.Vector3();
      this.maxBound.copy(max);

      this.updateCube();
      return this;
    }

    addOffset(index, offset) {
      const i = index * 3;
      this.cube[i + 0] += offset[0];
      this.cube[i + 1] += offset[1];
      this.cube[i + 2] += offset[2];
      return this;
    }

    setPos(index, pos) {
      const i = index * 3;
      this.cube[i + 0] = pos[0];
      this.cube[i + 1] = pos[1];
      this.cube[i + 2] = pos[2];
      return this;
    }

    updateCube() {
      const min = new THREE.Vector3().copy(this.minBound);
      const max = new THREE.Vector3().copy(this.maxBound);
      const cube = this.cube;

      set(cube, 0, min.x, min.y, min.z);
      set(cube, 1, max.x, min.y, min.z);
      set(cube, 2, min.x, max.y, min.z);
      set(cube, 3, max.x, max.y, min.z);
      set(cube, 4, min.x, min.y, max.z);
      set(cube, 5, max.x, min.y, max.z);
      set(cube, 6, min.x, max.y, max.z);
      set(cube, 7, max.x, max.y, max.z);

      function set(out, index, x, y, z) {
        out[index] = new THREE.Vector3(x, y, z);
      }
    }

    setFootPrint(a, b, c, d, yOffset = 0) {
      const cube = this.cube;

      // Bottom plane: clockwise from top left vertex
      set(cube, 0, a.x, a.y, a.z);
      set(cube, 1, b.x, b.y, b.z);
      set(cube, 5, c.x, c.y, c.z);
      set(cube, 4, d.x, d.y, d.z);
      // Top plane: lockwise from top left vertex
      set(cube, 2, a.x, a.y + yOffset, a.z);
      set(cube, 3, b.x, b.y + yOffset, b.z);
      set(cube, 7, c.x, c.y + yOffset, c.z);
      set(cube, 6, d.x, d.y + yOffset, d.z);

      function set(out, index, x, y, z) {
        out[index] = new THREE.Vector3(x, y, z);
      }
    }
  }
  return { TrilinearLattice: TrilinearLattice };
})();
