import * as THREE from "three";
import { entity } from "./Entity.js";
import { delaunay_triangulation } from "./DelaunayTriangulation.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { trilinear_lattice } from "./TrilinearLattice.js";
import { tile_solver } from "./TileSolver.js";

export const irregular_grid = (() => {
  class DrawGrid extends entity.Component {
    constructor(_params) {
      super();
      this.params = _params;
      this.scene = this.params.scene;
      this.gizmos = this.params.gizmos;
      this.centerPoints = [];
      this.gridBuilt = false;
      this.faces = [];
      this.vertices = [];
      this.cellSize = 10;
    }

    InitComponent() {}

    GenerateGrid(size) {
      var points = this.GeneratePoints(size);

      // Triangulate vertices
      var triangles = new delaunay_triangulation.Triangulate(points);
      var trisInHex = [];

      // Check if triangle contains center point
      for (let i = 0; i < triangles.length; i++) {
        let t = triangles[i];
        for (let j = 0; j < this.centerPoints.length; j++) {
          let c = this.centerPoints[j];

          if (t.v0.equals(c) || t.v1.equals(c) || t.v2.equals(c)) {
            trisInHex.push(t);
          }
        }
      }

      // Create Faces
      var faces = [];
      for (let i = 0; i < trisInHex.length; i++) {
        let f = new Face(trisInHex[i].vertices());
        faces.push(f);
      }

      // Set Adjacent Faces
      for (let i = 0; i < faces.length; i++) {
        faces[i].setAdjFaces(faces);
      }

      let quads = this.CreateQuads(faces);

      // Subdivide Faces
      var newFaces = [];
      for (let i = 0; i < quads.length; i++) {
        let q = quads[i].subdivide();

        for (let j = 0; j < q.length; j++) {
          newFaces.push(q[j]);
        }
      }

      // Set Adjacent Faces
      for (let i = 0; i < newFaces.length; i++) {
        newFaces[i].setAdjFaces(newFaces);
      }

      // Remove Duplicated Edges
      var edges = [];
      for (let i = 0; i < newFaces.length; i++) {
        let edge = newFaces[i].edges();

        for (let j = 0; j < edge.length; j++) {
          // If the list of edges does not include this edge
          let checkIfInEdges = CheckDupEdges(edges, edge[j]);

          // If this edge is not in the edge list
          if (checkIfInEdges == -1) {
            edge[j]._faces.push(newFaces[i]);
            edges.push(edge[j]);
          } else {
            // If it does include this edge
            edges[checkIfInEdges]._faces.push(newFaces[i]);
          }
        }
      }

      // Remove Duplicated Vertices
      var vertices = [];
      for (let i = 0; i < edges.length; i++) {
        let verts = edges[i].vertices();

        for (let k = 0; k < verts.length; k++) {
          let checkIfInVertices = CheckDupVerts(vertices, verts[k]);
          let isBorder = false;

          if (edges[i]._faces.length == 1) {
            isBorder = true;
          }

          if (checkIfInVertices == -1) {
            // Create Vertex
            let v = new Vertex(verts[k], isBorder);
            v.addEdge(edges[i]);
            vertices.push(v);
            edges[i]._vertices[k] = v;
          }

          // Update Vertex to include in duplicate vertice information
          else {
            vertices[checkIfInVertices].addEdge(edges[i]);

            if (isBorder) {
              vertices[checkIfInVertices]._border = isBorder;
            }

            edges[i]._vertices[k] = vertices[checkIfInVertices];
          }
        }
      }

      // Update faces with new Vertex
      for (let i = 0; i < newFaces.length; i++) {
        let verts = newFaces[i].vertices();

        for (let j = 0; j < verts.length; j++) {
          newFaces[i]._vertexs.push(this.FindVertex(vertices, verts[j]));
        }
      }

      function CheckDupVerts(list, vert) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].vector().equals(vert)) {
            return i;
          }
        }
        return -1;
      }

      function CheckDupEdges(list, edge) {
        for (let i = 0; i < list.length; i++) {
          if (list[i].equals(edge)) {
            return i;
          }
        }
        return -1;
      }

      // Calculate Sub-Divided Faces Centers
      for (let i = 0; i < newFaces.length; i++) {
        this.CalculateCenter(newFaces[i]);
      }

      this.faces = newFaces.slice();
      this.vertices = vertices.slice();

      for (let i = 0; i < 10; i++) {
        this.Relax();
      }

      // Draw Faces
      /* for (let i = 0; i < this.faces.length; i++) {
        this.gizmos.DrawShortestPath(
          this.faces[i],
          0,
          new THREE.Color("yellow")
        );
      } */

      return this.faces;
    }

    CreateCells() {
      for (let h = 0; h < this.faces.length; h++) {
        let face = this.faces[h].vertexs();

        //#region Create Trilinear Lattice
        const lattice = new trilinear_lattice.TrilinearLattice(
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(10, 10, 10)
        );

        const v0 = new THREE.Vector3(face[0].vector().x, 0, face[0].vector().y);
        const v1 = new THREE.Vector3(face[1].vector().x, 0, face[1].vector().y);
        const v2 = new THREE.Vector3(face[2].vector().x, 0, face[2].vector().y);
        const v3 = new THREE.Vector3(face[3].vector().x, 0, face[3].vector().y);
        lattice.setFootPrint(v1, v0, v3, v2, 10);
        //#endregion

        // Load mesh "./dist/models/test_wall.glb"
        const loader = new GLTFLoader();
        loader.setPath("./dist/models/");
        loader.load("floor.glb", (gltf) => {
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
    }

    CreateQuads(faces) {
      let available = faces.slice();
      let used = [];

      let complete = false;

      let iterations = 0;
      let n = 100;

      while (!complete) {
        if (available.length < 2) {
          complete = true;
          continue;
        }

        let randIndex = Math.floor(Math.random() * available.length);
        let randFace = available[randIndex];

        if (randFace.vertices().length == 3) {
          let adj = randFace.adjacent();
          let canidates = [];

          for (let i = 0; i < adj.length; i++) {
            if (adj[i].vertices().length == 3 && available.includes(adj[i])) {
              canidates.push(adj[i]);
            }
          }

          if (canidates.length > 0) {
            let rand = Math.floor(Math.random() * canidates.length);
            let randCanidate = canidates[rand];

            let unSharedVerts = [];
            let sharedVerts = [];

            let faceAEdges = randFace.edges();
            let faceBEdges = randCanidate.edges();
            let faceAVerts = randFace.vertices();
            let faceBVerts = randCanidate.vertices();
            let sharedEdge = undefined;

            for (let i = 0; i < faceAEdges.length; i++) {
              for (let j = 0; j < faceBEdges.length; j++) {
                if (faceAEdges[i].equals(faceBEdges[j])) {
                  sharedVerts.push(faceAEdges[i].v0);
                  sharedVerts.push(faceAEdges[i].v1);
                  sharedEdge = faceAEdges[i];
                }
              }
            }

            for (let i = 0; i < faceAVerts.length; i++) {
              if (!sharedVerts.includes(faceAVerts[i])) {
                unSharedVerts.push(faceAVerts[i]);
              }
            }

            for (let i = 0; i < faceBVerts.length; i++) {
              if (!sharedVerts.includes(faceBVerts[i])) {
                unSharedVerts.push(faceBVerts[i]);
              }
            }

            let quadVerts = [];

            quadVerts.push(unSharedVerts[0]);
            quadVerts.push(sharedVerts[0]);
            quadVerts.push(unSharedVerts[1]);
            quadVerts.push(sharedVerts[1]);

            // Add new face to list of faces
            let f = new Face(quadVerts);

            f._center = sharedEdge.getMidpoint();

            // Remove the 2 triangles that were combined to form the new face
            available.splice(randIndex, 1);

            for (let i = 0; i < available.length; i++) {
              if (available[i] === randCanidate) {
                available.splice(i, 1);
                break;
              }
            }

            used.push(f);
          }
        }

        if (iterations > n) {
          for (let i = 0; i < available.length; i++) {
            used.push(available[i]);
          }
          break;
        }
        iterations++;
      }
      //console.log(used);
      return used;
    }

    CreateEdges(faces) {
      for (let i = 0; i < faces.length; i++) {
        let e = faces.edges();

        for (let j = 0; j < e.length; j++) {
          // If this edge is NOT in the edge list
          if (!this.edges.includes(e[j])) {
            this.edges.push(e[j]);
          } else {
          }
        }
      }
    }

    GeneratePoints(numCells) {
      var radius = 20;
      var cells = numCells;
      var points = [];

      var numPointsX = 2 * (cells - 1) + 4;
      var numPointsY = cells * 2;

      var offsetX,
        offsetY = 0;

      for (let y = 0; y < numPointsY; y++) {
        for (let x = 0; x < numPointsX; x++) {
          offsetX = (Math.sqrt(3) / 2) * radius * x;

          // If x is odd, offset vertical points by sqr3/2
          if (x % 2 == 0) {
            offsetY = radius / 2 + radius * y;
          } else {
            offsetY = radius * y;
          }

          offsetX = Math.round((offsetX + Number.EPSILON) * 100) / 100;
          offsetY = Math.round((offsetY + Number.EPSILON) * 100) / 100;

          points.push(new THREE.Vector2(offsetX, offsetY));
        }
      }

      var xPos,
        yPos = 0;
      // Center Points
      for (let y = 0; y < cells; y++) {
        for (let x = 0; x < cells; x++) {
          if (y % 2 == 0) {
            xPos = (Math.sqrt(3) / 2 + Math.sqrt(3) * x) * radius;
          } else {
            xPos = (Math.sqrt(3) + Math.sqrt(3) * x) * radius;
          }

          yPos = (3 / 3 + (3 / 2) * y) * radius;

          xPos = Math.round((xPos + Number.EPSILON) * 100) / 100;
          yPos = Math.round((yPos + Number.EPSILON) * 100) / 100;

          this.centerPoints.push(new THREE.Vector2(xPos, yPos));
        }
      }

      return points;
    }

    ApplyRelaxForces(faces, vertices) {
      let force = new THREE.Vector2();
      let tempV2 = new THREE.Vector2();

      // Create velocity data for all vertices
      let velcocities = new Array(vertices.length);
      for (let i = 0; i < vertices.length; i++) {
        velcocities[i] = new THREE.Vector2();
      }

      for (let i = 0; i < faces.length; i++) {
        let verts = faces[i]._vertexs;

        for (let j = 0; j < 4; j++) {
          // Get each vertice used in this face
          let v = this.FindVertex(vertices, verts[j]);

          if (v.border()) {
            continue;
          }

          tempV2.subVectors(v.vector(), faces[i]._center);
          force.add(v);

          // Rotate Force 90 degrees
          let temp = force.x;
          force.x = force.y;
          force.y = -temp;
        }

        force.divideScalar(4);

        // Create Velocity for each vertice
        for (let i = 0; i < faces.length; i++) {
          let verts = faces[i]._vertexs;

          for (let j = 0; j < 4; j++) {
            // Get each vertice used in this face
            let v = this.FindVertex(vertices, verts[j]);

            if (v.border()) {
              continue;
            }

            // Rotate Force 90 degrees
            let temp = force.x;
            force.x = force.y;
            force.y = -temp;

            tempV2.addVectors(faces[i]._center, force).sub(v.vector());
            velcocities[vertices.indexOf(v)].add(force);
          }
        }

        // Apply velocity to all vertices
        for (let i = 0; i < vertices.length; i++) {
          if (vertices[i].border()) {
            continue;
          }

          tempV2.x = velcocities[i].x * 0.2;
          tempV2.y = velcocities[i].y * 0.2;
          vertices[i].vector().add(tempV2);
        }
      }
    }

    //https://twitter.com/OskSta/status/1169940644669861888
    Relax() {
      // force = 0
      let force = new THREE.Vector2(0, 0);
      let v = new THREE.Vector2(0, 0);
      let velcocities = new Array(this.vertices.length);
      let scalar = 0.2;

      // Create an array to store velocity information for each vertice
      for (let i = 0; i < this.vertices.length; i++) {
        velcocities[i] = new THREE.Vector2(0, 0);
      }

      // Calculate forces for each vertex
      for (let i = 0; i < this.faces.length; i++) {
        // Get center of this face
        let center = this.faces[i].center().vector();

        // for(i < 4)
        for (let j = 0; j < 4; j++) {
          let vert = this.GetVert(this.faces[i]._vertexs[j]);
          if (vert.border()) {
            continue;
          }

          // force += verts[i] - center
          v.subVectors(vert.vector(), center);
          force.add(v);

          // force = (force .y,-force .x)
          let temp = force.x;
          force.x = force.y;
          force.y = -temp;
        }

        force.divideScalar(4);

        // Set velocity for each vertex
        // for(i < 4)
        for (let j = 0; j < 4; j++) {
          let vert = this.GetVert(this.faces[i]._vertexs[j]);
          if (vert.border()) {
            continue;
          }

          // force = (force .y,-force .x)
          let temp = force.x;
          force.x = force.y;
          force.y = -temp;

          // forces[i]  += center + force - verts[i]
          //
          // from_add( a, b ){ this[0] = a[0] + b[0]; this[1] = a[1] + b[1]; return this; }
          // v.from_add( center, f ).sub( p.pos );
          // vel[ sq[i] ].add( v );
          v.addVectors(center, force);
          v.sub(vert.vector());

          // Update Velocity
          velcocities[this.vertices.indexOf(vert)].add(v);
        }
      }
      // Apply forces to each vertex
      for (let i = 0; i < this.vertices.length; i++) {
        if (this.vertices[i].border()) {
          continue;
        }

        // v.from_scale( vel[ i ], 0.2 );
        // from_scale( a, s ){ this[0] = a[0] * s; this[1] = a[1] * s; return this;
        let v1 = new THREE.Vector2(0, 0);
        v1.addScaledVector(velcocities[i], scalar);

        // $pnts[ i ].pos.add( v );

        this.vertices[i].vector().add(v1);
      }
    }

    CalculateCenter(face) {
      let edges = face.edges();
      let edge = edges[0];
      for (let i = 1; i < edges.length; i++) {
        if (!edge.sharesVerts(edges[i])) {
          // Get midpoints
          let midA = edge.getMidpoint();
          let midB = edges[i].getMidpoint();

          let midx = (midA.x + midB.x) / 2;
          let midy = (midA.y + midB.y) / 2;
          let mid = new THREE.Vector2(midx, midy);

          //this.gizmos.DrawPoint(mid, new THREE.Color("white"), 0.5);
          face._center = new Vertex(mid, false);
        }
      }
    }

    FindVertex(list, vert) {
      for (let i = 0; i < list.length; i++) {
        if (list[i].vector().equals(vert)) {
          return list[i];
        }
      }
      return undefined;
    }

    GetVert(vert) {
      for (let i = 0; i < this.vertices.length; i++) {
        if (vert.equals(this.vertices[i])) {
          return this.vertices[i];
        }
      }
    }
  }

  class Face {
    constructor(vertices) {
      this._vertices = vertices;
      this._vertexs = [];
      this._edges = this.setEdges();
      this._center = undefined;
      this._adjacent = [];
      this._room = null;
      this._fCost = 0;
      this._hCost = 0;
      this._gCost = 0;
      this._parent = null;
    }

    clear() {
      this._fCost = 0;
      this._hCost = 0;
      this._gCost = 0;
      this._parent = null;
    }

    fCost() {
      return this._fCost;
    }

    hCost() {
      return this._hCost;
    }

    gCost() {
      return this._gCost;
    }

    room() {
      return this._room;
    }

    parent() {
      return this._parent;
    }

    isAvailable() {
      if (this._room == null) {
        return true;
      }
      return false;
    }

    setEdges() {
      let edges = [];

      for (let i = 0; i < this._vertices.length; i++) {
        let e = undefined;

        let v0 = this._vertices[i];
        let v1 = this._vertices[i + 1];

        if (i == this._vertices.length - 1) {
          v1 = this._vertices[0];
        }

        e = new Edge(v0, v1);
        //console.log(e);
        edges.push(e);
      }

      return edges;
    }

    setAdjFaces(faces) {
      let adj = [];

      for (let i = 0; i < faces.length; i++) {
        if (faces[i] != this) {
          let e = faces[i].edges();

          for (let j = 0; j < e.length; j++) {
            for (let k = 0; k < this._edges.length; k++) {
              if (this._edges[k].equals(e[j])) {
                adj.push(faces[i]);
              }
            }
          }
        }
      }

      this._adjacent = adj;
    }

    setRoom(r) {
      this._room = r;
    }

    setParent(p) {
      this._parent = p;
    }

    setfCost(c) {
      this._fCost = c;
    }

    sethCost(c) {
      this._hCost = c;
    }

    setgCost(c) {
      this._gCost = c;
    }

    vertices() {
      return this._vertices;
    }

    vertexs() {
      return this._vertexs;
    }

    edges() {
      return this._edges;
    }

    adjacent() {
      return this._adjacent;
    }

    subdivide() {
      var points = [];
      var edges = this.edges();
      var verts = this.vertices();
      var c = this.center();
      var faces = [];

      if (verts.length == 3) {
        let face0Verts = [];
        face0Verts.push(verts[0]);
        face0Verts.push(edges[0].getMidpoint());
        face0Verts.push(c);
        face0Verts.push(edges[2].getMidpoint());
        let face0 = new Face(face0Verts);
        faces.push(face0);

        let face1Verts = [];
        face1Verts.push(verts[1]);
        face1Verts.push(edges[1].getMidpoint());
        face1Verts.push(c);
        face1Verts.push(edges[0].getMidpoint());
        let face1 = new Face(face1Verts);
        faces.push(face1);

        let face2Verts = [];
        face2Verts.push(verts[2]);
        face2Verts.push(edges[2].getMidpoint());
        face2Verts.push(c);
        face2Verts.push(edges[1].getMidpoint());
        let face2 = new Face(face2Verts);
        faces.push(face2);
      }

      if (verts.length == 4) {
        let face0Verts = [];
        face0Verts.push(verts[0]);
        face0Verts.push(edges[0].getMidpoint());
        face0Verts.push(c);
        face0Verts.push(edges[3].getMidpoint());
        let face0 = new Face(face0Verts);
        faces.push(face0);

        let face1Verts = [];
        face1Verts.push(verts[1]);
        face1Verts.push(edges[1].getMidpoint());
        face1Verts.push(c);
        face1Verts.push(edges[0].getMidpoint());
        let face1 = new Face(face1Verts);
        faces.push(face1);

        let face2Verts = [];
        face2Verts.push(verts[2]);
        face2Verts.push(edges[2].getMidpoint());
        face2Verts.push(c);
        face2Verts.push(edges[1].getMidpoint());
        let face2 = new Face(face2Verts);
        faces.push(face2);

        let face3Verts = [];
        face3Verts.push(verts[3]);
        face3Verts.push(edges[3].getMidpoint());
        face3Verts.push(c);
        face3Verts.push(edges[2].getMidpoint());
        let face3 = new Face(face3Verts);
        faces.push(face3);
      }

      return faces;
    }

    setCenter() {
      let c = undefined;

      //The centroid of a triangle = ((x1+x2+x3)/3, (y1+y2+y3)/3)
      if (this.vertices().length == 3) {
        let centerX = Math.floor(
          (this._vertices[0].x + this._vertices[1].x + this._vertices[2].x) / 3
        );
        let centerY = Math.floor(
          (this._vertices[0].y + this._vertices[1].y + this._vertices[2].y) / 3
        );
        c = new THREE.Vector2(centerX, centerY);
      }

      this._center = c;
    }

    center() {
      if (this._center == undefined) {
        this.setCenter();
      }
      return this._center;
    }

    equals(f) {
      return f.center() == this.center();
    }
  }

  class Edge {
    constructor(v0, v1) {
      this.v0 = v0;
      this.v1 = v1;
      this._vertices = [];
      this._faces = [];
    }

    vertices() {
      let v = [];
      v.push(this.v0);
      v.push(this.v1);
      return v;
    }

    faces() {
      return this._faces;
    }

    equals(edge) {
      return (
        (this.v0.equals(edge.v0) && this.v1.equals(edge.v1)) ||
        (this.v0.equals(edge.v1) && this.v1.equals(edge.v0))
      );
    }

    getMidpoint() {
      let midx = (this.v0.x + this.v1.x) / 2;
      let midy = (this.v0.y + this.v1.y) / 2;
      return new THREE.Vector2(midx, midy);
    }

    getDistBetweenVerts() {
      return this.v0.distanceTo(this.v1);
    }

    sharesVerts(edge) {
      return (
        this.v0.equals(edge.v0) ||
        this.v1.equals(edge.v1) ||
        this.v0.equals(edge.v1) ||
        this.v1.equals(edge.v0)
      );
    }
  }

  class Vertex {
    constructor(v, b) {
      this.v2 = v;
      this._edges = [];
      this._border = b;
    }

    equals(v) {
      return v.vector().equals(this.vector());
    }

    vector() {
      return this.v2;
    }

    edges() {
      return this._edges;
    }

    border() {
      return this._border;
    }

    addEdge(e) {
      this._edges.push(e);
    }

    setVector(v) {
      this.v2 = v;
    }
  }

  return { DrawGrid: DrawGrid };
})();
