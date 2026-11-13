import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import JoiAskHome from './JoiAskHome.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('JoiAskHome', JoiAskHome)
  }
} satisfies Theme
