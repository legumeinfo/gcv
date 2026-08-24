export const setIsSuperset = (set, subset) => {
  for (const elem of subset) {
    if (!set.has(elem)) {
      return false
    }
  }
  return true
}

export const setUnion = (setA, setB) => {
  const union = new Set(setA)
  for (const elem of setB) {
    union.add(elem)
  }
  return union
}

export const setIntersection = (setA, setB) => {
  const intersection = new Set()
  for (const elem of setB) {
    if (setA.has(elem)) {
      intersection.add(elem)
    }
  }
  return intersection
}

export const setSymmetricDifference = (setA, setB) => {
  const difference = new Set(setA)
  for (const elem of setB) {
    if (difference.has(elem)) {
      difference.delete(elem)
    } else {
      difference.add(elem)
    }
  }
  return difference
}

export const setDifference = (setA, setB) => {
  const difference = new Set(setA)
  for (const elem of setB) {
    difference.delete(elem)
  }
  return difference
}
