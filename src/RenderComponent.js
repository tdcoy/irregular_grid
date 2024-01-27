import * as THREE from "three";
import { entity } from "./Entity.js";

export const render_component = (() => {
  class RenderComponent extends entity.Component {
    constructor(_params) {
      super();
      this.group = new THREE.Group();
      this.target = null;
      this.offset = null;
      this.params = _params;
      this.params.scene.add(this.group);
    }

    Destroy() {
      this.group.traverse((c) => {
        if (c.material) {
          c.material.dispose();
        }
        if (c.geometry) {
          c.geometry.dispose();
        }
      });
      this.params.scene.remove(this.group);
    }

    InitEntity() {
      this.Parent.Attributes.Render = {
        group: this.group,
      };

      this.LoadModels();
    }

    InitComponent() {
      this.RegisterHandler("update.position", (m) => {
        this.OnPosition(m);
      });
      this.RegisterHandler("update.rotation", (m) => {
        this.OnRotation(m);
      });
      this.RegisterHandler("render.visible", (m) => {
        this.OnVisible(m);
      });
      this.RegisterHandler("render.offset", (m) => {
        this.Onoffset(m.offset);
      });
    }

    OnVisible(m) {
      this.group.visible = m.value;
    }

    OnPosition(m) {
      this.group.position.copy(m.value);
    }

    OnRotation(m) {
      this.group.quaternion.copy(m.value);
    }

    Onoffset(offset) {
      this.offset = offset;
      if (!this.offset) {
        return;
      }

      if (this.target) {
        this.target.position.copy(this.offset.position);
        this.target.quaternion.copy(this.offset.quaternion);
      }
    }

    LoadModels() {
      const loader = this.FindEntity("loader").GetComponent("LoadController");
      loader.Load(this.params.resourcePath, this.params.resourceName, (mdl) => {
        this.OnLoaded(mdl.scene);
      });
    }

    OnLoaded(obj) {
      this.target = obj;
      this.group.add(this.target);
      this.group.position.copy(this.Parent.Position);
      this.group.quaternion.copy(this.Parent.Quaternion);

      this.target.scale.copy(this.params.scale);
      if (this.params.offset) {
        this.offset = this.params.offset;
      }
      this.Onoffset(this.offset);

      const textures = {};
      if (this.params.textures) {
        const loader = this.FindEntity("loader").GetComponent("LoadController");

        for (let k in this.params.textures.names) {
          const t = loader.LoadTexture(
            this.params.textures.resourcePath,
            this.params.textures.names[k]
          );
          t.encoding = THREE.SRGBColorSpace;

          if (this.params.textures.wrap) {
            t.wrapS = THREE.RepeatWrapping;
            t.wrapT = THREE.RepeatWrapping;
          }

          textures[k] = t;
        }
      }

      this.target.traverse((c) => {
        let materials = c.material;
        if (!(c.material instanceof Array)) {
          materials = [c.material];
        }

        if (c.geometry) {
          c.geometry.computeBoundingBox();
        }

        for (let m of materials) {
          if (m) {
            // HACK
            // m.depthWrite = true;
            // m.transparent = false;

            if (this.params.onMaterial) {
              this.params.onMaterial(m);
            }
            for (let k in textures) {
              if (m.name.search(k) >= 0) {
                m.map = textures[k];
              }
            }
            if (this.params.specular) {
              m.specular = this.params.specular;
            }
            if (this.params.emissive) {
              m.emissive = this.params.emissive;
            }
            if (this.params.colour) {
              m.color = this.params.colour;
            }
          }
        }
        if (this.params.receiveShadow !== undefined) {
          c.receiveShadow = this.params.receiveShadow;
        }
        if (this.params.castShadow !== undefined) {
          c.castShadow = this.params.castShadow;
        }
        if (this.params.visible !== undefined) {
          c.visible = this.params.visible;
        }

        c.castShadow = true;
        c.receiveShadow = true;
      });

      this.Broadcast({
        topic: "render.loaded",
        value: this.target,
      });
    }

    Update(timeInSeconds) {}
  }

  return {
    RenderComponent: RenderComponent,
  };
})();
