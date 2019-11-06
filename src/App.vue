<template>
  <div class="page">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="controls-wrapper">
        <div class="controls">
          <button class="btn btn-secondary btn-block" @click="regenerateStreamlines">Shuffle</button>
          <text-input label="X Formula" @reset="resetxFunction"
                      v-model="appState.xFunction"></text-input>
          <text-input label="Y Formula" @reset="resetyFunction"
                      v-model="appState.yFunction"></text-input>
          <slider :min="0.001" :max="0.1" :step=0.001 label="dTest" v-model.number="appState.dTest"></slider>
          <slider :min="0.001" :max="1" :step=0.001 label="Separation Distance" v-model.number="appState.separationDistance"></slider>
          <slider :min="0.02" :max="1" :step=0.001 label="Time Step" v-model.number="appState.timeStep"></slider>
          <slider :min="0.05" :max="1" :step=0.05 label="Simplification" v-model.number="appState.simplification"></slider>

          <color-picker :disable-alpha="true" @colorChange="setColor" label="Stroke" v-model="strokeColor"></color-picker>
          <color-picker :disable-alpha="true" @colorChange="setBackgroundColor" label="Background" v-model="bgColor"></color-picker>
          <slider :min="1" :max="10000" label="Seed" v-model.number="appState.seed"></slider>
        </div>
      </div>
      <div class="button">
        <div class="reveal"></div>
        <button class="btn btn-primary btn-block" @click.prevent="download">
          Download SVG
        </button>
      </div>
    </div>

    <!-- Page Content -->
    <div class="paper">
      <div class="sketch">
        <div id="drawing"></div>
      </div>
      <p id="xFunctionText" class="mt-2 mb-0 small text-black-50">x: {{ this.appState.xFunction }}</p>
      <p id="yFunctionText" class="small text-black-50">y: {{ this.appState.yFunction }}</p>
    </div>
    <div class="footer-wrapper">
        <div class="footer">
          <h1>Flow Lines</h1>
        </div>
      </div>
  </div>
</template>

<script>
import {appState, qs, defaults} from './appState'
import {simplify} from './lib/simplify-path'
import {generateFunction} from './lib/function-generator'
import streamlines from '@anvaka/streamlines'
import * as SVG from 'svg.js'
import {generateDownload} from './lib/svgDownload'
import ColorPicker from './components/ColorPicker/ColorPicker'
import TextInput from './components/TextInput'
import Slider from './components/Slider'

const math = require('./lib/math').default
const Randoma = require('randoma')

// What function to produce streamlines for
let vectorField
let streamlinesProcess = null
let SVGCanvas
let bgElement
let SVGGroup

