export { default as v } from './validate.js'

// =============================================================================
// Entity
// =============================================================================

export class Entity {}

// =============================================================================
// Component
// =============================================================================

/**
 * @template {import('./validate.js').TypeChecker<any>} TSchema
 * @typedef {object} Component
 * @property {TSchema} schema
 */

/**
 * @template TComponentSchema
 * @typedef {TComponentSchema extends Component<import('./validate.js').TypeChecker<infer X>> ? X : never} ComponentSchema
 */

/**
 * @template {import('./validate.js').TypeChecker<any>} TSchema
 * @param {TSchema} schema
 * @returns {Component<TSchema>}
 */
export function createComponent(schema) {
  return Object.freeze({ schema })
}

// =============================================================================
// Queries
// =============================================================================

/**
 * @typedef {object} QueryResults
 * @property {Set<Entity>} results
 * @property {Set<Entity>} added
 * @property {Set<Entity>} removed
 */

/**
 * @param {ReadonlyArray<Component<any>>} components
 */
function createQuery(components) {
  components = components.slice()
  /**
   * @param {Map<Component<any>, any>} entityComponents
   */
  return (entityComponents) => {
    return components.every((component) => entityComponents.has(component))
  }
}

// =============================================================================
// System
// =============================================================================

/**
 * @template {import('./validate.js').TypeChecker<any>} TSchema
 * @template {{[key: string]: ReadonlyArray<Component<any>>}} TQueries
 * @typedef {object} System
 * @property {TSchema} schema
 * @property {TQueries} queries
 * @property {(state: import('./validate.js').TypeCheckerType<TSchema>, delta: number, queries: {[Property in keyof TQueries]: QueryResults}) => void} execute
 * @property {(state: import('./validate.js').TypeCheckerType<TSchema>) => () => void} init
 */

/**
 * @template TSystemSchema
 * @typedef {TSystemSchema extends System<import('./validate.js').TypeChecker<infer X>, any> ? X : never} SystemSchema
 */

/**
 * @template {import('./validate.js').TypeChecker<any>} TSchema
 * @template {{[key: string]: ReadonlyArray<Component<any>>}} TQueries
 * @param {TSchema} schema
 * @param {TQueries} queries
 * @param {(state: import('./validate.js').TypeCheckerType<TSchema>, delta: number, queries: {[Property in keyof TQueries]: QueryResults}) => void} execute
 * @param {(state: import('./validate.js').TypeCheckerType<TSchema>) => () => void} [init]
 * @returns {System<TSchema, TQueries>}
 */
export function createSystem(schema, queries, execute, init = () => () => {}) {
  return Object.freeze({
    schema,
    queries,
    execute,
    init
  })
}

// =============================================================================
// World
// =============================================================================

/**
 * @typedef {object} EntityState
 * @property {Map<Component<any>, any>} components
 * @property {Map<Component<any>, any>} removedComponents
 */

/**
 * @template {System<any, any>} TSystem
 * @typedef {object} SystemInstance
 * @property {() => void} close
 * @property {SystemSchema<TSystem>} state
 * @property {TSystem} system
 * @property {object[]} queries
 * @property {string} queries[].key
 * @property {ReturnType<createQuery>} queries[].query
 * @property {QueryResults} queries[].entities
 */

/**
 * @template {Component<any>} TComponent
 * @param {Entity} entity
 * @param {TComponent} component
 * @returns {ComponentSchema<TComponent>}
 */
export function getComponent(entity, component) {
  return getEntityWorld(entity).getComponent(entity, component)
}

/**
 * @template {Component<any>} TComponent
 * @param {Entity} entity
 * @param {TComponent} component
 * @returns {boolean}
 */
export function hasComponent(entity, component) {
  return getEntityWorld(entity).hasComponent(entity, component)
}

/**
 * @template {Component<any>} TComponent
 * @param {Entity} entity
 * @param {TComponent} component
 * @returns {ComponentSchema<TComponent>}
 */
export function getRemovedComponent(entity, component) {
  return getEntityWorld(entity).getRemovedComponent(entity, component)
}

/**
 * @template {Component<any>} TComponent
 * @param {Entity} entity
 * @param {TComponent} component
 * @returns {boolean}
 */
export function hasRemovedComponent(entity, component) {
  return getEntityWorld(entity).hasRemovedComponent(entity, component)
}

/**
 * @template {Component<any>} TComponent
 * @param {Entity} entity
 * @param {TComponent} component
 * @param {ComponentSchema<TComponent>} data
 * @returns {Entity}
 */
export function addComponent(entity, component, data) {
  return getEntityWorld(entity).addComponent(entity, component, data)
}

/**
 * @param {Entity} entity
 * @param {Component<any>} component
 * @returns {Entity}
 */
export function removeComponent(entity, component) {
  return getEntityWorld(entity).removeComponent(entity, component)
}

/**
 * @param {Entity} entity
 * @returns {Entity}
 */
export function removeEntity(entity) {
  return getEntityWorld(entity).removeEntity(entity)
}

/**
 * @param {Entity} entity
 */
function getEntityWorld(entity) {
  const world = entityWorlds.get(entity)
  if (world) return world
  throw new ReferenceError('Could not find entity reference')
}

/**
 * @typedef {object} WorldInternalFunctions
 * @property {typeof addComponent} addComponent
 * @property {typeof removeComponent} removeComponent
 * @property {typeof removeEntity} removeEntity
 * @property {typeof getComponent} getComponent
 * @property {typeof hasComponent} hasComponent
 * @property {typeof getRemovedComponent} getRemovedComponent
 * @property {typeof hasRemovedComponent} hasRemovedComponent
 */

