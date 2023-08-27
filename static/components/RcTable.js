import {ref,reactive} from 'vue'

import {RcTableToolbar} from './RcTableToolbar.js'
import {RcSelectMenu} from './RcSelectMenu.js'
import {RcColumnFilter} from './RcColumnFilter.js'

export const RcTable = {
    components: {
	RcTableToolbar,
	RcSelectMenu,
	RcColumnFilter,
    },
    props:  {
	allitems: null,
	filtereditems: null,
	
	uniquekey: {type:String, default: 'id'}, //default is already id for item-value.....
	//items: {type: Object, default(rawProps) {return null}},

	//Header props
	allheaders: null,
	visibleheadernames:  {type: Object, default(rawProps) {return []}},

	//TOOLBAR PASSTHROUGH PROPS using localSearch.
	search: {type:String, default:''},
	selected: {type:Object, default(rawProps) {return []}},
	
	title: {type:String, default:'Title'},
	exportFileName: {type:String, default: 'happy-export-file'}, //export-file-name
	reloadtext: {type: String, default: 'Reload Items'},

	rowfiltersfunc: null,
	loadfunc: null,
	selectedrowfilterkeys: {type:Object, default(rawProps) {return []}}, //v-model: 2 way
	selectedcolumnfilters: {type:Object, default(rawProps) {return []}}, //.sync array of filterAction objects.

    },
    setup(props,ctx) {
	//const dataItems = ref(props.items);

	return {
	    //dataItems,
	    
	}
    },
    data() {
	
	return {
	    itemsPerPage: 5,
	    expanded: [],
	    localPage: 1,
	    colorizerows: true,

	    //vuetify 2 this used to capture currently visible items on the page (a subset of filteredItems actually being displayed)
	    //currentlyVisibleItems: [],
	    //Now, tableOptions is updated with pagination changes and we have a computed currentlyVisibleItems()
	    tableOptions: null,
	}
    },
    computed: {

	currentlyVisibleItems() {
	    return [];
	    /*
	    this.filtereditems;
	    this.tableOptions;
	    if (this.tableOptions) {
		let offset = (this.tableOptions.page-1)>=0?((this.tableOptions.page-1)*this.tableOptions.itemsPerPage):0;
		let endOffset = offset+this.tableOptions.itemsPerPage;
		let sof = this.filtereditems.slice(offset,endOffset);
		//console.log('SOF:',sof);
		return sof;

	    } else return [];	    
	    */
	},
	
	//Very odd problem....somehow, visibleHeaders is also dealing with special headers 'data-table-expand' and 'data-table-select'
	//For duplicating slots to pass through from parent, we must not override the item slot of these two
	//So here is a special header list that does not include data-table-expanded and data-table-select headers...
	/* Dont think this is necsssary for VUE3...see PASSTHROUGH slots in template*/
	nonSpecialVisibleHeaders() {
	    return this.visibleHeaders.filter((vh) => {return ((vh.key != 'data-table-expand')&&(vh.key != 'data-table-select'))});
	},
	
	visibleHeaders() {
	    let vhs = this.allheaders().filter((ah) => {
		if (ah.required) return true;
		return this.visibleheadernames.includes(ah.title);
	    });
	    /* VUE2.6 PASSTHROUGH FIX no longer needed
	    //Note we do this because we are already in a string template and so can not use the v-slot:[`evalstring`] form
	    */
	    vhs.forEach((vh)=>{
		//2->3 changed to column vh.header_slot_name='header.'+vh.key;
		vh.header_slot_name='column.'+vh.key;
		vh.item_slot_name='item.'+vh.key;
		//console.log(vh.header_slot_name);
	    });
	    
	    return vhs;
	},


	
	visibleHeaderNamesLocal: {
	    get: function() {
		return this.visibleheadernames;
	    },
	    set: function(value) {
		this.$emit('update:visibleheadernames',value);		
	    }
	},
	selectedLocal: {
	    get: function() {
		return this.selected;
	    },
	    set: function(value) {
		this.$emit('update:selected',value);
	    }
	},
	searchLocal: {
	    get: function() {
		return this.search;
	    },
	    set: function(value) {
		this.$emit('update:search',value);		
	    }
	},
	selectedColumnFiltersLocal: {
	    get: function() {
		return this.selectedcolumnfilters;
	    },
	    set: function(value) {
		this.$emit('update:selectedcolumnfilters',value);		
	    }
	},

	selectedRowFilterKeysLocal: {
	    //This computed (from prop selectedrowfilters) directly affects filtereditems.
	    //If a row filter is selected from the ux dropdown in osa-table-toolbar then the set is called.
	    //When set is called, an event is emitted and in the parent computed filteredItems uses the
	    //filter function....why there and not here since they were passed in???
	    get: function() {
		return this.selectedrowfilterkeys;
	    },
	    set: function(value) {
		this.$emit('update:selectedrowfilterkeys',value);		
	    }
	},

	
    },
    methods: {
	wank() {
	    console.log('WANKER');
	},
	//In vuetify2 this would have 
	//Captured the @current-items event from the table.
	//This in turn is used to allow the RcSelecctMenu to be able to select items on "This Page".
	//This works better here than as an nextTick.on function inside osa-select-menu.
	//curItems: function(items) {
	//    console.log('curItems called:',items);
	//    this.currentlyVisibleItems = items;
	//    SEE computed currentlyVisibleItems
	//},
	optionsUpdate: function(evt) {
	    //This called each time pagination changes.
	    console.log('optionsUpdate:',evt);
	    this.tableOptions = evt;	    
	},
	//return null, 'asc', 'desc' for a column key
	columnSortedBy: function(keyname) {
	    let foundOrder = null;
	    if ((this.tableOptions)&&(this.tableOptions.sortBy)&&(this.tableOptions.sortBy.length>0)) {
		this.tableOptions.sortBy.forEach((sb) => {
		    if (sb.key == keyname) foundOrder = sb.order;
		});
	    }
	    return foundOrder;	    
	},
	isAscSort: function(keyname) {
	    //console.log('columnSortedBy:',this.columnSortedBy(keyname));
	    if (this.columnSortedBy(keyname) == 'asc') return true;
	    return false;
	},
	isDescSort: function(keyname) {
	    if (this.columnSortedBy(keyname) == 'desc') return true;
	    return false;
	},
	wankerTooltip: function(head) {
	    //return head.tooltip;
	    
	    if ((head.tooltip)&&(head.tooltip.length>0)) {
		return head.tooltip;
	    } else {
		let curSortOrder = null;
		if (this.tableOptions) {
		    if (this.tableOptions.sortBy) {
			if (this.tableOptions.sortBy.length>0) {
			    curSortOrder = this.tableOptions.sortBy[0].order;
			    //WONT WORK FOR MULTI SORT
			}
		    }
		}
		let nextSortOrder = (curSortOrder==='asc')?'sort descending':(curSortOrder==='desc')?'unsort':'sort ascending';
		//INFINITE LOOP???????let foundOrder = this.columnSortedBy(bhead.key); nextTick????
		//console.log('ZING:',curSortOrder);
		//let dog = 'wtf'; //this.tableOptions.sortBy[0].order;
		//console.log('dog:',dog);
		//if (isAscSort(head.key)) return 'click to sort descending';
		//if (isDescSort(head.key)) return 'click to unsort';
		return nextSortOrder;

	    }	   
	},
	/* Vuetify 3 does not support :item-class property on v-data-table yet so hide for now
	rowColor: function(row) {
	    console.log('rowColor:',row);
	    if ((this.hasOwnProperty('colorizerows'))&&(this.colorizerows==false)) return [];
	    classes = [];
	    
	    let filterKeys = Object.keys(this.rowfiltersfunc(this)).sort();
	    //let filterKeys = Object.keys(this.rowFilters(this)).filter((fkn)=> {return (fkn != '_ctx')});
	    //console.log('filterKeys:',filterKeys);

	    for (let ndx=0;ndx<filterKeys.length;ndx++) {
		let fk = filterKeys[ndx];
		if (fk!='_ctx') {
		    let fo = this.rowfiltersfunc(this)[fk];
		    if (fo) {
			if (_.isFunction(fo)) {
			    //    if (fk=='ClosedWithBalance') {
			    //	if (fo(row)) classes.push('error');
			    //    }
			} else {
			    if (fo.color) {
				if (fo.func(row)) {
				    classes.push(fo.color);
				    break;
				}
			    }
			}
		    }
		}
	    }
	    return classes.join(' ');	    
	},
	*/
	
    },
    watch: {
	//filtereditems: function(v,p) {
	//    let varr = v.map((i)=>i.id);
	//    let parr = p.map((i)=>i.id);
	//    console.log(parr,' => ',varr);
	//},
    },
    template: `

       <v-card>
	  <v-card-title>

	    <rc-table-toolbar
	      v-model:search="searchLocal"

	      :title="title"
              
	      :export-file-name="exportFileName"
	      :export-data="filtereditems"
	      
	      :allheaders="allheaders"
	      v-model:visibleheaders="visibleHeaderNamesLocal"

	      :loadfunc="loadfunc"
	      :reloadtext="reloadtext"	      
	      :rowfiltersfunc="rowfiltersfunc"

	      v-model:rowfiltersselected="selectedRowFilterKeysLocal"
	      v-model:colorize="colorizerows" 
	      
	      v-model:page="localPage"
	      v-model:items-per-page.sync="itemsPerPage"
	      >
	      
	      <template v-slot:toolbar-buttons>
		<slot name="toolbar-buttons">

		  
		</slot>		
		<v-spacer></v-spacer>
		
	      </template>

	      
	    </rc-table-toolbar>
	    
	  </v-card-title>

	  <!-- note absence of :search="search". We want the text search filter to run in method searchFilterReduce -->
	  <v-data-table

	    :items="filtereditems"
	    :headers="visibleHeaders"
	    
	    :item-value="uniquekey"
	    
	    v-model:items-per-page="itemsPerPage"
	    v-model:expanded="expanded"
	    
	    class="elevation-1"
	    
	    dense
	    show-expand
	    
	    show-select
	    v-model="selectedLocal"
	    return-object

	    @update:options="optionsUpdate($event)"
	    >
	    <!--
		Vuetify 3 things that dont work now.
		:item-class="rowColor"	    
		@current-items="curItems"
		See 	    @update:options="curItems($event)"
	    -->
	    

	    <!-- COLUMN FILTERS -->
	    <!--
	    <template v-for="bhead in visibleHeaders.filter((h) => (h.hasOwnProperty('columnfilter')) )" v-slot:[bhead.header_slot_name]="{ column }">
	    -->
	    <template v-for="bhead in visibleHeaders" v-slot:[bhead.header_slot_name]="{ column }">

	      <rc-column-filter v-if="column.hasOwnProperty('columnfilter')"
		:header="column"
		:items="allitems"
                :showexclude="column.columnfilter.showexclude"
                :arrayfield="column.columnfilter.arrayfield"
		v-model:selectedcolumnfilters="selectedColumnFiltersLocal"
		:include="column.columnfilter.include"
		>
	      </rc-column-filter>
	      <v-tooltip v-if="bhead.sortable ||(bhead.sortable == undefined)" location="top">
		<template v-slot:activator="{ props: tooltip }">			  
		  <v-chip
		    v-bind="tooltip"
		    class="pa-0"
		    variant="text"
		    style="cursor:pointer!important;"
		    >
		    <template v-slot:append>
		      <v-icon v-show="isAscSort(bhead.key)">mdi-chevron-up</v-icon>
		      <v-icon v-show="isDescSort(bhead.key)">mdi-chevron-down</v-icon>
		    </template>
		    <strong>{{ column.title }}</strong>
		  </v-chip>
		</template>
		<div v-html="wankerTooltip(bhead)"></div>
	      </v-tooltip>

	      <v-chip
		v-else
		class="pa-0"
		variant="text"
		style="cursor:pointer!important;"
		>
		<strong>{{ column.title }}</strong>
	      </v-chip>

	      
	    </template>



	    <!-- Expand Item -->
	    <template v-slot:expanded-row="{ columns, item }">
	      <td :colspan="columns.length">
		<v-card>
		  <div class="block-content" style="background:cyan;">
		    <!--change item.raw to just item to see the meta info on each row-->
		    <pre style="white-space: pre-wrap;">{{JSON.stringify(item,null,2)}}</pre>
		  </div>
		</v-card>
	      </td>
	    </template>
	    
	    <!--VUE3 version of PASSTHROUGH slots. e.g. item.<key> as defined in parent will get passed through to v-data-table 
		But this does not bring the header into the equation.
		<template v-for="(_, slot) of $slots" v-slot:[slot]="scope">
		  <slot :name="slot" v-bind="scope">
		  </slot>
		</template>
		These allow the formatter on the column to be used....e.g. formatter=tmb.percentStr
	     -->
	     <template v-for="chead in visibleHeaders.filter((hx) => hx.hasOwnProperty('formatter'))" v-slot:[chead.item_slot_name]="scope">
	       <slot :name="chead.item_slot_name" v-bind="scope">
		 {{chead.formatter(scope.item.raw[chead.key],chead)}}
	       </slot>	      
	     </template>
	     <template v-for="dhead in nonSpecialVisibleHeaders.filter((hx) => !hx.hasOwnProperty('formatter'))" v-slot:[dhead.item_slot_name]="scope">
	       <slot :name="dhead.item_slot_name" v-bind="scope">
		 {{scope.item.raw[dhead.key]}}
	       </slot>	      
	     </template>
		

	    <!-- Add Special item selection menu component to replace default selection header actions-->	    
	    <template v-slot:column.data-table-select="{ props: props }">              
	      <rc-select-menu			
		:items="filtereditems"
		v-model:selected="selectedLocal"
		:visibleitems="currentlyVisibleItems"
		>
	      </rc-select-menu>
	    </template>


	    <template v-slot:tfoot>	      
	      <tr>
		<td/>
		<td v-for="visHead in visibleHeaders" align="right" class="pr-4">
		  <b v-if="visHead.hasOwnProperty('totaler')">
		    <strong>
		      {{visHead.totaler(filtereditems,visHead.key)}}
		    </strong>
		  </b>
		</td>
	      </tr>	      
	    </template>

	  </v-data-table>

	  
       </v-card>

`,
    
}
