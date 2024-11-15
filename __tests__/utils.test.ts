// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { deepEqualCheck } from '../src/utils'

describe('deepEqual function', () => {
  it('should return true for equal primitive values', () => {
    expect(deepEqualCheck(1, 1)).toBe(true)
    expect(deepEqualCheck('hello', 'hello')).toBe(true)
    expect(deepEqualCheck(true, true)).toBe(true)
  })

  it('should return false for different primitive values', () => {
    expect(deepEqualCheck(1, 2)).toBe(false)
    expect(deepEqualCheck('hello', 'world')).toBe(false)
    expect(deepEqualCheck(true, false)).toBe(false)
  })

  it('should return true for equal objects', () => {
    const obj1 = { name: 'Alice', age: 25 }
    const obj2 = { name: 'Alice', age: 25 }
    expect(deepEqualCheck(obj1, obj2)).toBe(true)
  })

  it('should return false for objects with different values', () => {
    const obj1 = { name: 'Alice', age: 25 }
    const obj2 = { name: 'Alice', age: 30 }
    expect(deepEqualCheck(obj1, obj2)).toBe(false)
  })

  it('should return true for nested objects that are equal', () => {
    const obj1 = { name: 'Alice', address: { city: 'Wonderland', zip: 12345 } }
    const obj2 = { name: 'Alice', address: { city: 'Wonderland', zip: 12345 } }
    expect(deepEqualCheck(obj1, obj2)).toBe(true)
  })

  it('should return false for nested objects that are different', () => {
    const obj1 = { name: 'Alice', address: { city: 'Wonderland', zip: 12345 } }
    const obj2 = { name: 'Alice', address: { city: 'Wonderland', zip: 54321 } }
    expect(deepEqualCheck(obj1, obj2)).toBe(false)
  })

  it('should return true for equal arrays', () => {
    const arr1 = [1, 2, 3]
    const arr2 = [1, 2, 3]
    expect(deepEqualCheck(arr1, arr2)).toBe(true)
  })

  it('should return false for arrays with different values', () => {
    const arr1 = [1, 2, 3]
    const arr2 = [1, 2, 4]
    expect(deepEqualCheck(arr1, arr2)).toBe(false)
  })

  it('should return false for objects with different number of properties', () => {
    const obj1 = { name: 'Alice', age: 25 }
    const obj2 = { name: 'Alice' }
    expect(deepEqualCheck(obj1, obj2)).toBe(false)
  })

  it('should return true for objects that are strictly equal (same reference)', () => {
    const obj1 = { name: 'Alice' }
    const obj2 = obj1
    expect(deepEqualCheck(obj1, obj2)).toBe(true)
  })
})
