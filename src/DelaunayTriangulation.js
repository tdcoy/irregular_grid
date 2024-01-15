import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

export const delaunay_triangulation = (() => {
  class Triangulate {
    constructor(points) {
      let vertices = [];
      for (let i = 0; i < points.length; i++) {
        const v = new THREE.Vector2(points[i].x, points[i].y);
        vertices.push(v);
      }

      let triangles = this.Triangulation(vertices);
      let cleanedTriangles = this.RemoveOutlierTriangles(triangles);

      for (let i = 0; i < cleanedTriangles.length; i++) {
        cleanedTriangles[i].findAdjTriangles(cleanedTriangles);
      }
      return cleanedTriangles;
    }

    Triangulation(vertices) {
      // Create Super-triangle that contains all the points in the point list and add it to triangle list
      const st = this.CreateSuperTriangle(vertices);

      var triangles = [];
      triangles.push(st);

      // Triangulate each vertex
      for (let i = 0; i < vertices.length; i++) {
        triangles = this.AddVertex(vertices[i], triangles);
      }

      // Remove triangles that share edges with super triangle
      triangles = triangles.filter(function (triangle) {
        return !(
          triangle.v0 == st.v0 ||
          triangle.v0 == st.v1 ||
          triangle.v0 == st.v2 ||
          triangle.v1 == st.v0 ||
          triangle.v1 == st.v1 ||
          triangle.v1 == st.v2 ||
          triangle.v2 == st.v0 ||
          triangle.v2 == st.v1 ||
          triangle.v2 == st.v2
        );
      });

      return triangles;
    }

    CreateSuperTriangle(vertices) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (let i = 0; i < vertices.length; i++) {
        minX = Math.min(minX, vertices[i].x);
        minY = Math.min(minX, vertices[i].y);
        maxX = Math.max(maxX, vertices[i].x);
        maxY = Math.max(maxX, vertices[i].y);
      }

      let dx = (maxX - minX) * 2;
      let dy = (maxY - minY) * 2;
      let v0 = new THREE.Vector2(minX - dx, minY - dy * 3);
      let v1 = new THREE.Vector2(minX - dx, maxY + dy);
      let v2 = new THREE.Vector2(maxX + dx * 3, maxY + dy);

      return new Triangle(v0, v1, v2);
    }

    AddVertex(vertex, triangles) {
      let edges = [];

      triangles = triangles.filter(function (triangle) {
        if (triangle.inCircumCircle(vertex)) {
          edges.push(new Edge(triangle.v0, triangle.v1));
          edges.push(new Edge(triangle.v1, triangle.v2));
          edges.push(new Edge(triangle.v2, triangle.v0));
          return false;
        }
        return true;
      });

      edges = this.UniqueEdges(edges);

      for (let i = 0; i < edges.length; i++) {
        triangles.push(new Triangle(edges[i].v0, edges[i].v1, vertex));
      }

      return triangles;
    }

    UniqueEdges(edges) {
      let uniqueEdges = [];

      for (let i = 0; i < edges.length; i++) {
        let isUnique = true;

        for (let j = 0; j < edges.length; j++) {
          if (i != j && edges[i].equals(edges[j])) {
            isUnique = false;
            break;
          }
        }

        isUnique && uniqueEdges.push(edges[i]);
      }

      return uniqueEdges;
    }

    RemoveOutlierTriangles(triangles) {
      let goodTriangles = [];
      const minAngle = 15;
      const maxAngle = 165;

      for (let i = 0; i < triangles.length; i++) {
        let sideA = triangles[i].v0.distanceTo(triangles[i].v1);
        let sideB = triangles[i].v0.distanceTo(triangles[i].v2);
        let sideC = triangles[i].v1.distanceTo(triangles[i].v2);

        let angleA =
          Math.acos(
            (Math.pow(sideA, 2) - Math.pow(sideB, 2) - Math.pow(sideC, 2)) /
              (-2 * sideB * sideC)
          ) *
          (180 / Math.PI);

        let angleB =
          Math.acos(
            (Math.pow(sideB, 2) - Math.pow(sideC, 2) - Math.pow(sideA, 2)) /
              (-2 * sideA * sideC)
          ) *
          (180 / Math.PI);

        let angleC =
          Math.acos(
            (Math.pow(sideC, 2) - Math.pow(sideA, 2) - Math.pow(sideB, 2)) /
              (-2 * sideA * sideB)
          ) *
          (180 / Math.PI);

        if (
          angleA < maxAngle &&
          angleA > minAngle &&
          angleB < maxAngle &&
          angleB > minAngle &&
          angleC < maxAngle &&
          angleC > minAngle
        ) {
          goodTriangles.push(triangles[i]);
        }
      }

      return goodTriangles;
    }
  }

  class Edge {
    constructor(v0, v1) {
      this.v0 = v0;
      this.v1 = v1;
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
  }

  class Triangle {
    constructor(v0, v1, v2) {
      this.v0 = v0;
      this.v1 = v1;
      this.v2 = v2;

      this.edges = this.setEdges();
      this.adjTriangles = [];

      this.circumCenter = this.calcCircumCenter(this.v0, this.v1, this.v2);
      this.circumRadius = this.calcCircumRadius(this.circumCenter);
    }

    findAdjTriangles(triangles) {
      let adjTriangles = [];

      //Loop through triangles
      for (let i = 0; i < triangles.length; i++) {
        let otherEdges = triangles[i].getEdges();

        //Check if the cur triangle is this triangle
        if (!triangles[i].equals(this)) {
          //Check for adjacency
          for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
              if (this.edges[j].equals(otherEdges[k])) {
                adjTriangles.push(triangles[i]);
              }
            }
          }
        }
      }

      this.adjTriangles = adjTriangles;
    }

    setEdges() {
      let edges = [];
      let edge1 = new Edge(this.v0, this.v1);
      let edge2 = new Edge(this.v0, this.v2);
      let edge3 = new Edge(this.v2, this.v1);
      edges.push(edge1);
      edges.push(edge2);
      edges.push(edge3);
      return edges;
    }

    vertices() {
      let verts = [];
      verts.push(this.v0);
      verts.push(this.v1);
      verts.push(this.v2);
      return verts;
    }

    containsVertex(v) {
      if (this.v0.equals(v) || this.v1.equals(v) || this.v2.equals(v)) {
        return true;
      }
      return false;
    }

    getEdges() {
      return this.edges;
    }

    getAdjTriangles() {
      return this.adjTriangles;
    }

    center() {
      //The centroid of a triangle = ((x1+x2+x3)/3, (y1+y2+y3)/3)
      let centerX = Math.floor((this.v0.x + this.v1.x + this.v2.x) / 3);
      let centerY = Math.floor((this.v0.y + this.v1.y + this.v2.y) / 3);

      return new THREE.Vector2(centerX, centerY);
    }

    circumCenter() {
      return this.circumCenter;
    }

    inCircumCircle(v) {
      let dx = this.circumCenter.x - v.x;
      var dy = this.circumCenter.y - v.y;
      return Math.sqrt(dx * dx + dy * dy) <= this.circumRadius;
    }

    calcCircumCenter(v0, v1, v2) {
      let sqrV0 = new THREE.Vector2(Math.pow(v0.x, 2), Math.pow(v0.y, 2));
      let sqrV1 = new THREE.Vector2(Math.pow(v1.x, 2), Math.pow(v1.y, 2));
      let sqrV2 = new THREE.Vector2(Math.pow(v2.x, 2), Math.pow(v2.y, 2));

      //float D = (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y)) * 2f;
      let dist =
        (v0.x * (v1.y - v2.y) + v1.x * (v2.y - v0.y) + v2.x * (v0.y - v1.y)) *
        2;
      //float x = ((SqrA.x + SqrA.y) * (B.y - C.y) + (SqrB.x + SqrB.y) * (C.y - A.y) + (SqrC.x + SqrC.y) * (A.y - B.y)) / D;
      let x =
        ((sqrV0.x + sqrV0.y) * (v1.y - v2.y) +
          (sqrV1.x + sqrV1.y) * (v2.y - v0.y) +
          (sqrV2.x + sqrV2.y) * (v0.y - v1.y)) /
        dist;
      //float y = ((SqrA.x + SqrA.y) * (C.x - B.x) + (SqrB.x + SqrB.y) * (A.x - C.x) + (SqrC.x + SqrC.y) * (B.x - A.x)) / D;
      let y =
        ((sqrV0.x + sqrV0.y) * (v2.x - v1.x) +
          (sqrV1.x + sqrV1.y) * (v0.x - v2.x) +
          (sqrV2.x + sqrV2.y) * (v1.x - v0.x)) /
        dist;
      //return new Vector2(x, y);
      return new THREE.Vector2(x, y);
    }

    calcCircumRadius(center) {
      //Radius is the distance from any vertex to the CircumCentre
      const dx = center.x - this.v0.x;
      const dy = center.y - this.v0.y;
      return Math.sqrt(dx * dx + dy * dy);
    }

    equals(triangle) {
      if (
        triangle.v0.equals(this.v0) &&
        triangle.v1.equals(this.v1) &&
        triangle.v2.equals(this.v2)
      ) {
        return true;
      }
      return false;
    }
  }

  return { Triangulate: Triangulate };
})();
