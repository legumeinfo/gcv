export const setIsSuperset = (set, subset) => {
  for (let elem of subset) {
    if (!set.has(elem)) {
      return false
    }
  }
  return true
}

export const setUnion = (setA, setB) => {
  let union = new Set(setA)
  for (let elem of setB) {
    union.add(elem)
  }
  return union
}

export const setIntersection = (setA, setB) => {
  let intersection = new Set()
  for (let elem of setB) {
    if (setA.has(elem)) {
      intersection.add(elem)
    }
  }
  return intersection
}

export const setSymmetricDifference = (setA, setB) => {
  let difference = new Set(setA)
  for (let elem of setB) {
    if (difference.has(elem)) {
      difference.delete(elem)
    } else {
      difference.add(elem)
    }
  }
  return difference
}

export const setDifference = (setA, setB) => {
  let difference = new Set(setA)
  for (let elem of setB) {
    difference.delete(elem)
  }
  return difference
}
