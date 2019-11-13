<template>
  <div class="page">
    <!-- Sidebar -->
    <div class="sidebar">
      <div class="controls-wrapper">
        <div class="controls">
          <div class="btn-group  d-flex" role="group" aria-label="Basic example">
            <button type="button" class="btn btn-sm btn-primary" :disabled="history.index === 0" @click="backInHistory"><svg viewBox="0 0 32 32" width="24" height="24" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              <path d="M10 6 L2 16 10 26 M2 16 L30 16"></path>
            </svg></button>
            <button type="button" class="btn btn-sm btn-primary" :disabled="history.items.length <= 1 || (history.index === history.items.length - 1)" @click="forwardInHistory"><svg viewBox="0 0 32 32"  width="24" height="24" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              <path d="M22 6 L30 16 22 26 M30 16 L2 16"></path>
            </svg></button>
            <button type="button" class="btn btn-sm btn-primary" @click="regenerateStreamlines">Randomize</button>
          </div>
          <text-input label="X Formula"
                      :tooltip="formulaHelpText"
                      v-model="appState.xFunction"></text-input>
          <text-input label="Y Formula"
                      :tooltip="formulaHelpText"
                      v-model="appState.yFunction"></text-input>
          <slider :min="0.001" :max="0.2" :step="0.001" label="dTest" v-model.number="appState.dTest"></slider>
          <slider :min="0.001" :max="1" :step="0.001" label="Separation Distance" v-model.number="appState.separationDistance"></slider>
          <slider :min="0.01" :max="1" :step="0.001" label="Time Step" v-model.number="appState.timeStep"></slider>
          <slider :min="0.05" :max="1" :step="0.05" label="Simplification" v-model.number="appState.simplification"></slider>
          <slider :min="1" :max="5" :step="1" label="Stroke Width" v-model.number="appState.strokeWidth"></slider>
          <color-picker :disable-alpha="true" @colorChange="setColor" label="Stroke" v-model="strokeColor"></color-picker>
          <color-picker :disable-alpha="true" @colorChange="setBackgroundColor" label="Background" v-model="bgColor"></color-picker>
          <slider :min="1" :max="10000" label="Seed" v-model.number="appState.seed"></slider>
        </div>
      </div>
      <div class="bottom-sheet">
        <div class="reveal"></div>
        <div class="d-flex pt-2 pb-2 download-wrapper">
          <button class="btn ml-3 btn-primary btn-block" @click.prevent="download">
            Download SVG <svg viewBox="0 6 32 32" width="16" height="16" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path d="M28 22 L28 30 4 30 4 22 M16 4 L16 24 M8 16 L16 24 24 16"></path>
          </svg>
          </button>
          <button class="btn btn-xsm ml-3 mr-3" :class="{'animate-heart': favorites.animateHeart }" @animationend="favorites.animateHeart = false" @click.prevent="addToFavorites"><svg viewBox="0 0 32 32" width="22" height="22" fill="#af2430" stroke="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path d="M4 16 C1 12 2 6 7 4 12 2 15 6 16 8 17 6 21 2 26 4 31 6 31 12 28 16 25 20 16 28 16 28 16 28 7 20 4 16 Z"></path>
          </svg></button>
          <transition name="list-button">
            <button v-if="favorites.items.length" @click="favorites.opened = !favorites.opened" class="btn btn-xsm mr-3"><svg viewBox="0 0 32 32" width="22" height="22" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
              <path d="M4 8 L28 8 M4 16 L28 16 M4 24 L28 24"></path>
            </svg></button>
          </transition>
        </div>
      </div>
      <transition name="favorites">
        <div v-if="favorites.opened" class="favorites-wrapper">
          <p class="pl-2 mb-1 mt-2">FAVORITES:
            <button class="btn float-right badge badge-pill badge-dark mr-2" @click="favorites.tooltip = !favorites.tooltip">?</button></p>
          <transition name="slide">
            <p class="p-2 mb-0" v-if="favorites.tooltip">Favorites are stored locally in your browser and will be cleared if you refresh the browser.</p>
          </transition>
          <transition-group name="slide" tag="ul">
          <li v-for="(favoriteData, favoriteIndex) in favorites.items" :key="favoriteData.hash">
            <span class="action">
              <button @click="restoreFavorite(favoriteData)" class="btn btn-xsm">
                <svg viewBox="0 0 32 32" width="18" height="18" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                <circle cx="17" cy="15" r="1"></circle>
                <circle cx="16" cy="16" r="6"></circle>
                <path d="M2 16 C2 16 7 6 16 6 25 6 30 16 30 16 30 16 25 26 16 26 7 26 2 16 2 16 Z"></path>
                </svg>
              </button>
            </span>
            <span class="contents">
              x: {{ favoriteData.x }} <br>
              y: {{ favoriteData.y }}
            </span>
            <button class="btn btn-xsm delete" @click="deleteFavorite(favoriteIndex)">
              <svg viewBox="0 0 32 32" width="18" height="18" fill="#000000" stroke="#fb00a5" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
                <path d="M28 6 L6 6 8 30 24 30 26 6 4 6 M16 12 L16 24 M21 12 L20 24 M11 12 L12 24 M12 6 L13 2 19 2 20 6"></path>
              </svg>
            </button>
          </li>
          </transition-group>
        </div>
      </transition>
    </div>
    <!-- Page Content -->
    <div class="paper">
      <div class="sketch">
        <div id="drawing"></div>
      </div>
      <p id="xFunctionText" class="mt-2 mb-0 small text-black-50">x: {{ this.appState.xFunction }}</p>
      <p id="yFunctionText" class="small text-black-50">y: {{ this.appState.yFunction }}</p>
    </div>

    <div class="sharing-wrapper">
      <span class="text-black-50 small">Share this: </span> <a target="_blank" :href="`https://twitter.com/intent/tweet?text=Flow%20Lines%20SVG%20generator&url=${sharingURL}&via=msurguy`">
      <svg viewBox="0 0 64 64" width="22" height="22"><path stroke-width="0" fill="currentColor" d="M60 16 L54 17 L58 12 L51 14 C42 4 28 15 32 24 C16 24 8 12 8 12 C8 12 2 21 12 28 L6 26 C6 32 10 36 17 38 L10 38 C14 46 21 46 21 46 C21 46 15 51 4 51 C37 67 57 37 54 21 Z"></path> </svg>
      </a>
    </div>
    <div class="footer-wrapper">
        <div class="footer">
          <h2>Flow Lines</h2>
          <p class="small">Project by <a target="_blank" href="http://twitter.com/msurguy">@msurguy</a> <br>
            <a target="_blank" href="http://github.com/msurguy/flow-lines">Source</a> | <a target="_blank" href="https://github.com/sponsors/msurguy">Support</a>
          </p>
        </div>
      </div>
  </div>