export default {
  name: 'App',
  components: {
    ColorPicker,
    TextInput,
    Slider
  },
  data () {
    return {
      strokeColor: {
        hex: appState.color
      },
      bgColor: {
        hex: appState.bg
      },
      appState,
      paper: {
        width: 600, // width and height of SVG canvas
        height: 600
      },
      config: {
        boundingBox:
          {left: -5, top: -5, width: 10, height: 10} // This is the "zoom" level of the rendering
      }
    }
  },
  mounted () {
    SVGCanvas = SVG('drawing').size(this.paper.width, this.paper.height)
    math.config({randomSeed: this.appState.seed})
    this.generateStreamlines()
  },
  methods: {
    setColor (value) {
      SVGCanvas.select('polyline').stroke(value)
      this.appState.color = value
    },
    setBackgroundColor (value) {
      this.appState.bg = value
      if (this.appState.bg) {
        bgElement = SVGCanvas.rect(this.paper.width, this.paper.height).fill(value)
        bgElement.after(SVGGroup)
      }
      if (bgElement) bgElement.fill(value)
    },
    resetxFunction () {
      this.appState.xFunction = defaults.xFunction
    },
    resetyFunction () {
      this.appState.yFunction = defaults.yFunction
    },
    download () {
      generateDownload(SVGCanvas.node)
    },
    generateStreamlines () {
      SVGCanvas.clear()

      // put the currently used formulas into the SVG doc for future reference
      const description = document.createElement('title')
      description.innerHTML = `x=${this.appState.xFunction}|y=${this.appState.yFunction}|dTest=${this.appState.dTest}|sd=${this.appState.separationDistance}|sm=${this.appState.simplification}|ts=${this.appState.timeStep} | generated with FlowLines`
      SVGCanvas.node.appendChild(description)

      if (this.appState.bg) bgElement = SVGCanvas.rect(this.paper.width, this.paper.height).fill(this.appState.bg)

      SVGGroup = SVGCanvas.group()
      const config = this.config
      const paper = this.paper
      const color = this.appState.color
      const simplification = this.appState.simplification
      if (streamlinesProcess) streamlinesProcess.dispose()

      const random = new Randoma({seed: this.appState.seed})

      const seedPoint = {
        x: this.config.boundingBox.left + random.float() * this.config.boundingBox.width,
        y: this.config.boundingBox.top + random.float() * this.config.boundingBox.height
      }

      vectorField = p => {
        return {
          x: math.eval(this.appState.xFunction, { x: p.x, y: p.y }),
          y: math.eval(this.appState.yFunction, { x: p.x, y: p.y })
        }
      }

      streamlinesProcess = streamlines({
        vectorField,
        onStreamlineAdded (points) {
          let transformedPoints = []
          for (let i = 0; i < points.length; i++) {
            let tx = (points[i].x - config.boundingBox.left) / config.boundingBox.width
            let ty = (points[i].y - config.boundingBox.top) / config.boundingBox.height
            transformedPoints.push([Math.round(tx * paper.width * 100) / 100, Math.round(((1 - ty) * paper.height) * 100) / 100])
          }
          let simplifiedPath = simplify(transformedPoints, simplification)
          SVGGroup.polyline(simplifiedPath).fill('none').stroke({width: 1, color: color})
        },
        seed: seedPoint,
        boundingBox: config.boundingBox,
        // Separation distance between new streamlines.
        dSep: this.appState.separationDistance,
        // Distance between streamlines when integration should stop.
        dTest: this.appState.dTest,
        timeStep: this.appState.timeStep
      })
      streamlinesProcess.run()
    },
    regenerateStreamlines () {
      this.appState.xFunction = generateFunction()
      this.appState.yFunction = generateFunction()
      this.generateStreamlines()
    }
  },
  watch: {
    'appState.xFunction' (value) {
      qs.set({xf: value})
      this.generateStreamlines()
    },
    'appState.yFunction' (value) {
      qs.set({yf: value})
      this.generateStreamlines()
    },
    'appState.seed' (value) {
      qs.set({seed: value})
    },
    'appState.dTest' (value) {
      qs.set({dt: value})
      this.generateStreamlines()
    },
    'appState.separationDistance' (value) {
      qs.set({sd: value})
      this.generateStreamlines()
    },
    'appState.simplification' (value) {
      qs.set({sm: value})
      this.generateStreamlines()
    },
    'appState.timeStep' (value) {
      qs.set({ts: value})
      this.generateStreamlines()
    },
    'appState.color' (value) {
      qs.set({color: value})
    },
    'appState.bg' (value) {
      qs.set({bg: value})
    }
  }
}
</script>

<style scoped>
  .page {
    min-height: 100vh;
    position: relative;
    height: 100%;
    display: flex;
  }

  .controls-wrapper {
    max-height: 100vh;
    overflow: auto;
    position: relative;
  }

  .controls {
    background-color: grey;
    width: 100%;
    margin-bottom: 50px;
    position: relative;
    height: auto;
  }

  .button {
    position: absolute;
    bottom: 0;
    width: 100%;
    text-align: center;
  }

  .reveal {
    display: block;
    height: 15px;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%,rgb(47, 47, 47) 100%);
  }

  .paper {
    background-color: #dedede;
    position: relative;
    max-height: 100vh;
    width: calc(100% - 300px);
    overflow: scroll;
    padding: 10px;
    z-index: 1;
  }

  #drawing {
    display: inline-block;
    border: 10px solid #FFFFFF;
  }

  .sidebar {
    z-index: 10;
    width: 300px;
    position: relative;
    box-shadow: 0 0 5px 6px rgba(97, 94, 94, 0.45);
  }

  .footer-wrapper {
    z-index: 1000;
    position: absolute;
    bottom: 0;
    right: 0;
    color: #2D2D2D;
  }

  .footer {
    padding: 15px 15px 0 15px;
    text-align: right;
  }

  @media (max-width: 767px) {
    .page {
      flex-direction: column-reverse;
    }

    .controls-wrapper {
      max-height: none;
    }

    .sidebar {
      width: 100%;
    }

    .paper {
      width: 100%;
      max-height: none;
    }

    .footer-wrapper {
      position: relative;
      background-color: #CCC;
    }
  }
</style>
