import * as THREE from "https://unpkg.com/three@0.158.0/build/three.module.js";

export const entity = (() => {
  class Entity {
    constructor() {
      this.name = null;
      this.id = null;
      this.components = {};
      this.attributes = {};

      this.position = new THREE.Vector3();
      this.rotation = new THREE.Quaternion();
      this.handlers = {};
      this.parent = null;
      this.isDead = false;
    }

    Destroy() {
      for (let i in this.components) {
        this.components[k].Destroy();
      }

      this.components = null;
      this.parent = null;
      this.handlers = null;
    }

    AddComponent(c) {
      c.SetParent(this);
      this.components[c.constructor.name] = c;

      c.InitComponent();
    }

    Broadcast(msg) {
      if (this.IsDead) {
        return;
      }
      if (!(msg.topic in this.handlers)) {
        return;
      }

      for (let curHandler of this.handlers[msg.topic]) {
        curHandler(msg);
      }
    }

    RegisterHandler(name, handler) {
      if (!(name in this.handlers)) {
        this.handlers[name] = [];
      }
      this.handlers[name].push(handler);
    }

    GetComponent(n) {
      return this.components[n];
    }

    get Attributes() {
      return this.attributes;
    }

    get Id() {
      return this.id;
    }

    get IsDead() {
      return this.isDead;
    }

    get Name() {
      return this.name;
    }

    get Parent() {
      return this.parent;
    }

    get Position() {
      return this.position;
    }

    get Quaternion() {
      return this.rotation;
    }

    get Forward() {
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.rotation);
      return forward;
    }

    get Left() {
      const forward = new THREE.Vector3(-1, 0, 0);
      forward.applyQuaternion(this.rotation);
      return forward;
    }

    get Up() {
      const forward = new THREE.Vector3(0, 1, 0);
      forward.applyQuaternion(this.rotation);
      return forward;
    }

    get Manager() {
      return this.parent;
    }

    SetActive(b) {
      this.parent.SetActive(this, b);
    }

    SetDead() {
      this.isDead = true;
    }

    SetId(_id) {
      this.id = _id;
    }

    SetName(_name) {
      this.name = _name;
    }

    SetParent(p) {
      this.parent = p;
    }

    SetPosition(pos) {
      this.position.copy(pos);
      this.Broadcast({
        topic: "update.position",
        value: this.position,
      });
    }

    SetQuaternion(rot) {
      this.rotation.copy(rot);
      this.Broadcast({
        topic: "update.rotation",
        value: this.rotation,
      });
    }

    InitEntity() {
      for (let k in this.components) {
        this.components[k].InitEntity();
      }
    }

    FindEntity(name) {
      return this.parent.Get(name);
    }

    Update(timeElapsed, pass) {
      for (let k in this.components) {
        const c = this.components[k];
        if (c.Pass == pass) {
          c.Update(timeElapsed);
        }
      }
    }
  }

  class Component {
    constructor() {
      this.parent = null;
      this.pass = 0;
    }

    Destroy() {}

    SetParent(p) {
      this.parent = p;
    }

    SetPass(p) {
      this.pass = p;
    }

    GetComponent(name) {
      return this.parent.GetComponent(name);
    }

    get Parent() {
      return this.parent;
    }

    get Manager() {
      return this.parent.Manager;
    }

    get Pass() {
      return this.pass;
    }

    FindEntity(name) {
      return this.parent.FindEntity(name);
    }

    InitComponent() {}

    InitEntity() {}

    Broadcast(msg) {
      this.parent.Broadcast(msg);
    }

    RegisterHandler(name, handler) {
      this.parent.RegisterHandler(name, handler);
    }

    Update(_) {}
  }

  return {
    Entity: Entity,
    Component: Component,
  };
})();