</template>

<script>
import { appState, qs } from './appState'
import { simplify } from './lib/simplify-path'
import { generateFunction } from './lib/function-generator'
import streamlines from '@anvaka/streamlines'
import * as SVG from 'svg.js'
import { generateDownload } from './lib/svgDownload'
import ColorPicker from './components/ColorPicker/ColorPicker'
import TextInput from './components/TextInput'
import Slider from './components/Slider'
import { formulaHelpText } from './help/text'
import { hash } from './lib/hash'
import * as query from 'query-state/lib/query'

const math = require('./lib/math').default
const Randoma = require('randoma')
const projectURL = 'https://msurguy.github.io/flow-lines/'

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
          { left: -5, top: -5, width: 10, height: 10 } // This is the "zoom" level of the rendering
      },
      formulaHelpText,
      history: {
        index: 0,
        items: [
          {
            x: appState.xFunction,
            y: appState.yFunction
          }
        ]
      },
      favorites: {
        tooltip: false,
        opened: false,
        items: [],
        animateHeart: false
      },
      sharingURL: projectURL
    }
  },
  mounted () {
    SVGCanvas = SVG('drawing').addClass('svg-paper').size(this.paper.width, this.paper.height).viewbox({ x: 0, y: 0, width: this.paper.width, height: this.paper.height })
    math.config({ randomSeed: this.appState.seed })
    this.generateStreamlines()
    this.updateSharingURL(false)
  },
  methods: {
    addToFavorites () {
      this.favorites.animateHeart = true

      const favorite = {
        x: this.appState.xFunction,
        y: this.appState.yFunction,
        dTest: this.appState.dTest,
        separationDistance: this.appState.separationDistance,
        timeStep: this.appState.timeStep,
        simplification: this.appState.simplification,
        strokeWidth: this.appState.strokeWidth,
        color: this.appState.color,
        bg: this.appState.bg,
        seed: this.appState.seed
      }

      // check if this favorite already exists in the list of favorites
      const hashedFavorite = hash(JSON.stringify(favorite))
      const favoriteExists = this.favorites.items.find(favorite => favorite.hash === hashedFavorite)

      if (favoriteExists) return

      this.favorites.items.unshift({
        ...favorite,
        hash: hashedFavorite
      })
    },
    restoreFavorite (favorite) {
      this.appState.xFunction = favorite.x
      this.appState.yFunction = favorite.y
      this.appState.dTest = favorite.dTest
      this.appState.separationDistance = favorite.separationDistance
      this.appState.timeStep = favorite.timeStep
      this.appState.simplification = favorite.simplification
      this.appState.strokeWidth = favorite.strokeWidth
      this.appState.color = favorite.color
      this.appState.bg = favorite.bg
      this.appState.seed = favorite.seed
      this.generateStreamlines()
    },
    deleteFavorite (favoriteIndex) {
      this.favorites.items.splice(favoriteIndex, 1)
    },
    addToHistory () {
      this.history.items.push({ x: this.appState.xFunction, y: this.appState.yFunction })
      this.history.index = this.history.items.length - 1
    },
    backInHistory () {
      if (this.history.index > 0) {
        this.history.index--
        this.appState.xFunction = this.history.items[this.history.index].x
        this.appState.yFunction = this.history.items[this.history.index].y
      }
    },
    forwardInHistory () {
      if (this.history.index < this.history.items.length) {
        this.history.index++
        this.appState.xFunction = this.history.items[this.history.index].x
        this.appState.yFunction = this.history.items[this.history.index].y
      }
    },
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
      const strokeWidth = this.appState.strokeWidth
      const simplification = this.appState.simplification
      if (streamlinesProcess) streamlinesProcess.dispose()

      const random = new Randoma({ seed: this.appState.seed })

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
          SVGGroup.polyline(simplifiedPath).fill('none').stroke({ width: strokeWidth, color: color })
        },
        seed: seedPoint,
        boundingBox: config.boundingBox,
        // Separation distance between new streamlines.
        dSep: this.appState.separationDistance,
        // Distance between streamlines when integration should stop.
        dTest: this.appState.dTest,
        timeStep: this.appState.timeStep
      })
      streamlinesProcess.run().then(() => {
        // Convert the SVG to small thumbnail that can be stored in local storage
        // keep thumbnail in memory until the user decides if they want to favorite the current setup or not
      })
    },
    regenerateStreamlines () {
      this.appState.xFunction = generateFunction()
      this.appState.yFunction = generateFunction()
      this.generateStreamlines()
      this.addToHistory()
    },
    updateSharingURL (appendQuery) {
      const queryPrefix = appendQuery ? '#?' : ''
      // For twitter, we need to replace = and & with HTML encoded characters
      this.sharingURL = (encodeURIComponent(projectURL + queryPrefix) + query.stringify(qs.get())).split('=').join('%3D').split('&').join('%26')
    }
  },
  watch: {
    appState: {
      handler () {
        // Need to wait until all items in appState is updated
        this.$nextTick(function () {
          this.updateSharingURL(true)
        })
      },
      deep: true
    },
    'appState.xFunction' (value) {
      qs.set({ xf: value })
      this.generateStreamlines()
    },
    'appState.yFunction' (value) {
      qs.set({ yf: value })
      this.generateStreamlines()
    },
    'appState.seed' (value) {
      qs.set({ seed: value })
    },
    'appState.dTest' (value) {
      qs.set({ dt: value })
      this.generateStreamlines()
    },
    'appState.separationDistance' (value) {
      qs.set({ sd: value })
      this.generateStreamlines()
    },
    'appState.simplification' (value) {
      qs.set({ sm: value })
      this.generateStreamlines()
    },
    'appState.timeStep' (value) {
      qs.set({ ts: value })
      this.generateStreamlines()
    },
    'appState.color' (value) {
      qs.set({ color: value })
    },
    'appState.strokeWidth' (value) {
      qs.set({ sw: value })
      SVGCanvas.select('polyline').stroke({ width: value })
    },
    'appState.bg' (value) {
      qs.set({ bg: value })
    },
    'favorites.items' (value) {
      if (value.length === 0) this.favorites.opened = false
    }
  }
}
</script>

