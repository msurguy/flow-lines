// square distance from a point to a segment
const getSqSegDist = (p, p1, p2) => {
  let x = p1[0]
  let y = p1[1]
  let dx = p2[0] - x
  let dy = p2[1] - y

  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)

    if (t > 1) {
      x = p2[0]
      y = p2[1]
    } else if (t > 0) {
      x += dx * t
      y += dy * t
    }
  }

  dx = p[0] - x
  dy = p[1] - y

  return dx * dx + dy * dy
}

const simplifyDPStep = (points, first, last, sqTolerance, simplified) => {
  let maxSqDist = sqTolerance
  let index

  for (let i = first + 1; i < last; i++) {
    const sqDist = getSqSegDist(points[i], points[first], points[last])

    if (sqDist > maxSqDist) {
      index = i
      maxSqDist = sqDist
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified)
    simplified.push(points[index])
    if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified)
  }
}

// simplification using Ramer-Douglas-Peucker algorithm
export const simplify = (points, tolerance) => {
  if (points.length <= 1) {
    return points
  }
  tolerance = typeof tolerance === 'number' ? tolerance : 1
  const sqTolerance = tolerance * tolerance

  const last = points.length - 1

  const simplified = [points[0]]
  simplifyDPStep(points, 0, last, sqTolerance, simplified)
  simplified.push(points[last])

  return simplified
}
