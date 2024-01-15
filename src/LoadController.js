import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";
import { GLTFLoader } from "https://unpkg.com/three@0.127.0/examples/jsm/loaders/GLTFLoader.js";
import * as SkeletonUtils from "https://unpkg.com/three@0.127.0/examples/jsm/utils/SkeletonUtils.js";
//import SkeletonUtils from "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/jsm/utils/SkeletonUtils.js";
import { entity } from "./Entity.js";

export const load_controller = (() => {
  class LoadController extends entity.Component {
    constructor() {
      super();

      this.textures = {};
      this.models = {};
      this.sounds = {};
      this.playing = [];
    }

    AddModel(model, path, name) {
      const fullName = path + name;
      this.models[fullName] = { loader: null, asset: model };
    }

    LoadTexture(path, name) {
      if (!(name in this.textures_)) {
        const loader = new THREE.TextureLoader();
        loader.setPath(path);

        this.textures[name] = { loader: loader, texture: loader.load(name) };
        this.textures[name].encoding = THREE.sRGBEncoding;
      }

      return this.textures[name].texture;
    }

    LoadSound(path, name, onLoad) {
      if (!(name in this.sounds_)) {
        const loader = new THREE.AudioLoader();
        loader.setPath(path);

        loader.load(name, (buf) => {
          this.sounds[name] = {
            buffer: buf,
          };
          const threejs =
            this.FindEntity("threeJS").GetComponent("ThreeJSController");
          const s = new THREE.PositionalAudio(threejs.listener);
          s.setBuffer(buf);
          s.setRefDistance(10);
          s.setMaxDistance(500);
          onLoad(s);
          this.playing_.push(s);
        });
      } else {
        const threejs =
          this.FindEntity("threejs").GetComponent("ThreeJSController");
        const s = new THREE.PositionalAudio(threejs.listener);
        s.setBuffer(this.sounds[name].buffer);
        s.setRefDistance(25);
        s.setMaxDistance(1000);
        onLoad(s);
        this.playing_.push(s);
      }
    }

    Load(path, name, onLoad) {
      if (name.endsWith("glb") || name.endsWith("gltf")) {
        this.LoadGLB(path, name, onLoad);
      } else {
        const fullName = path + name;
        if (this.models[fullName]) {
          const clone = this.models[fullName].asset.clone();
          onLoad({ scene: clone });
          return;
        }
        // Something went wrong
      }
    }

    LoadGLB(path, name, onLoad) {
      const fullName = path + name;
      if (!(fullName in this.models)) {
        const loader = new GLTFLoader();
        loader.setPath(path);

        this.models[fullName] = {
          loader: loader,
          asset: null,
          queue: [onLoad],
        };
        this.models[fullName].loader.load(name, (glb) => {
          this.models[fullName].asset = glb;

          const queue = this.models[fullName].queue;
          this.models[fullName].queue = null;
          for (let q of queue) {
            const clone = { ...glb };
            clone.scene = SkeletonUtils.clone(clone.scene);

            q(clone);
          }
        });
      } else if (this.models[fullName].asset == null) {
        this.models[fullName].queue.push(onLoad);
      } else {
        const clone = { ...this.models_[fullName].asset };
        clone.scene = SkeletonUtils.clone(clone.scene);

        onLoad(clone);
      }
    }

    Update(timeElapsed) {
      for (let i = 0; i < this.playing.length; ++i) {
        if (!this.playing[i].isPlaying) {
          this.playing[i].parent.remove(this.playing[i]);
        }
      }
      this.playing = this.playing.filter((s) => s.isPlaying);
    }
  }

  return {
    LoadController: LoadController,
  };
})();
