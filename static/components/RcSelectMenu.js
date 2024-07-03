import {ref,reactive} from 'vue'

export const RcSelectMenu = {

    props: {
	items: {type: Array, default: function() {return []}},	
	selected: {type: Array, default: function() {return []}},

	visibleitems: {type: Array, default: function() {return []}},
	//These should be the available items on the page (sorted/filtered)
	//However, in vuetify3 the @current-items event seems to have been removed.
	//SO for vuetify3 see RcTable computed currentlyVisibleItems() which uses a
	//slice of filtered items based on pagination tableOptions event updates.
    },

    data: function() {
	return {

	}
    },

    computed: {
	//proper way.
	selectedLocal: {
	    get: function() {
		return this.selected;
	    },
	    set: function(value) {
		this.$emit('update:selected',value);
	    }
	},
	anySelected: function() {
	    return this.selectedLocal.length>0;
	},
    },

    methods: {
	selectNone: function() {
	    this.selectedLocal = [];
	},
	selectVisible: function() {
	    let pageItems = [...new Set([...this.selected, ...this.visibleitems])];
	    this.selectedLocal = pageItems;
	},
	selectAll: function() {
	    this.selectedLocal = this.items;
	},
	selectInvert: function() {
	    if (this.selected.length == this.items.length) this.selectNone();
	    else if (this.selected.length==0) this.selectAll();
	    else {
		let newSel = this.items.filter(x => !this.selected.includes(x));
		this.selectedLocal = newSel;
	    }
	},

    },
    
    watch: {
	//selectedLocal(val,oldval) {
	//    console.log('SELECT-MENU:',val);
	//},
    },

    template: `
    <v-menu
      open-on-click
      density="compact"
      >
      <template v-slot:activator="{ props: menu}">
	<v-btn stacked density="compact" variant="flat" v-bind="menu" style="min-width:0">
	  <template v-slot:prepend>
	    <v-badge v-model="anySelected" :content="selectedLocal.length" floating color="success">
	      <v-icon v-if="selected.length==0">mdi-checkbox-multiple-blank-outline</v-icon>
	      <v-icon v-if="selected.length>0">mdi-checkbox-multiple-marked-outline</v-icon>
	    </v-badge>
	  </template>
	  
	</v-btn>
      </template>
      
      <v-list density="compact">
	
	&nbsp;<strong>Select</strong>
	
	<v-list-item link @click="selectNone" density="compact">
	  <v-list-item-title density="compact">None (Clear)</v-list-item-title>
	</v-list-item>

	<!--vuetify3 no longer has @current-items event
	<v-list-item link @click="selectVisible">
	  <v-list-item-title>This Page Only ({{visibleitems.length}})</v-list-item-title>
	</v-list-item>
	-->
	
	<v-list-item link @click="selectAll" density="compact">
	  <v-list-item-title density="compact">All Items ({{items.length}})</v-list-item-title>
	</v-list-item>
	<v-list-item link @click="selectInvert" density="compact">
	  <v-list-item-title density="compact">Invert Selected ({{items.length-selectedLocal.length}})</v-list-item-title>
	</v-list-item>
      </v-list>
    </v-menu>

    `,
}
