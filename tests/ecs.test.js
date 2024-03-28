import test from 'node:test'
import assert from 'node:assert'
import * as ecs from '../src/ecs.js'
import v from '../src/validate.js'

const positionComponent = ecs.createComponent(
  v.object({ x: v.number(), y: v.number() })
)
const velocityComponent = ecs.createComponent(
  v.object({ x: v.number(), y: v.number() })
)

const movementSystem = ecs.createSystem(
  v.null(),
  { entities: [positionComponent, velocityComponent] },
  (_state, delta, { entities }) => {
    for (const entity of entities) {
      const pos = ecs.getComponent(entity, positionComponent)
      const { x, y } = ecs.getComponent(entity, velocityComponent)
      if (!ecs.isRemoved(entities, entity)) {
        pos.x += x * delta
        pos.y += y * delta
      }
    }
  }
)

test('creates and runs a world with moving entities', () => {
  const world = ecs.createWorld().registerSystem(movementSystem, null)
  const entity1 = world.createEntity()
  ecs.addComponent(entity1, positionComponent, { x: 0, y: 0 })
  ecs.addComponent(entity1, velocityComponent, { x: 10, y: -10 })
  const entity2 = world.createEntity()
  ecs.addComponent(entity2, positionComponent, { x: 10, y: 10 })
  ecs.addComponent(entity2, velocityComponent, { x: 0, y: 5 })
  const entity3 = world.createEntity()
  ecs.addComponent(entity3, positionComponent, { x: 15, y: -5 })
  world.execute(1)
  assert.deepStrictEqual(ecs.getComponent(entity1, positionComponent), {
    x: 10,
    y: -10
  })
  assert.deepStrictEqual(ecs.getComponent(entity2, positionComponent), {
    x: 10,
    y: 15
  })
  assert.deepStrictEqual(ecs.getComponent(entity3, positionComponent), {
    x: 15,
    y: -5
  })
  world.execute(2)
  assert.deepStrictEqual(ecs.getComponent(entity1, positionComponent), {
    x: 30,
    y: -30
  })
  assert.deepStrictEqual(ecs.getComponent(entity2, positionComponent), {
    x: 10,
    y: 25
  })
  assert.deepStrictEqual(ecs.getComponent(entity3, positionComponent), {
    x: 15,
    y: -5
  })
  ecs.removeComponent(entity2, velocityComponent)
  world.execute(1)
  assert.deepStrictEqual(ecs.getComponent(entity1, positionComponent), {
    x: 40,
    y: -40
  })
  assert.deepStrictEqual(ecs.getComponent(entity2, positionComponent), {
    x: 10,
    y: 25
  })
  assert.deepStrictEqual(ecs.getComponent(entity3, positionComponent), {
    x: 15,
    y: -5
  })
})
