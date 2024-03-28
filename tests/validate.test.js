import test from 'node:test'
import assert from 'node:assert'
import v from '../src/validate.js'

test('validates complex shapes', () => {
  const shape = v.object({
    string: v.string(),
    number: v.number(),
    boolean: v.boolean(),
    null: v.null(),
    undefined: v.undefined(),
    stringOrNumber: v.or(v.string(), v.number()),
    nullableBoolean: v.nullable(v.boolean()),
    optionalString: v.optional(v.string()),
    arrayOfStrings: v.array(v.string()),
    createdAt: v.instanceOf(Date)
  })
  assert.ok(
    shape({
      string: 'test',
      number: 1,
      boolean: true,
      null: null,
      undefined: undefined,
      stringOrNumber: 2,
      nullableBoolean: true,
      optionalString: 'test',
      arrayOfStrings: ['foo', 'bar'],
      createdAt: new Date()
    })
  )
  assert.ok(
    shape({
      string: '',
      number: 0,
      boolean: false,
      null: null,
      stringOrNumber: '',
      nullableBoolean: null,
      arrayOfStrings: [],
      createdAt: new Date()
    })
  )
  assert.ok(!shape(''))
  assert.ok(!shape(null))
  assert.ok(!shape([]))
  assert.ok(
    !shape({
      string: '',
      number: 0,
      boolean: false,
      null: null,
      stringOrNumber: '',
      nullableBoolean: null,
      arrayOfStrings: null,
      createdAt: new Date()
    })
  )
})