/** @type {WeakMap<Entity, WorldInternalFunctions>} */
const entityWorlds = new WeakMap()

/** @type {World|null} */
let currentWorld = null

export function createEntity() {
  if (!currentWorld) throw new Error('not in the context of a world')
  return currentWorld.createEntity()
}

/**
 * @typedef {ReturnType<createWorld>} World
 */

export function createWorld() {
  /** @type {Map<Entity, EntityState>} */
  const entities = new Map()
  /** @type {Set<Entity>} */
  const removedEntities = new Set()

  /** @type {SystemInstance<System<any, any>>[]} */
  const systems = []

  /** @type {WorldInternalFunctions} */
  const worldFunctions = {
    addComponent(entity, component, data) {
      const entityComponents = entities.get(entity)
      if (!entityComponents) return entity
      entityComponents.components.set(component, data)
      entityComponents.removedComponents.delete(component)
      systems.forEach((system) => {
        system.queries.forEach((query) => {
          if (
            !query.entities.results.has(entity) &&
            query.query(entityComponents.components)
          ) {
            query.entities.added.add(entity)
            query.entities.results.add(entity)
            query.entities.removed.delete(entity)
          }
          // TODO: If we support Not(Component) we'll need to also check if !query.query(entityComponent.components)
        })
      })
      return entity
    },
    removeComponent(entity, component) {
      const entityComponents = entities.get(entity)
      if (!entityComponents) return entity
      if (entityComponents.components.has(component)) {
        const value = entityComponents.components.get(component)
        entityComponents.components.delete(component)
        entityComponents.removedComponents.set(component, value)
        systems.forEach((system) => {
          system.queries.forEach((query) => {
            if (
              query.entities.results.has(entity) &&
              !query.query(entityComponents.components)
            ) {
              query.entities.added.delete(entity)
              query.entities.results.delete(entity)
              query.entities.removed.add(entity)
            }
            // TODO: If we support Not(Component) we'll need to also check if (!query.query(entityComponent.components))
          })
        })
      }
      return entity
    },
    removeEntity(entity) {
      const entityComponents = entities.get(entity)
      if (!entityComponents) return entity
      removedEntities.add(entity)
      entityComponents.components.forEach((value, component) => {
        entityComponents.removedComponents.set(component, value)
      })
      entityComponents.components.clear()
      systems.forEach((system) => {
        system.queries.forEach((query) => {
          if (query.entities.results.has(entity)) {
            query.entities.added.delete(entity)
            query.entities.results.delete(entity)
            query.entities.removed.add(entity)
          }
          // TODO: If we support Not(Component) we'll need to also check if (!query.query(entityComponent.components))
        })
      })
      return entity
    },
    getComponent(entity, component) {
      const entityComponents = entities.get(entity)
      if (!entityComponents?.components.has(component)) {
        throw new ReferenceError('entity does not have component')
      }
      return entityComponents.components.get(component)
    },
    hasComponent(entity, component) {
      return entities.get(entity)?.components.has(component) ?? false
    },
    getRemovedComponent(entity, component) {
      const entityComponents = entities.get(entity)
      if (!entityComponents) {
        throw new ReferenceError('entity does not have component')
      }
      if (entityComponents.removedComponents.has(component)) {
        return entityComponents.removedComponents.get(component)
      }
      if (entityComponents.components.has(component)) {
        return entityComponents.components.get(component)
      }
      throw new ReferenceError('entity does not have component')
    },
    hasRemovedComponent(entity, component) {
      const entityComponents = entities.get(entity)
      if (!entityComponents) return false
      return (
        entityComponents.removedComponents.has(component) ||
        entityComponents.components.has(component)
      )
    }
  }

  const world = Object.freeze({
    createEntity() {
      const entity = new Entity()
      entities.set(entity, {
        components: new Map(),
        removedComponents: new Map()
      })
      entityWorlds.set(entity, worldFunctions)
      // TODO add to any existing systems
      return entity
    },
    /**
     * @template {System<any, any>} TSystem
     * @param {TSystem} system
     * @param {SystemSchema<TSystem>} state
     */
    registerSystem(system, state) {
      const systemInstance = {
        close: system.init(state),
        state,
        system,
        queries: Object.entries(system.queries).map(([key, components]) => {
          const query = createQuery(components)
          /** @type {Set<Entity>} */
          const added = new Set()
          for (const [entity, { components }] of entities) {
            if (query(components)) added.add(entity)
          }
          return {
            key,
            query,
            entities: { added, results: new Set(added), removed: new Set() }
          }
        })
      }
      systems.push(systemInstance)
      return world
    },
    /**
     * @param {number} delta
     */
    execute(delta) {
      currentWorld = world
      for (const system of systems) {
        const queries = Object.fromEntries(
          system.queries.map((query) => {
            return [
              query.key,
              {
                results: new Set(query.entities.results),
                added: new Set(query.entities.added),
                removed: new Set(query.entities.removed)
              }
            ]
          })
        )
        system.system.execute(system.state, delta, queries)
      }
      currentWorld = null
      for (const [, { removedComponents }] of entities) {
        removedComponents.clear()
      }
      for (const system of systems) {
        system.queries.forEach((query) => {
          query.entities.added.clear()
          query.entities.removed.clear()
        })
      }
      for (const entity of removedEntities) {
        entities.delete(entity)
        entityWorlds.delete(entity)
      }
      removedEntities.clear()
    }
  })
  return world
}
