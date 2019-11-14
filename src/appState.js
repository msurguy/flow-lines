import queryState from 'query-state'

export const qs = queryState({
  xf: 'cos((cos(y) - x * y))', // xFunction
  yf: 'x', // yFunction
  dt: 0.005, // dTest
  sd: 0.2, // separationDistance
  seed: 1, // seed
  sm: 0.2, // simplification
  color: '#000000', // strokeColor
  bg: null, // backgroundColor
  ts: 0.05, // timeStep
  sw: 1 // strokeWidth
}, {
  useSearch: true
})

const currentStateFromQuery = qs.get()

export const appState = {
  xFunction: currentStateFromQuery.xf,
  yFunction: currentStateFromQuery.yf,
  seed: currentStateFromQuery.seed,
  color: currentStateFromQuery.color,
  dTest: currentStateFromQuery.dt,
  separationDistance: currentStateFromQuery.sd, // Separation distance between new streamlines.
  simplification: currentStateFromQuery.sm, // line simplification amount (0.1-2)
  timeStep: currentStateFromQuery.ts,
  bg: currentStateFromQuery.bg,
  strokeWidth: currentStateFromQuery.sw
}
