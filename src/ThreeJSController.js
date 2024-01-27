import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import * as THREE from "three";
import { entity } from "./Entity.js";

export const threejs_controller = (() => {
  class ThreeJSController extends entity.Component {
    constructor() {
      super();
    }

    InitEntity() {
      this.threeJS = new THREE.WebGLRenderer({
        antialias: true,
        logarithmicDepthBuffer: true,
      });
      this.threeJS.shadowMap.enabled = true;
      this.threeJS.shadowMap.type = THREE.PCFSoftShadowMap;
      this.threeJS.setPixelRatio(window.devicePixelRatio);
      this.threeJS.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(this.threeJS.domElement);

      window.addEventListener(
        "resize",
        () => {
          this.OnWindowResize();
        },
        false
      );

      const fov = 75;
      const apsect = window.innerWidth / window.innerHeight;
      const near = 1;
      const far = 1000.0;

      this.camera = new THREE.PerspectiveCamera(fov, apsect, near, far);
      this.camera.position.set(-10, 50, 20);
      this.camera.rotation.set(0, 0, 0);
      this.scene = new THREE.Scene();
      this.scene.add(this.camera);

      this.controls = new OrbitControls(this.camera, this.threeJS.domElement);
      this.controls.target.set(75, 0, 75);
      this.controls.update();

      this.composer = new EffectComposer(this.threeJS);
      this.composer.setPixelRatio(window.devicePixelRatio);
      this.composer.setSize(window.innerWidth, window.innerHeight);

      this.uiCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 500);
      this.uiScene = new THREE.Scene();

      this.uiPass = new RenderPass(this.uiScene, this.uiCamera);
      this.uiPass.clear = false;

      this.composer.addPass(this.uiPass);

      this.LoadLights(this.scene);
      //this.LoadSkyBox(this.scene);
      this.scene.background = new THREE.Color(0x698c96);

      //Grid
      /* const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
      grid.material.opacity = 0.2;
      grid.material.transparent = true;
      this.scene.add(grid); */
    }

    LoadLights(scene) {
      let light = new THREE.DirectionalLight(0xffffff, 1.0);
      light.position.set(-100, 100, 100);
      light.target.position.set(0, 0, 0);
      light.castShadow = true;
      light.shadow.bias = -0.001;
      light.shadow.mapSize.width = 4096;
      light.shadow.mapSize.height = 4096;
      light.shadow.camera.near = 0.1;
      light.shadow.camera.far = 500.0;
      light.shadow.camera.near = 0.5;
      light.shadow.camera.far = 500.0;
      light.shadow.camera.left = 50;
      light.shadow.camera.right = -50;
      light.shadow.camera.top = 50;
      light.shadow.camera.bottom = -50;
      scene.add(light);

      light = new THREE.AmbientLight(0xffffff, 1);
      scene.add(light);
    }

    LoadSkyBox(scene) {
      const skyBoxloader = new THREE.CubeTextureLoader();
      const skyBoxTexture = skyBoxloader.load([
        "./skybox/posx.jpg",
        "./skybox/negx.jpg",
        "./skybox/posy.jpg",
        "./skybox/negy.jpg",
        "./skybox/posz.jpg",
        "./skybox/negz.jpg",
      ]);
      scene.background = skyBoxTexture;
    }

    OnWindowResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.threejs.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }

    Render() {
      this.threeJS.render(this.scene, this.camera);
      this.composer.render();
    }

    Update(timeElapsed) {
      /* const player = this.FindEntity("player");
      if (!player) {
        return;
      }
      const pos = player.position; */
      //this.controls.update();
      //this.camera.rotation.y += 0.01;
      /* this.sun.position.copy(pos);
        this.sun.position.add(new THREE.Vector3(-20, 100, 20));
        this.sun.target.position.copy(pos);
        this.sun.updateMatrixWorld();
        this.sun.target.updateMatrixWorld();   */
    }
  }

  return {
    ThreeJSController: ThreeJSController,
  };
})();
