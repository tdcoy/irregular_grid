export const entity_manager = (() => {
  class EntityManager {
    constructor() {
      this.entities = [];
      this.entitiesMap = {};
      this.ids = 0;
      this.passes = [0, 1, 2, 3];
    }

    Add(entity, name) {
      this.ids += 1;

      if (!name) {
        name = this.GenerateName();
      }

      this.entitiesMap[name] = entity;
      this.entities.push(entity);

      entity.SetParent(this);
      entity.SetName(name);
      entity.SetId(this.ids);
      entity.InitEntity();
    }

    Get(name) {
      return this.entitiesMap[name];
    }

    GenerateName() {
      return "__name__" + this.ids;
    }

    SetActive(entity, b) {
      const i = this.entities.indexOf(entity);

      if (!b) {
        if (i < 0) {
          return;
        }

        this.entities.splice(i, 1);
      } else {
        if (i >= 0) {
          return;
        }

        this.entities.push(entity);
      }
    }

    Update(timeElapsed) {
      for (let i = 0; i < this.passes.length; ++i) {
        this.UpdatePass(timeElapsed, this.passes[i]);
      }
    }

    UpdatePass(timeElapsedS, pass) {
      const dead = [];
      const alive = [];
      for (let i = 0; i < this.entities.length; ++i) {
        const e = this.entities[i];

        e.Update(timeElapsedS, pass);

        if (e.dead) {
          dead.push(e);
        } else {
          alive.push(e);
        }
      }

      for (let i = 0; i < dead.length; ++i) {
        const e = dead[i];

        delete this.entitiesMap[e.Name];

        e.Destroy();
      }

      this.entities = alive;
    }
  }

  return {
    EntityManager: EntityManager,
  };
})();
