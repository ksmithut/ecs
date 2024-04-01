# Benchmarks

```
function getThing (key) {
  const value = weakMap.get(key)
  if (!value) throw new Error()
  return value
}
```

vs

```
function getThing (key) {
  const value = weakMap.get(key)
  if (value) return value
  return throw new Error
}
```

```
function clone (thing) {
  return {
    results: new Set(thing.results),
    added: new Set(thing.added),
    removed: new Set(thing.removed)
  }
}
```

vs

```
function clone (thing) {
  return structuredClone(thing)
}
```
