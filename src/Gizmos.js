import * as THREE from "three";

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

    DrawPointV3(point, color, size) {
      const geometry = new THREE.SphereGeometry(size, 5, 2);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const cube = new THREE.Mesh(geometry, material);
      this.scene.add(cube);
      cube.position.set(point.x, point.y, point.z);
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

    TextSprite(message, parameters) {
      if (parameters === undefined) parameters = {};

      var fontface = parameters.hasOwnProperty("fontface")
        ? parameters["fontface"]
        : "Arial";

      var fontsize = parameters.hasOwnProperty("fontsize")
        ? parameters["fontsize"]
        : 18;

      var borderThickness = parameters.hasOwnProperty("borderThickness")
        ? parameters["borderThickness"]
        : 4;

      var borderColor = parameters.hasOwnProperty("borderColor")
        ? parameters["borderColor"]
        : { r: 0, g: 0, b: 0, a: 1.0 };

      var backgroundColor = parameters.hasOwnProperty("backgroundColor")
        ? parameters["backgroundColor"]
        : { r: 255, g: 255, b: 255, a: 1.0 };

      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      context.font = "Bold " + fontsize + "px " + fontface;

      // background color
      context.fillStyle =
        "rgba(" +
        backgroundColor.r +
        "," +
        backgroundColor.g +
        "," +
        backgroundColor.b +
        "," +
        backgroundColor.a +
        ")";
      // border color
      context.strokeStyle =
        "rgba(" +
        borderColor.r +
        "," +
        borderColor.g +
        "," +
        borderColor.b +
        "," +
        borderColor.a +
        ")";

      context.lineWidth = borderThickness;
      // text color
      context.fillStyle = "rgba(0, 0, 0, 1.0)";

      context.fillText(message, borderThickness, fontsize + borderThickness);

      // canvas contents will be used for a texture
      var texture = new THREE.Texture(canvas);
      texture.needsUpdate = true;

      var spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
      });
      var sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(2, 2, 2);
      return sprite;
    }
  }

  return { DrawGizmos: DrawGizmos };
})();
