import {simplify} from './simplify-path'
import {generateFunction} from './function-generator'

const config = {
  separationDistance: 0.2, // Separation distance between new streamlines.
  simplification: 0.1, // line simplification amount (0.1-2)
  paperWidth: 600, // width and height of SVG canvas
  paperHeight: 600,
  boundingBox:
    {left: -5, top: -5, width: 10, height: 10} // This is the "zoom" level of the rendering
}

// What function to produce streamlines for
let vectorField = function (p) {
  return {
    x: Math.cos((Math.cos(p.y) - p.x * p.y)),
    y: (p.x)
  }
}

let SVGcanvas = SVG('drawing').size(config.paperWidth, config.paperHeight)
let width = SVGcanvas.width()
let height = SVGcanvas.height()

const seedPoint = {
  x: config.boundingBox.left + Math.random() * config.boundingBox.width,
  y: config.boundingBox.top + Math.random() * config.boundingBox.height
}

function compileVectorFieldFunction (code) {
  try {
    // eslint-disable-next-line no-new-func
    let creator = new Function(code + '\nreturn vectorField;')
    let vectorField = creator()
    vectorField(seedPoint) // just a test.
    return vectorField
  } catch (e) {
    alert(e.message)
    // fieldCode.error = e.message;
    return null
  }
}

let streamlinesProcess = null

const generateStreamlines = function () {
  SVGcanvas.clear()
  const description = document.createElement('title')
  description.innerHTML = document.getElementById('function').innerHTML.trim()

  SVGcanvas.node.appendChild(description)
  const svgGroup = SVGcanvas.group()

  streamlinesProcess = streamlines({
    // As usual, define your vector field:
    //  vectorField(p) { return {x: Math.sin(p.x*p.x)*p.y, y: p.x}; },
    vectorField,
    onStreamlineAdded (points) {
      let transformedPoints = []
      for (let i = 0; i < points.length; i++) {
        let tx = (points[i].x - config.boundingBox.left) / config.boundingBox.width
        let ty = (points[i].y - config.boundingBox.top) / config.boundingBox.height
        transformedPoints.push([Math.round(tx * width * 10) / 10, Math.round(((1 - ty) * height) * 10) / 10])
      }
      let simplifiedPath = simplify(transformedPoints, config.simplification)
      let polyline = svgGroup.polyline(simplifiedPath).fill('none').stroke({width: 1})
    },
    seed: seedPoint,
    boundingBox: config.boundingBox,
    // Separation distance between new streamlines.
    dSep: config.separationDistance,

    // Distance between streamlines when integration should stop.
    dTest: 0.001,
    timeStep: 0.01
  })
  streamlinesProcess.run()
}

generateStreamlines()

let downloadButtonEl = document.getElementById('download')

downloadButtonEl.addEventListener('click', writeDownloadLink)

let regenerateButtonEl = document.getElementById('generate')
regenerateButtonEl.addEventListener('click', function () {
  let func = generateFunction()
  document.getElementById('function').innerHTML = func
  vectorField = compileVectorFieldFunction(func)

  streamlinesProcess.dispose()
  generateStreamlines()
})
