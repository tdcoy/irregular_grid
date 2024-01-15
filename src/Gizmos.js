import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

export const gizmos = (() => {
  class DrawGizmos {
    constructor(scene) {
      this.scene = scene;
    }

    DrawLinesBetweenPoints(points, color, height) {
      const roomPoints = [];

      const material = new THREE.LineBasicMaterial({ color: color });

      for (let i = 0; i < points.length; i++) {
        for (let j = 1; j < points.length; j++) {
          roomPoints.push(new THREE.Vector3(points[i].x, height, points[i].y));
          roomPoints.push(new THREE.Vector3(points[j].x, height, points[j].y));
        }
      }
      const geometry = new THREE.BufferGeometry().setFromPoints(roomPoints);
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }

    DrawWireFrame(faces, color, height) {
      const points = [];

      const material = new THREE.LineBasicMaterial({ color: color });

      let edges = faces.edges();
      for (let j = 0; j < edges.length; j++) {
        points.push(new THREE.Vector3(edges[j].v0.x, height, edges[j].v0.y));
        points.push(new THREE.Vector3(edges[j].v1.x, height, edges[j].v1.y));
      }

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }

    DrawShortestPath(face, offset, color) {
      let _color = color;
      let linePoints = [];
      let points = face.vertexs();

      for (let i = 0; i < points.length; i++) {
        linePoints.push(
          new THREE.Vector3(points[i].vector().x, offset, points[i].vector().y)
        );
      }

      linePoints.push(
        new THREE.Vector3(points[0].vector().x, offset, points[0].vector().y)
      );

      if (_color == undefined) {
        _color = new THREE.Color("blue");
      }

      const material = new THREE.LineBasicMaterial({ color: _color });
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
      return line;
    }

    DrawShortestPathBetweenVertices(verts, offset, color) {
      let _color = color;
      let linePoints = [];

      for (let i = 0; i < verts.length; i++) {
        let v = verts[i].vector();
        linePoints.push(new THREE.Vector3(v.x, offset, v.y));
      }

      linePoints.push(new THREE.Vector3(verts[0].v2.x, offset, verts[0].v2.y));

      if (_color == undefined) {
        _color = new THREE.Color("blue");
      }

      const material = new THREE.LineBasicMaterial({ color: _color });
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(geometry, material);
      this.scene.add(line);
    }

    DrawPoint(point, color, size) {
      const geometry = new THREE.SphereGeometry(size, 5, 2);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);
      cube.position.set(point.x, 0, point.y);
    }

    DrawPoints(points, color, size) {
      for (let i = 0; i < points.length; i++) {
        this.DrawPoint(points[i], color, size);
      }
    }

    DrawBox(point, color, size) {
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);
      cube.position.set(point.x, 0, point.y);
    }
  }

  return { DrawGizmos: DrawGizmos };
})();
