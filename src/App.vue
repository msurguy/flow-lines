<template>
  <div class="page">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="controls-wrapper">
        <div class="controls">
          <button class="btn btn-secondary btn-block" @click="regenerateStreamlines">Regenerate</button>
          <text-input label="X Formula" @reset="resetxFunction"
                      v-model="appState.xFunction"></text-input>
          <text-input label="Y Formula" @reset="resetyFunction"
                      v-model="appState.yFunction"></text-input>
          <slider :min="0.001" :max="0.1" :step=0.001 label="dTest" v-model.number="appState.dTest"></slider>
          <slider :min="0.001" :max="1" :step=0.001 label="Separation Distance" v-model.number="appState.separationDistance"></slider>
          <slider :min="0.02" :max="1" :step=0.001 label="Time Step" v-model.number="appState.timeStep"></slider>

          <color-picker v-model="colors" :disable-alpha="true" @colorChange="setColor"></color-picker>
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
import {generateXFunction, generateYFunction} from './lib/function-generator'
import streamlines from '@anvaka/streamlines'
import * as SVG from 'svg.js'
import {generateDownload} from './lib/svgDownload'
import ColorPicker from './components/ColorPicker/ColorPicker'
import TextInput from './components/TextInput'
import Slider from './components/Slider'

// What function to produce streamlines for
let vectorField
let streamlinesProcess = null
let SVGCanvas

export default {
  name: 'App',
  components: {
    ColorPicker,
    TextInput,
    Slider
  },
  data () {
    return {
      colors: {
        hex: appState.color
      },
      appState,
      paper: {
        width: 600, // width and height of SVG canvas
        height: 600
      },
      color: appState.color,
      config: {
        boundingBox:
          {left: -5, top: -5, width: 10, height: 10} // This is the "zoom" level of the rendering
      },
      seedPoint: {}
    }
  },
  mounted () {
    SVGCanvas = SVG('drawing').size(this.paper.width, this.paper.height)
    this.seedPoint = {
      x: this.config.boundingBox.left + Math.random() * this.config.boundingBox.width,
      y: this.config.boundingBox.top + Math.random() * this.config.boundingBox.height
    }

    let func = `function vectorField(p) {
        return {
          x: ${this.appState.xFunction},
          y: ${this.appState.yFunction}
        };
      }`
    vectorField = this.compileVectorFieldFunction(func)
    this.generateStreamlines()
  },
  methods: {
    setColor (value) {
      this.color = value
      SVGCanvas.select('polyline').stroke(value)
      this.appState.color = value
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
    compileVectorFieldFunction (code) {
      try {
        // eslint-disable-next-line no-new-func
        let creator = new Function(code + '\nreturn vectorField;')
        let vectorField = creator()
        vectorField(this.seedPoint)
        return vectorField
      } catch (e) {
        alert(e.message)
        return null
      }
    },
    generateStreamlines () {
      SVGCanvas.clear()
      const svgGroup = SVGCanvas.group()
      const config = this.config
      const paper = this.paper
      const color = this.color
      const simplification = this.appState.simplification
      const separationDistance = this.appState.separationDistance
      const dTest = this.appState.dTest
      const timeStep = this.appState.timeStep
      if (streamlinesProcess) streamlinesProcess.dispose()

      streamlinesProcess = streamlines({
        vectorField,
        onStreamlineAdded (points) {
          let transformedPoints = []
          for (let i = 0; i < points.length; i++) {
            let tx = (points[i].x - config.boundingBox.left) / config.boundingBox.width
            let ty = (points[i].y - config.boundingBox.top) / config.boundingBox.height
            transformedPoints.push([Math.round(tx * paper.width * 10) / 10, Math.round(((1 - ty) * paper.height) * 10) / 10])
          }
          let simplifiedPath = simplify(transformedPoints, simplification)
          svgGroup.polyline(simplifiedPath).fill('none').stroke({width: 1, color: color})
        },
        seed: this.seedPoint,
        boundingBox: config.boundingBox,
        // Separation distance between new streamlines.
        dSep: separationDistance,
        // Distance between streamlines when integration should stop.
        dTest: dTest,
        timeStep: timeStep
      })
      streamlinesProcess.run()
    },
    regenerateStreamlines () {
      let xFunc = generateXFunction()
      let yFunc = generateYFunction()

      this.appState.xFunction = xFunc
      this.appState.yFunction = yFunc

      let func = `function vectorField(p) {
        return {
          x: ${xFunc},
          y: ${yFunc}
        };
      }`
      vectorField = this.compileVectorFieldFunction(func)
      streamlinesProcess.dispose()
      this.generateStreamlines()
    }
  },
  watch: {
    'appState.xFunction' (value) {
      qs.set({xf: value})
    },
    'appState.yFunction' (value) {
      qs.set({yf: value})
    },
    'appState.seed.value' (value) {
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
    'appState.timeStep' (value) {
      qs.set({ts: value})
      this.generateStreamlines()
    },
    'appState.color' (value) {
      qs.set({color: value})
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
      flex-direction: column;
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
