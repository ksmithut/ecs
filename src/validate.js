/**
 * @template T
 * @typedef {(value: unknown) => value is T} TypeChecker
 */

/**
 * @template TTypeChecker
 * @typedef {TTypeChecker extends TypeChecker<infer X> ? X : never} TypeCheckerType
 */

function string() {
  /** @type {TypeChecker<string>} */
  return (value) => typeof value === 'string'
}

function number() {
  /** @type {TypeChecker<number>} */
  return (value) => typeof value === 'number' && !Number.isNaN(value)
}

function boolean() {
  /** @type {TypeChecker<boolean>} */
  return (value) => typeof value === 'boolean'
}

function isNull() {
  /** @type {TypeChecker<null>} */
  return (value) => value === null
}

function isUndefined() {
  /** @type {TypeChecker<undefined|void>} */
  return (value) => value === undefined
}

/**
 * @template TA, TB
 * @param {TypeChecker<TA>} isA
 * @param {TypeChecker<TB>} isB
 */
function or(isA, isB) {
  /** @type {TypeChecker<TA | TB>} */
  return (value) => isA(value) || isB(value)
}

/**
 * @template T
 * @param {TypeChecker<T>} check
 */
function nullable(check) {
  return or(isNull(), check)
}

/**
 * @template T
 * @param {TypeChecker<T>} check
 */
function optional(check) {
  return or(isUndefined(), check)
}

/**
 * @template T
 * @param {TypeChecker<T>} check
 */
function array(check) {
  /** @type {TypeChecker<T[]>} */
  return (value) => {
    if (!Array.isArray(value)) return false
    return value.every((item) => check(item))
  }
}

/**
 * @template {{[key: string]: TypeChecker<any>}} TShape
 * @param {TShape} shape
 */
function object(shape) {
  const entries = Object.entries(shape)
  /** @type {TypeChecker<{[Property in keyof TShape]: TypeCheckerType<TShape[Property]>}>} */
  return (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      return false
    // @ts-ignore
    return entries.every(([key, checker]) => checker(value[key]))
  }
}

/**
 * @template {new (...args: any[]) => any} T
 * @param {T} c
 */
function instanceOf(c) {
  /** @type {TypeChecker<InstanceType<T>>} */
  return (value) => value instanceof c
}

export default {
  string,
  number,
  boolean,
  null: isNull,
  undefined: isUndefined,
  or,
  nullable,
  optional,
  array,
  object,
  instanceOf
}
