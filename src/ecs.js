export * as v from './validate.js'

// =============================================================================
// Entity
// =============================================================================

/**
 * @typedef {{}} Entity
 */

/**
 * @returns {Entity}
 */
function createEntity() {
  return Object.freeze(Object.create(null))
}

// =============================================================================
// Component
// =============================================================================

/**
 * @template {import('./validate.js').TypeChecker<any>} TState
 * @typedef {object} Component
 * @property {TState} state
 */

/**
 * @template TComponentType
 * @typedef {TComponentType extends Component<import('./validate.js').TypeChecker<infer X>> ? X : never} ComponentType
 */

/**
 * @template {import('./validate.js').TypeChecker<any>} TState
 * @param {TState} state
 * @returns {Component<TState>}
 */
export function createComponent(state) {
  return Object.freeze({ state })
}

// =============================================================================
// System
// =============================================================================

/**
 * @template {import('./validate.js').TypeChecker<any>} TState
 * @template {{[key: string]: Component<any>[]}} TQueries
 * @typedef {object} System
 * @property {TState} state
 * @property {TQueries} queries
 * @property {(state: import('./validate.js').TypeCheckerType<TState>, delta: number, queries: {[Property in keyof TQueries]: Set<Entity>}) => void} execute
 * @property {(state: import('./validate.js').TypeCheckerType<TState>) => (() => void)} [init]
 */

/**
 * @template TSystemState
 * @typedef {TSystemState extends System<import('./validate.js').TypeChecker<infer X>, any> ? X : never} SystemState
 */

/**
 * @template {import('./validate.js').TypeChecker<any>} TState
 * @template {{[key: string]: Component<any>[]}} TQueries
 * @param {TState} state
 * @param {(state: import('./validate.js').TypeCheckerType<TState>, delta: number, queries: {[Property in keyof TQueries]: Set<Entity>}) => void} execute
 * @param {TQueries} queries
 * @param {(state: import('./validate.js').TypeCheckerType<TState>) => (() => void)} [init]
 * @returns {System<TState, TQueries>}
 */
export function createSystem(state, queries, execute, init) {
  return Object.freeze({ state, queries, execute, init })
}

// =============================================================================
// World
// =============================================================================

/**
 * @typedef {object} EntityState
 * @property {boolean} remove
 * @property {Map<Component<any>, any>} components
 * @property {Set<Component<any>>} componentsToRemove
 * @property {Set<Set<Entity>>} addedTo
 * @property {Set<Set<Entity>>} removedFrom
 * @property {(entity: Entity) => void} onChange
 */

/** @type {WeakMap<Entity, EntityState>} */
const entityState = new WeakMap()

/**
 * @template {Component<any>} TComponent
 * @param {Entity} entity
 * @param {TComponent} component
 * @returns {ComponentType<TComponent>}
 */
export function getComponent(entity, component) {
  const components = entityState.get(entity)?.components
  if (!components?.has(component))
    throw new ReferenceError('entity does not have component')
  return components.get(component)
}

/**
 * @template {Component<any>} TComponent
 * @param {Entity} entity
 * @param {TComponent} component
 * @param {ComponentType<TComponent>} componentState
 * @returns {Entity}
 */
export function addComponent(entity, component, componentState) {
  const state = entityState.get(entity)
  if (state && !state.remove) {
    state.components.set(component, componentState)
    state.onChange(entity)
  }
  return entity
}

/**
 * @param {Entity} entity
 * @param {Component<any>} component
 * @returns {Entity}
 */
export function removeComponent(entity, component) {
  const state = entityState.get(entity)
  if (state) {
    state.componentsToRemove.add(component)
    state.onChange(entity)
  }
  return entity
}

/**
 * @param {Set<Entity>} query
 * @param {Entity} entity
 */
export function isAdded(query, entity) {
  return entityState.get(entity)?.addedTo.has(query) ?? false
}

/**
 * @param {Set<Entity>} query
 * @param {Entity} entity
 */
export function isRemoved(query, entity) {
  const state = entityState.get(entity)
  if (!state) return true
  return (state.remove || state.removedFrom.has(query)) ?? true
}

/**
 * @param {Entity} entity
 */
export function removeEntity(entity) {
  const state = entityState.get(entity)
  if (state) {
    state.remove = true
  }
}