<style scoped lang="scss">
  .page {
    min-height: 100vh;
    position: relative;
    height: 100%;
    display: flex;
  }

  .favorites-wrapper {
    position: absolute;
    width: 240px;
    background-color: #222222;
    height: 100%;
    top: 0;
    right: -240px;
    overflow-y: scroll;
    z-index: 1;
    box-shadow: 0 0 5px 6px rgba(97, 94, 94, 0.45);

    p {
      font-family: monaco, Consolas, Lucida Console, monospace;
      font-size: 14px;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      margin-top: 2px;
      background-color: #0d0d0d;
      font-size: 12px;
      padding: 5px 5px;
      position: relative;
      display: flex;
      align-items: center;

      .action {
        padding-right: 5px;
      }

      .contents {
        position: relative;
        flex-grow: 1;
        white-space: nowrap;
        overflow-x: scroll;
      }

      .delete {
        background-color: rgba(0,0,0,0);
        position: absolute;
        top: 5px;
        right: 2px;
      }
    }
  }

  .sharing-wrapper {
    z-index: 1001;
    position: absolute;
    top: 0;
    right: 0;
    color: #2D2D2D;
    padding: 10px;
  }

  .controls-wrapper {
    max-height: 100vh;
    overflow: auto;
    position: relative;
    z-index: 2;
  }

  .controls {
    background-color: grey;
    width: 100%;
    margin-bottom: 50px;
    position: relative;
    height: auto;
  }

  .bottom-sheet {
    position: absolute;
    bottom: 0;
    width: 100%;
    text-align: center;
    z-index: 3;
  }

  .animate-heart {
    animation: heartPulse .25s ease both;
  }

  @keyframes heartPulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
  }

  .download-wrapper {
    background-color: #393939;
  }

  .reveal {
    display: block;
    height: 15px;
    pointer-events: none;
    background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 20%, rgb(47, 47, 47) 100%);
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

  @media (min-width: 768px) {
    .favorites-enter-active, .favorites-leave-active  {
      transition: transform 0.3s ease-in-out;;
    }
    .favorites-enter, .favorites-leave-to {
      transform: translateX(-240px); // width of the thumbnail panel
    }
  }

  @media (max-width: 767px) {
    .page {
      flex-direction: column-reverse;
    }

    .controls-wrapper {
      max-height: none;
    }

    .sharing-wrapper {
      position: absolute;
      left: 0;
      padding: 15px;
    }

    .sidebar {
      width: 100%;
    }

    .paper {
      width: 100%;
      max-height: none;
      overflow: hidden;
    }

    .footer-wrapper {
      position: relative;
      background-color: #CCC;
    }

    #xFunctionText, #yFunctionText {
      display: none;
    }

    .favorites-wrapper {
      position: relative;
      width: 100%;
      background-color: #222222;
      min-height: 100px;
      overflow-y: scroll;
      top: 0;
      right: 0;
      padding-bottom: 60px;
    }

    .favorites-enter-active, .favorites-leave-active  {
      transition: opacity 0.3s ease-in-out;;
    }
    .favorites-enter, .favorites-leave-to {
      opacity: 0;
    }
  }
</style>
