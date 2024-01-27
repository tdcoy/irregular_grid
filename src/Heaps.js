import * as THREE from "three";

export const heaps_permutation = (() => {
  class HeapsPermutation {
    constructor() {
      this.shortestDist = Infinity;
      this.shortestPath = [];
    }

    findShortestPath(perms) {
      let permutations = perms.slice();
      let shortestTotalDist = Infinity;
      let shortestPath = [];

      for (let i = 0; i < permutations.length; i++) {
        let totalDist = 0;
        for (let j = 0; j < permutations[i].length - 1; j++) {
          let v1 = new THREE.Vector2().copy(permutations[i][j]);
          let v2 = new THREE.Vector2().copy(permutations[i][j + 1]);

          totalDist += v1.distanceTo(v2);
        }

        if (totalDist < shortestTotalDist) {
          shortestTotalDist = totalDist;
          shortestPath = permutations[i].slice();
        }
      }

      return shortestPath;
    }

    generatePermutations(Arr) {
      var permutations = [];
      var A = Arr.slice();

      function swap(a, b) {
        var tmp = A[a];
        A[a] = A[b];
        A[b] = tmp;
      }

      function generate(n, A) {
        if (n == 1) {
          permutations.push(A.slice());
        } else {
          for (var i = 0; i <= n - 1; i++) {
            generate(n - 1, A);
            swap(n % 2 == 0 ? i : 0, n - 1);
          }
        }
      }
      generate(A.length, A);
      return permutations;
    }

    generateRoutes(points) {
      var pems = this.generatePermutations(points.slice(1));
      for (var i = 0; i < pems.length; i++) {
        pems[i].unshift(points[0]);
        pems[i].push(points[0]);
      }
      return pems;
    }
  }

  return { HeapsPermutation: HeapsPermutation };
})();
