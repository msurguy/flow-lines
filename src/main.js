// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import './sass/bootstrap.scss'
import SvgIcon from 'vue-svgicon'

Vue.config.productionTip = false

// Default tag name is 'svgicon'
Vue.use(SvgIcon, {
  tagName: 'svgicon'
})

new Vue({
  render: h => h(App)
}).$mount('#app')
