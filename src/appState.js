import queryState from 'query-state'

export const qs = queryState()

const currentStateFromQuery = qs.get()

export const defaultxFunction = 'Math.cos((Math.cos(p.y)-p.x*p.y))'
export const defaultyFunction = '(p.x)'
export const defaultDTest = 0.005
export const defaultSeparationDistance = 0.2
export const defaultSimplification = 0.2

export const appState = {
  xFunction: currentStateFromQuery.xf || defaultxFunction,
  yFunction: currentStateFromQuery.yf || defaultyFunction,
  seed: {
    value: currentStateFromQuery.seed || 10
  },
  dTest: currentStateFromQuery.dt || defaultDTest,
  separationDistance: currentStateFromQuery.sd || defaultSeparationDistance, // Separation distance between new streamlines.
  simplification: currentStateFromQuery.sm || defaultSimplification // line simplification amount (0.1-2)

}
