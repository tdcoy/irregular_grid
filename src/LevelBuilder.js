import * as THREE from "three";
import { entity } from "./Entity.js";
import { render_component } from "./RenderComponent.js";
import { prims } from "./Prims.js";
import { delaunay_triangulation } from "./DelaunayTriangulation.js";
import { aStarSearch } from "./AStarSearch.js";

export const level_builder = (() => {
  class LevelBuilder extends entity.Component {
    constructor(_params) {
      super();
      this.params = _params;
      this.spawned = false;
      this.materials = {};
    }

    Remove(element, arr) {
      let index = arr.indexOf(element);
      arr.splice(index, 1);
    }

    GenerateSpawnPoints(cells) {
      let spawnPoints = [];
      for (let i = 0; i < 40; i++) {
        let spawn = Math.floor(Math.random() * cells.length);

        spawnPoints.push(cells[spawn]);
      }
      return spawnPoints;
    }

    GetClosestSpawnPoint(p, spawnPoints) {
      let point = p.center().vector();
      let closest = spawnPoints[0];
      let shortest = point.distanceTo(spawnPoints[0].center().vector());

      for (let i = 1; i < spawnPoints.length; i++) {
        let spawnPoint = spawnPoints[i].center().vector();
        let dist = point.distanceTo(spawnPoint);

        if (dist < shortest) {
          closest = spawnPoints[i];
        }
      }

      return closest;
    }

    UpdateSpawnPoints(room, spawnPoints) {
      // Update spawn points
      let roomCells = room.cells();

      for (let i = 0; i < roomCells.length; i++) {
        for (let j = 0; j < spawnPoints.length; j++) {
          if (spawnPoints[j].equals(roomCells[i])) {
            this.Remove(spawnPoints[j], spawnPoints);
          }
        }
      }
    }

    /* 
       2D array containing every node in the room centers list and the nodes they are connected to
       The position of each center point in centers[] coorelates to that same node in nodes[]

          0  1  2  3 ... n
       0  0  3  0  0 ... n  --> in this row node 0 is connected to node 1 with weight of 3
       1  0  0  3  0 ... n  --> node 1 is connected to node 3 with a weight of 2
       .
       .
       n
    */
    GenerateNodes(rooms) {
      let centerPoints = []; // Vector2's of each room's center
      let nodes = []; // Array of each nodes adjacency to the other nodes

      //#region Setup

      for (let i = 0; i < rooms.length; i++) {
        // Store center point of each room
        let p = rooms[i].center().center().vector();
        centerPoints.push(p);

        // Initialize nodes
        let row = new Array(rooms.length).fill(0);
        nodes.push(row);
      }

      // Triangulate center points
      const tris = new delaunay_triangulation.Triangulate(centerPoints);

      // Set node adjacency
      for (let i = 0; i < centerPoints.length; i++) {
        let nodeA = centerPoints[i];

        for (let j = 0; j < tris.length; j++) {
          let edges = tris[j].getEdges();
          for (let k = 0; k < edges.length; k++) {
            //If this edge is connected to the current center point,
            // the other point in the edge is also a node connected to
            // this center point.
            let nodeB = undefined;

            if (nodeA.equals(edges[k].v0)) {
              nodeB = edges[k].v1;
            }
            if (nodeA.equals(edges[k].v1)) {
              nodeB = edges[k].v0;
            }

            if (nodeB != undefined) {
              const indexNodeB = getPointIndex(nodeB, centerPoints);
              const dist = edges[k].getDistBetweenVerts();
              nodes[i][indexNodeB] = calcWeights(
                rooms[i],
                rooms[indexNodeB],
                dist
              );
            }
          }
        }
      }

      //#endregion

      /*
        Weights should be calculated by:
          If the nodes are a major room and its support room = 1
          If the nodes are 2 major rooms = dist/2
          If the node is a major room and a ward = dis/3
          Else the weight is just the distance between the 2
      */
      function calcWeights(roomA, roomB, dist) {
        let weight = 0;

        if (roomA.supportRooms().length > 0) {
          if (roomA.supportRooms().includes(roomB)) {
            weight = 1;
          }
        } else if (roomA.supportRooms() == 0 && roomB.supportRooms() == 0) {
          weight = Math.floor(dist) / 2;
        } else {
          weight = Math.floor(dist);
        }

        return weight;
      }

      function getPointIndex(p, points) {
        for (let i = 0; i < points.length; i++) {
          if (points[i].equals(p)) {
            return i;
          }
        }
        return -1;
      }

      return nodes;
    }

    Update(timeElapsed) {
      if (this.spawned) {
        return;
      }
      this.spawned = true;

      //#region Player Reference

      const player_ref = new entity.Entity();
      player_ref.SetPosition(new THREE.Vector3(10, 0, 0));
      player_ref.AddComponent(
        new render_component.RenderComponent({
          scene: this.params.scene,
          resourcePath: "./dist/models/",
          resourceName: "player_ref.glb",
          scale: new THREE.Vector3(1, 1, 1),
          emissive: new THREE.Color(0x000000),
          color: new THREE.Color(0xffffff),
        })
      );
      this.Manager.Add(player_ref, "player_ref");

      //#endregion

      const gridSize = 6;
      const roomGen = this.GetComponent("RoomGenerator");
      this.grid = this.GetComponent("DrawGrid");
      this.solver = this.GetComponent("TileSolver");

      //-----------Generate grid----------
      let cells = this.grid.GenerateGrid(gridSize);

      // Draw cells
      for (let i = 0; i < cells.length; i++) {
        this.params.gizmos.DrawShortestPath(
          cells[i],
          0,
          new THREE.Color("yellow")
        );
      }

      //----------Generate room spawn points----------
      let spawnPoints = this.GenerateSpawnPoints(cells);

      /*********Need to be able to spawn in a new chunk of 
                grid if the room generator runs out of cells***************/
      //----------Generate rooms----------
      let builtRooms = [];
      let roomsToBuild = [new GreatHall(), new Kitchen()];

      for (let i = 0; i < roomsToBuild.length; i++) {
        // Get random spawn point
        let randIndex = Math.floor(Math.random() * spawnPoints.length);
        let spawnPoint = spawnPoints[randIndex];

        // Generate main room
        roomGen.GenerateRoom(spawnPoint, roomsToBuild[i]);
        builtRooms.push(roomsToBuild[i]);
        this.UpdateSpawnPoints(roomsToBuild[i], spawnPoints);

        // Check for support rooms to build and there are spawn points available
        if (
          roomsToBuild[i].supportRooms().length > 0 &&
          spawnPoints.length > 0
        ) {
          let supportRooms = roomsToBuild[i].supportRooms();

          for (let i = 0; i < supportRooms.length; i++) {
            // Find closest spawn point to the room
            const closestSpawnPoint = this.GetClosestSpawnPoint(
              roomsToBuild[i].center(),
              spawnPoints
            );

            // Generate support room
            roomGen.GenerateRoom(closestSpawnPoint, supportRooms[i]);
            builtRooms.push(supportRooms[i]);
            this.UpdateSpawnPoints(supportRooms[i], spawnPoints);
          }
        }
      }

      //----------Generate Hallways----------
      // Get MST between each room
      const nodes = this.GenerateNodes(builtRooms);
      console.log(nodes);
      console.log(builtRooms);
      const mst = new prims.MST(nodes);

      const search = new aStarSearch.AStar();

      for (let i = 1; i < mst.length; i++) {
        // Reset cell values
        for (let j = 0; j < cells.length; j++) {
          cells[j].clear();
        }

        let start = builtRooms[i].center();
        let end = builtRooms[mst[i]].center();
        let path = search.FindPath(end, start); // Need to update to use cells

        let hallwayCells = [];

        for (let i = 0; i < path.length; i++) {
          // If this cell isn't part of a room then create a hallway from this path of empty cells
          if (path[i].room() == null) {
            hallwayCells.push(path[i]);
          }
        }

        if (hallwayCells.length > 0) {
          const hallway = new Hallway();
          hallway.addCells(hallwayCells);
          builtRooms.push(hallway);
        }
      }

      //----------Generate rooms mesh----------
      for (let i = 0; i < builtRooms.length; i++) {
        this.solver.setupTiles(builtRooms[i]);
        this.solver.generateTile(builtRooms[i]);
      }

      //#region Debug stuff
      // Draw spawn points
      for (let i = 0; i < spawnPoints.length; i++) {
        this.params.gizmos.DrawPoint(
          spawnPoints[i].center().vector(),
          new THREE.Color("orange"),
          1
        );
      }

      // Draw available cells
      for (let i = 0; i < cells.length; i++) {
        this.params.gizmos.DrawPoint(
          cells[i].center().vector(),
          new THREE.Color("blue"),
          0.5
        );
      }

      // Draw MST path
      for (let i = 1; i < mst.length; i++) {
        let pointA = builtRooms[i].center().center().vector();
        let pointB = builtRooms[mst[i]].center().center().vector();

        let points = [];
        points.push(pointA);
        points.push(pointB);

        this.params.gizmos.DrawLinesBetweenPoints(
          points,
          new THREE.Color("blue"),
          2
        );
      }
      //#endregion
    }
  }

  class Room {
    constructor() {
      this._cells = [];
      this._tiles = [];
      this._center = undefined;
      this._size = 4;
      this._type = "";
      this._supportRooms = [];
    }

    addCells(cells) {
      for (let i = 0; i < cells.length; i++) {
        this._cells.push(cells[i]);
      }
    }

    cells() {
      return this._cells;
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
      if (this._center == undefined) {
        this._center = this._cells[0];
      }
      return this._center;
    }

    position() {
      return this.center().center().vector();
    }

    size() {
      return this._size;
    }

    supportRooms() {
      return this._supportRooms;
    }

    type() {
      return this._type;
    }
  }

  class Hallway extends Room {
    constructor() {
      super();
      this._size = 2;
      this._type = "Hallway";
    }
  }

  class GreatHall extends Room {
    constructor() {
      super();
      this._size = 12;
      this._type = "GreatHall";
      this._supportRooms = [new Chapel()];
    }
  }

  class Kitchen extends Room {
    constructor() {
      super();
      this._size = 6;
      this._type = "Kitchen";
      this._supportRooms = [new Bottlery(), new Buttlery()];
    }
  }

  class Chapel extends Room {
    constructor() {
      super();
      this._size = 5;
      this._type = "Chapel";
    }
  }

  class Bottlery extends Room {
    constructor() {
      super();
      this._size = 6;
      this._type = "Bottlery";
    }
  }

  class Buttlery extends Room {
    constructor() {
      super();
      this._size = 5;
      this._type = "Buttlery";
    }
  }

  return { LevelBuilder: LevelBuilder };
})();
