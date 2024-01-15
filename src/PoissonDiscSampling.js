import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

export const poisson_disc_sampling = (() => {
  class SpawnPoints {
    constructor(radius, width, height, numSamplesBeforeReject) {
      this.activePoints = []; //Stores points actively being checked in the grid
      this.sites = [];
      this.grid = [];

      // Set grid cell size
      this.cellSize = radius / Math.sqrt(2);

      // Initialize background grid
      this.cols = Math.floor(width / this.cellSize);
      this.rows = Math.floor(height / this.cellSize);
      for (let index = 0; index < this.cols * this.rows; index++) {
        this.grid[index] = undefined;
      }

      // Spawn initial sample in center of grid
      var posX = width / 2; //Get center of sample region
      var posY = height / 2;
      var x = Math.floor(posX / this.cellSize); //Convert to integer for grid index
      var y = Math.floor(posY / this.cellSize);
      this.orginPoint = new THREE.Vector2(posX, posY); //Create vector for sample
      this.grid[x + y * this.cols] = this.orginPoint; //Place into grid
      this.activePoints.push(this.orginPoint); //Place point into active grid
      this.sites.push(this.orginPoint);

      this.GeneratePoints(radius, numSamplesBeforeReject);
      //this.Draw();

      return this.sites;
    }

    GeneratePoints(radius, numSamplesBeforeReject) {
      //Spawn points
      while (this.activePoints.length > 0) {
        // Choose a random index
        let randIndex = Math.floor(Math.random() * this.activePoints.length);
        let activePointPos = this.activePoints[randIndex];
        let found = false;

        // Generate rejection samples
        for (let index = 0; index < numSamplesBeforeReject; index++) {
          // Get random angle
          var angle = Math.random() * Math.PI * 2;
          var offsetX = Math.cos(angle);
          var offsetY = Math.sin(angle);
          var sample = new THREE.Vector2(offsetX, offsetY);
          let randMagnitute = Math.random() * (2 * radius - radius) + radius;
          sample.setLength(randMagnitute);
          sample.add(activePointPos);
          let intx = Math.floor(sample.x);
          //let intx = sample.x;
          let inty = Math.floor(sample.y);
          //let inty = sample.y;
          sample = new THREE.Vector2(intx, inty);

          let col = Math.floor(sample.x / this.cellSize);
          let row = Math.floor(sample.y / this.cellSize);

          if (
            col > -1 &&
            row > -1 &&
            col < this.cols &&
            row < this.rows &&
            !this.grid[col + row * this.cols]
          ) {
            let sampleAccepted = true;

            for (let y = -1; y <= 1; y++) {
              for (let x = -1; x <= 1; x++) {
                let index = col + y + (row + x) * this.cols;
                var adjacent = this.grid[index];
                //Check if a sample is in the region
                if (adjacent) {
                  const dist = sample.distanceTo(adjacent);

                  // If sample is too close
                  if (dist < radius) {
                    sampleAccepted = false;
                  }
                }
              }
            }

            if (sampleAccepted) {
              found = true;
              this.grid[col + row * this.cols] = sample;
              this.activePoints.push(sample);

              this.sites.push(sample);
              break;
            }
          }
        }

        if (!found) {
          this.activePoints.splice(randIndex, 1);
        }
      }
    }

    Draw() {
      var points = [];
      // Create points for grid
      for (let index = 0; index < this.sites.length; index++) {
        if (this.sites[index]) {
          const geometry = new THREE.BoxGeometry(1, 1, 1);
          const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
          const point = new THREE.Mesh(geometry, material);
          this.scene.add(point);
          points.push(point);
          point.position.set(this.sites[index].x, 0, this.sites[index].y);
        }
      }
    }
  }

  return { SpawnPoints: SpawnPoints };
})();
