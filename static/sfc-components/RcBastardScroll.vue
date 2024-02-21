<template>
    <v-fab-transition>          
      <slot>
	  <v-btn
	    :style="margin"
	    v-scroll="onScroll"
            v-show="showScrollFab"
            fab
            position="absolute"
            location="bottom right"
            :color="color"
            @click="toTop"
            icon="mdi-chevron-up"
            >

          </v-btn>
        </slot>
    </v-fab-transition>    
</template>

<script>
//export const RcBastardScroll = {
export default {

    props: {
	elementid: {type: String, default: 'app'},
	//color: {type: String, default: 'deep-purple lighten-2'},
	color: {type: String, default: 'primary'},	
	margin: {type: String, default: 'margin-bottom:100px;'},	
    },
    setup(props) {
	const appElement = document.getElementById(props.elementid);
	return {
	    appElement
	}
    },

    
    data: function() {
	return {
	    showScrollFab: false,	    
	}
    },
    methods: {
	onScroll (e) {
	    if (typeof window === 'undefined') return;
	    const top = window.pageYOffset ||   e.target.scrollTop || 0;
	    this.showScrollFab = top > 20
	},
	toTop () {
	    //THIS IS A MASSIVE HACK AT THIS POINT.
	    //vuetify3 has not yet done a goTo method as in vuetify2 and suggest scrollIntoView as a solution....lame.
	    //IM NOT CRAZY...the import of goTo in the vuetify documentation does not work.
	    //const element = document.getElementById("app");
	    this.appElement.scrollIntoView(true);
	    //console.log('BastardScroll:',$vuetify.poop);
	},
    },
}
</script>