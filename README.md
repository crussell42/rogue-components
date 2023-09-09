# rogue-components

## Reasoning
I like the look of vuetify and appreciate their work so wanted to add some examples in hopes of increased adoption.
Wanted to go ahead and try converting some of my 2.6 vue stuff to vue 3ish. 

## Component general rules
* VUE3...Currently 3.2.47
* VUETIFY3...Currently 3.3.9 (In particular the Labs v-data-table).
* NO Typescript...Ok well sorta in default props...nothing intentional and only rely on vues client side ability.
* NO Build...(Its already built just not chunked, dehydrated and stirred)
* NO SFC...cause they require compile.
* FULL MPA...cause I can
* CDN where possible.
* UMD Downloads and IIFE (Immediately Invoked Function Expression js library (e.g. it appends itsself to the window object if in a browser)) 
* ECMA script type="importmap" and script type="module" usage where possible
* EMACS Written entirely within emacs.
* ROGUE..Some small creatures may have been harmed during the making of these. (mostly fish but dont ask)
* MIXINS...yes but only because I havn't converted my mixins to composables and I'm not sure I want to.

**DEPENDENCIES:**
  1. my browser util code static/js/tmb.js
  2. lodash@4.17.15 Sorry (not sorry).
  3. vue-json-excel3@1.0.0 for export csv/pdf/excel functionality

**Components**
* **RcTable.js**...a wrapper for v-data-table that adds a bunch of functionality. In particular:
  * Adds a RcTableToolbar that can have custom functions act on selected rows.
  * Allows custom row level filters, column level filters, and the search bar
  * Allows export/download of table data to csv, pdf, excel
  * Add remove optional columns
  * Filters for array based fields as well as string and some date stuff
  * Format values in columns
  * Sensible multi select (select none, select all, invert selection)
  * Sensible sort with tooltips for all headers.
  * Totals lines
* **RcTableToolbar.js**..used in RcTable. Holds row level filters, text search filter, reload button, select column button, export button, and custom buttons for actions based on selected items.
* **RcSelectMenu.js**..used in RcTable. allows select all, none, invert and has a badge which shows count of selected items
* **RcColumnFilter.js**..used in RcTable a dialog that lets you select filter criteria based on content of field (include or exclude)
* **RcBastardScroll.js**..a little "scroll back to top" floating icon on bottom right that will scroll page to top. Only shows up if currently scrolled down.
* **RcTagsAddField.js**..Lets you select tags and add a tag if it does not alread exist.
* **RcPhoneField.js**..A sensible phone number input field...pattern based
* **RcPatternField.js**..General purpose version of a phone field...somewhat helpful
* **RcNamedDaterange.js**..Date range picker with some named ranges (for instance 'This Quarter')

## Install
$ git clone https://github.com/crussell42/rogue-components.git

## Directory layout
* rogue-components/
    * html/index.html components test page
    * static/components...where the js components live.
    * static/js...where my ugly tmb tool code lives

So just run a nginx or apache or what ever and serve the html and static dirs.
The test programs and components depend on relative urls:
/static/components/*.js
/static/js/tmb.js

Thats is. Clean-ish and simple.

## Live preview
https://aerospacey.io/demo/rogue-components/index.html

## Screen Grabs


![Screenshot at 2023-08-26 19-44-09](https://github.com/crussell42/rogue-components/assets/6598114/afe0a97b-769a-4db3-927c-4f08784ecea8)


## Observations: Vue 2.6 to Vue 3 and Vuetify2 to Vuetify3
* In general I have been able to convert my ver 2 stuff to ver 3 mostly by ignoring composition at first then refactoring later.
* I think having straight named object components has simplified things 
* Slot changes in vuetify have caused the most greif.
  * v-data-table v-slot:header.<keyName> is now column.<keyName>
  * v-data-table v-slot:body.append is gone.
  * v-bind, v-on merged now v-bind=mergeProps(menu,tooltip) (import mergeProps from vue)
  * activator now v-slot:activator="{props: menu}
  * align="right" is now align="end"

## The 'EUE' style...(pronounced Eeeewwww)
Originated from ejs server side templating in node with vue as UI. The EUE style may fall outside of the standard accepted and sterile standards of the day, but work and are in fact used in active projects although mostly in internal projects. May include ugly server side templating in ejs, django, etc.
If you dont fully drink the koolaid of micro services, typescript, obfuscation, chunking, hydration, treeshaking, spas and amorphous programming; these components may be for you.  -Or-, if you actually just need to get something done or want an easy to read and understandable source they may be for you.


## Sample nginx configuration to run the component test page.
The html dir and static dir must be served. Use nginx alias to achieve this.

```

server {
	listen 80;
	listen [::]:80;

	server_name roxy 192.168.1.12;

	root /home/chris/rogue-components/html;
	index index.html;

	location /static/ {
	        alias /home/chris/rogue-components/static/;	
	}
	location / {
		try_files $uri $uri/ =404;
	}
	
}

```

