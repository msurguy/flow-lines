const cfProb = 10 // base probability to generate a point.

const probabilityClass = {
  POINT: cfProb,
  LENGTH: cfProb * 0.5,
  TRIGONOMETRY: cfProb * 0.9,
  ARITHMETICS: cfProb * 0.6,
  MINMAX: cfProb * 0.4,
  EXP: cfProb * 0.1,
  SIGN: cfProb * 0.01
}

class BaseFunctionNode {
  constructor (className) {
    this.probability = 0
    this.className = className
  }

  getProbability () {
    return probabilityClass[this.className]
  }

  render () {
    return ''
  }
}

class SingleArgumentFunction extends BaseFunctionNode {
  constructor (operator, p) {
    super(p)
    this.operator = operator
  }

  render () {
    const prevP = this.getProbability()
    probabilityClass[this.className] *= 0.25
    normalizeProbabilities()
    let args = generateArguments()
    probabilityClass[this.className] = prevP
    normalizeProbabilities()
    return this.operator(args)
  }
}

class DualArgumentFunction extends BaseFunctionNode {
  constructor (operator, p) {
    super(p)
    this.operator = operator
  }

  render () {
    const prevP = this.getProbability()
    probabilityClass[this.className] *= 0.25

    normalizeProbabilities()
    const left = generateArguments()
    const right = generateArguments()
    probabilityClass[this.className] = prevP
    normalizeProbabilities()
    return this.operator(left, right)
  }
}

class ConstantFunction extends BaseFunctionNode {
  constructor (constant, p) {
    super(p)
    this.constant = constant
  }

  render () {
    return this.constant
  }
}

const fList = [
  new ConstantFunction('p.x', 'POINT'),
  new ConstantFunction('p.y', 'POINT'),

  new ConstantFunction('Math.sqrt(p.x*p.x + p.y * p.y)', 'LENGTH'),

  new SingleArgumentFunction(a => `Math.sin(${a})`, 'TRIGONOMETRY'),
  new SingleArgumentFunction(a => `Math.cos(${a})`, 'TRIGONOMETRY'),
  // new SingleArgumentFunction(a => `Math.sqrt(${a})`, cfProb * 0.8),
  // new SingleArgumentFunction(a => `inversesqrt(${a})`, cfProb * 0.8),

  new DualArgumentFunction((a, b) => `${a}*${b}`, 'ARITHMETICS'),
  new DualArgumentFunction((a, b) => `${a}/${b}`, 'ARITHMETICS'),
  new DualArgumentFunction((a, b) => `(${a}+${b})`, 'ARITHMETICS'),
  new DualArgumentFunction((a, b) => `(${a}-${b})`, 'ARITHMETICS'),

  new DualArgumentFunction((a, b) => {
    if (a === b) return a
    return `Math.min(${a},${b})`
  }, 'MINMAX'),
  new DualArgumentFunction((a, b) => {
    if (a === b) return a
    return `Math.max(${a},${b})`
  }, 'MINMAX'),

  new SingleArgumentFunction(a => `Math.log(Math.abs(${a}))`, 'EXP'),
  new SingleArgumentFunction(a => `Math.exp(${a})`, 'EXP'),
  new DualArgumentFunction((a, b) => `Math.pow(${a}, ${b})`, 'EXP'),

  new SingleArgumentFunction(a => `Math.abs(${a})`, 'SIGN'),
  new SingleArgumentFunction(a => `Math.sign(${a})`, 'SIGN')

  // new ConstantFunction('1.', cfProb * 0.001),
]

function normalizeProbabilities () {
  let sum = 0
  fList.forEach(element => (sum += element.getProbability()))
  fList.forEach(element => (element.probability = element.getProbability() / sum))
}

function generateArguments () {
  const p = Math.random()
  let cumulativeProbability = 0
  let item
  for (let i = 0; i < fList.length; ++i) {
    item = fList[i]
    cumulativeProbability += item.probability
    if (p < cumulativeProbability) {
      break
    }
  }

  if (!item) throw new Error('no more items')

  return item.render()
}

export const generateFunction = () => {
  normalizeProbabilities()
  const vX = generateArguments()
  const vY = generateArguments()
  return `function vectorField(p) {
  return {
    x: ${vX},
    y: ${vY}
  };
}`
}

export const generateXFunction = () => {
  normalizeProbabilities()
  return generateArguments()
}

export const generateYFunction = () => {
  normalizeProbabilities()
  return generateArguments()
}
