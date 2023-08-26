# rogue-components

##Collection of vue/vuetify wrapper components. client side only (no build)
##'EUE' (pronounced Eeeewwww) style

* VUE3...Currently 3.2.47
* VUETIFY3...Currently 3.3.9 (In particular the Labs v-data-table).
* NO Typescript...Ok well sorta in default props...nothing intentional and only rely on vues client side ability.
* NO Build...Not a fan. These are NOT single file components (But do serve as great examples to remind us how SFC actually works)
* NO SFC...cause they require compile.
* FULL MPA...cause I can
* CDN where possible.
* UMD Downloads and IIFE (Immediately Invoked Function Expression js library (e.g. it appends itsself to the window object if in a browser)) 
* ECMA script type="importmap" and script type="module" usage where possible
* EMACS Written entirely within emacs.
* ROGUE..Some small animals may have been harmed during the making of these.
* MIXINS...yes but only because I havn't converted my mixins to composables and I'm not sure I want to.

* DEPENDENCIES:
  1. lodash@4.17.15 Sorry (not sorry).
  2. vue-json-excel3@1.0.0 for export csv/pdf/excel functionality
  
Install, just git clone source.
Directory layout:
rogue-components/
    html/index.html the test page
    static/components...where the js components live.
    static/js...where my ugly tool code lives

So just run a nginx or apache or what ever and serve the html and static dirs.
The test programs and components depend on relative urls:
/static/components/*.js
/static/js/tmb.js

Thats is. Clean-ish and simple.