/**
 * @typedef {object} SystemInstance
 * @property {System<import('./validate.js').TypeChecker<any>, {[key: string]: Component<any>[]}>} system
 * @property {any} state
 * @property {{key: string, query: EntityQuery, entities: Set<Entity>}[]} queries
 */

/**
 * @param {Entity} entity
 * @returns {Set<Component<any>>}
 */
function getEntityCalculatedComponents(entity) {
  const state = entityState.get(entity)
  if (!state) return new Set()
  const entityComponents = new Set(state.components.keys())
  for (const toRemove of state.componentsToRemove)
    entityComponents.delete(toRemove)
  return entityComponents
}

/**
 * @typedef {ReturnType<createEntityQuery>} EntityQuery
 */

/**
 * @param {Component<any>[]} components
 */
function createEntityQuery(components) {
  /**
   * @param {Set<Component<any>>} entityComponents
   */
  return (entityComponents) => {
    return components.every((component) => entityComponents.has(component))
  }
}

/** @typedef {ReturnType<createWorld>} World */

export function createWorld() {
  /** @type {Set<Entity>} */
  const entities = new Set()
  /** @type {SystemInstance[]} */
  const systems = []

  /**
   * @param {Entity} entity
   */
  function onChange(entity) {
    const state = entityState.get(entity)
    if (!state) return
    const entityComponents = getEntityCalculatedComponents(entity)

    systems.forEach((system) => {
      system.queries.forEach((query) => {
        if (query.entities.has(entity)) {
          if (!query.query(entityComponents)) {
            state.removedFrom.add(query.entities)
          }
        } else if (query.query(entityComponents)) {
          state.addedTo.add(query.entities)
          query.entities.add(entity)
        }
      })
    })
  }

  /** @type {(() => void)[]} */
  const shutdownSystems = []

  const world = Object.freeze({
    /**
     * @template {System<any, any>} TSystem
     * @param {TSystem} system
     * @param {SystemState<TSystem>} state
     */
    registerSystem(system, state) {
      /** @type {SystemInstance} */
      const systemInstance = {
        system,
        state,
        queries: Object.entries(system.queries).map(([key, components]) => {
          const query = createEntityQuery(components)
          const queryEntities = new Set(
            Array.from(entities).filter((entity) => {
              const entityComponents = getEntityCalculatedComponents(entity)
              return query(entityComponents)
            })
          )
          queryEntities.forEach((entity) => {
            entityState.get(entity)?.addedTo.add(queryEntities)
          })
          return { key, query, entities: queryEntities }
        })
      }
      const shutdown = system.init?.(state)
      if (shutdown) shutdownSystems.push(shutdown)
      systems.push(systemInstance)
      return world
    },
    createEntity() {
      const entity = createEntity()
      /** @type {Map<Component<any>, any>} */
      const components = new Map()
      /** @type {EntityState} */
      const state = {
        remove: false,
        addedTo: new Set(),
        removedFrom: new Set(),
        components,
        componentsToRemove: new Set(),
        onChange
      }
      entities.add(entity)
      entityState.set(entity, state)
      return entity
    },
    /**
     * @param {number} delta
     */
    execute(delta) {
      systems.forEach((system) => {
        const queries = Object.fromEntries(
          system.queries.map(({ key, entities }) => [key, entities])
        )
        system.system.execute(system.state, delta, queries)
      })

      const entitiesToRemove = new Set()
      entities.forEach((entity) => {
        const state = entityState.get(entity)
        if (state) {
          state.addedTo.clear()
          state.componentsToRemove.forEach((component) => {
            state.components.delete(component)
          })
          state.componentsToRemove.clear()
          state.removedFrom.forEach((set) => {
            set.delete(entity)
          })
          state.removedFrom.clear()
          if (state.remove) {
            entityState.delete(entity)
            entitiesToRemove.add(entity)
            entities.delete(entity)
          }
        }
      })
      if (entitiesToRemove.size) {
        systems.forEach((system) => {
          system.queries.forEach((query) => {
            entitiesToRemove.forEach((entity) => query.entities.delete(entity))
          })
        })
      }
    },
    stop() {
      shutdownSystems.forEach((shutdown) => shutdown())
    }
  })
  return world
}
