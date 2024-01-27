import * as THREE from "three";
import { entity } from "./Entity.js";

/* 
  Generate rooms on irregular grid
*/
export const room_generator = (() => {
  class RoomGenerator extends entity.Component {
    constructor(_params) {
      super();
      this.params = _params;
    }

    InitComponent() {}

    GenerateRoom(spawnPoint, room) {
      const size = room.size();
      let roomCells = room.cells();

      // Set spawn point
      spawnPoint.setRoom(room);
      roomCells.push(spawnPoint);

      let n = 300;
      let iterations = 0;
      let curCell = spawnPoint;

      // Build room
      while (roomCells.length < size) {
        const adjCells = curCell.adjacent();
        for (let i = 0; i < adjCells.length; i++) {
          if (adjCells[i].isAvailable()) {
            roomCells.push(adjCells[i]); // Add this cell to the rooms cell list
            adjCells[i].setRoom(room); // Set this cells room to this room
            curCell = adjCells[i]; // Set the curCell to this cell
          }
        }

        // Incase I fuck something up
        iterations++;
        if (iterations > n) {
          console.log("ran over iteration limit trying to build", room);
          break;
        }
      }

      // Do this until the returned size is the same as previous size passed to it
      let lastTileCount = roomCells.length;
      let curTileCount = 0;
      let i = 0;

      let maxIterations = 100;

      while (lastTileCount != curTileCount) {
        // Fill in any available cells that room cells share edges with
        lastTileCount = roomCells.length;
        this.FillIn(room);
        curTileCount = roomCells.length;

        i++;
        if (i > maxIterations) {
          console.log("Too many iterations trying to fill in");
          break;
        }
      }
    }

    RemoveOutliers(cells) {
      let outliers = [];
      for (let i = 0; i < cells.length; i++) {
        if (this.Outlier(cells[i], cells)) {
          outliers.push(cells[i]);
        }
      }

      for (let i = 0; i < outliers.length; i++) {
        this.Remove(outliers[i], cells);
      }
    }

    Outlier(cell, cells) {
      const adjCells = cell.adjacent();
      let count = 0;
      for (let j = 0; j < adjCells.length; j++) {
        // If the room doenst contain 2 or more adjacent cells then this is an outlier
        if (this.Contains(adjCells[j], cells)) {
          count++;
        }
      }
      if (count > 1) {
        return false;
      }

      return true;
    }

    Contains(cell, cells) {
      if (cells.length == 0) {
        return false;
      }

      for (let i = 0; i < cells.length; i++) {
        if (cells[i].equals(cell)) {
          return true;
        }
      }
      return false;
    }

    Remove(cell, cells) {
      let index = cells.indexOf(cell);
      cells.splice(index, 1);
    }

    FillIn(room) {
      //let cells = roomCells.slice();
      let canidates = [];

      let roomCells = room.cells(); // Get reference to the cells in this room

      for (let i = 0; i < roomCells.length; i++) {
        const adjCells = roomCells[i].adjacent(); // Get reference to adjacent cells for each cell in this room

        // Check if the adjacent cell is shared by another cell in this room
        for (let j = 0; j < adjCells.length; j++) {
          // If the cells are available
          if (adjCells[j].isAvailable()) {
            canidates.push(adjCells[j]);
          }
        }
      }

      // Get the duplicate cells
      for (let i = 0; i < canidates.length; i++) {
        for (let j = 0; j < canidates.length; j++) {
          // If this is itself
          if (i === j) {
            continue;
          }
          // If there are duplicates of this cell
          else {
            // If fillcells doesn't alreay have this duplicate added
            if (canidates[i] === canidates[j] && canidates[i].room() != room) {
              //fillCells.push(canidates[i]);
              roomCells.push(canidates[i]);
              canidates[i].setRoom(room);
            }
          }
        }
      }
    }
  }
  return { RoomGenerator: RoomGenerator };
})();
