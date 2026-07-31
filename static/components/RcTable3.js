import {ref,reactive,toValue,computed} from 'vue'
import {useDisplay} from 'vuetify'
import {RcTableToolbar} from './RcTableToolbar.js'
import {RcSelectMenu} from './RcSelectMenu.js'
import {RcColumnFilter3} from './RcColumnFilter3.js'
import {RcPagination3} from './RcPagination3.js'

/*
	pushTableFilter: function(columnKey,includes,excludes) {
	    let filterAction = {
		cname: columnKey,
		includeValues: (includes&&(includes.length>0))?includes:[],
		excludeValues: (excludes&&(excludes.length>0))?excludes:[],
	    };
	    this.selectedColumnFilters.push(filterAction);
	}
*/

//ZZZexport const localHeaders = ref([]);


/* Composable to add a value to a column filters selectedValues in a column filter. 
   This should also cause an reduceColumnFilters in the parent.
   -another way without actualling setting a selected value:
       From the parent, do this to cause a filter to occur without adding the selected value in the v-select component.

	    let filterAction = {
		cname: columnKey,
		includeValues: (includes&&(includes.length>0))?includes:[],
		excludeValues: (excludes&&(excludes.length>0))?excludes:[],
	    };
	    e.g. dogFilterAction = {cname:'fake_crew_name',includeValues: ['Bob'], excludeValues: []}
	    this.selectedColumnFilters.push(dogFilterAction);
*/
export const addColumnFilterValues = (columnName,includeValues,excludeValues) => {
    //console.log('RcTable.addColumnFilterValue:',columnName,' includes:',includes,' excludes:',excludes);
    //console.log('localHeaders:',localHeaders);
    //I did this by creating the localHeaders copy of the headers passed in
    //and use the columnfilter.includes field (which translates into the localSelectedIncludeValues in RcColumnFilter.
    let h = localHeaders.value.find((lh) => {if (lh.key == columnName) return lh;});
    if ((h)&&(h.columnfilter)) {
	//if ((includeValues)&&(includeValues.length>0)) {
	if (includeValues) {
	    if (!h.columnfilter.hasOwnProperty('include')) h.columnfilter.include = [];
	    h.columnfilter.include = includeValues;
	}
	//if ((excludeValues)&&(excludeValues.length>0)) {
	if (excludeValues) {
	    if (!h.columnfilter.hasOwnProperty('exclude')) h.columnfilter.exclude = [];
	    h.columnfilter.exclude = excludeValues;
	}
    }
    
}

export const RcTable3 = {
    components: {
	RcTableToolbar,
	RcSelectMenu,
	RcColumnFilter3,
	RcPagination3,
    },
    props:  {
	allitems: null,
	filtereditems: null,
	
	uniquekey: {type:String, default: 'id'}, //default is already id for item-value.....
	//items: {type: Object, default(rawProps) {return null}},

	pageName: {type:String, default: 'someuniquepagenameusedforcontext'},
	
	//Header props
	//allheaders: null,
	allheaders: {type: Object, default(rawProps) {return []}},
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

	colorizerows: {type:Boolean, default: false},

	itemsPerPage: {type: Number, default: 100},
	page: {type: Number, default: 1},
	showSelect: {type: Boolean, default: true},
	showExpand: {type: Boolean, default: false},

	hidetoolbar: {type: Boolean, default: false},
	totalerOffset: {type: Number, default: 0},
    },
    setup(props,ctx) {
	//const dataItems = ref(props.items);

	function twoWay(name) {
	    if (props.hasOwnProperty(name)) {
		return computed({
		    get: function() {
			return props[name]; //not here || {};
		    },
		    set: function(val) {
			ctx.emit("update:"+name,val);
		    },
		});
	    } else {
		console.log('No Property named:',name);
	    }
	    return null;
	};


	
	const colorizeSetup = ref(props.colorizerows);

	//WINGLEBAT
	//const localItemsPerPage = ref(props.itemsPerPage);
	//const localPage = ref(props.page);
	const localItemsPerPage = twoWay('itemsPerPage');
	const localPage = twoWay('page');
	
	//localHeaders.value = props.allheaders();
	//ZZZlocalHeaders.value = toValue(props.allheaders);
	const localHeaders = twoWay('allheaders');
	

	const { xs,smAndDown } = useDisplay();

	// window.shiftKeyOn should already be set on the window when this loads
	/*
	const keyDownHandler = function ({ key }) {
	    if (key == "Shift") {
		console.log('RcTable.shift ON');
		//shiftKeyOn.value = true;
		window.shiftKeyOn = true;
	    }
	};
	const keyUpHandler = function ({ key }) {
	    if (key == "Shift") {
		console.log('RcTable.shift OFF');
		//shiftKeyOn.value = false;
		window.shiftKeyOn = false;
	    }
	};
	if (typeof window.shiftKeyOn == 'undefined') {
	//if (!window.hasOwnProperty('shiftKeyOn')) {
	    console.log('RcTable adding key handlers');
	    window.addEventListener("keydown", keyDownHandler);
	    window.addEventListener("keyup", keyUpHandler);
	}
	*/
	
	//beforeDestroy() {
	//window.removeEventListener("keydown", this.keyDownHandler);
	//window.removeEventListener("keyup", this.keyUpHandler);


	return {
	    localItemsPerPage,
	    localPage,
	    colorizeSetup,
	    localHeaders,
	    xs,
	    smAndDown,

	}
    },
    data() {	
	return {

	    expanded: [],


	    //vuetify 2 this used to capture currently visible items on the page (a subset of filteredItems actually being displayed)
	    //currentlyVisibleItems: [],
	    //Now, tableOptions is updated with pagination changes and we have a computed currentlyVisibleItems()
	    tableOptions: null,

	    //colorizerows: true,
	    lastSelected: null,
	    currentSelected: null,
	    currentItems: [],
	    
	}
    },
    computed: {

	currentlyVisibleItems() {
	    return [];
	    /*
	    this.filtereditems;
	    this.tableOptions;
	    if (this.tableOptions) {
		let offset = (this.tableOptions.page-1)>=0?((this.tableOptions.page-1)*this.tableOptions.localItemsPerPage):0;
		let endOffset = offset+this.tableOptions.localItemsPerPage;
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
	    return this.visibleHeaders.filter(
		(vh) => {
		    return ((vh.key != 'data-table-expand')&&
			    (vh.key != 'data-table-select')
			   )
		});
	},
	nonSpecialVisibleHeadersWithFormatter() {
	    return this.nonSpecialVisibleHeaders.filter((hx) => { return hx.hasOwnProperty('formatter');});
	},
	nonSpecialVisibleHeadersWithoutFormatter() {
	    return this.nonSpecialVisibleHeaders.filter((hx) => { return ! hx.hasOwnProperty('formatter');});
	},
	
	visibleHeaders() {
	    //let vhs = this.allheaders().filter((ah) => {
	    let vhs = this.localHeaders.filter((ah) => {
		if (ah.required) return true;
		//if (this.visibleheadernames.length==0) return true;
		return this.visibleheadernames.includes(ah.title);
	    });
	    /* VUE2.6 PASSTHROUGH FIX no longer needed
	    //Note we do this because we are already in a string template and so can not use the v-slot:[`evalstring`] form
	    */
	    vhs.forEach((vh)=>{
		//2->3 changed to column vh.header_slot_name='header.'+vh.key
		//??changed back on upgrade to 3.5.2 from 3.3.9????? vh.header_slot_name='column.'+vh.key;
		vh.header_slot_name='header.'+vh.key;
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
		console.log('selectedColumnFiltersLocal EMITTING');
		this.$emit('update:selectedcolumnfilters',value);		
	    }
	},

	selectedRowFilterKeysLocal: {
	    //This computed (from prop selectedrowfilters) directly affects filtereditems.
	    //If a row filter is selected from the ux dropdown in rc-table-toolbar then the set is called.
	    //When set is called, an event is emitted and in the parent computed filteredItems uses the
	    //filter function....why there and not here since they were passed in???
	    get: function() {
		return this.selectedrowfilterkeys;
	    },
	    set: function(value) {
		this.$emit('update:selectedrowfilterkeys',value);		
	    }
	},

	colorizeLocal: {
	    get: function() {
		return this.colorizerows;
	    },
	    set: function(value) {

		this.$emit('update:colorizerows',value);
		//Force rowColor to fire???
		let val=this.selectedrowfilterkeys;
		console.log('colorizeLocal selectedrowfilterkeys: ',val);
	    }
	    
	},
    },
    methods: {
	//currentItems: function(x) {
	//    console.log('DAMN:',x);
	//},
	asIntArr: function(lower,upper,step) {
	    return Array.from({length:((upper-lower)/step)+1},(value,index) => lower + index * step);
	},

	
	bulkSelect: function(a,b,c) {
	    if ((a.length>this.selectedLocal.length)&&(window.shiftKeyOn)) {
		if (!this.currentItems) this.currentItems = this.filtereditems?this.filtereditems:[];
		//console.log('bulkSelect currentItems length:',this.currentItems);
		let visibleItems = this.currentItems.map((ci)=>{return ci.raw});
		let newItem = null;
		let newSel = a.filter(x=> !this.selectedLocal.includes(x));
		if (newSel.length==1) newItem = newSel[0];
		
		if (newItem) {
		    let newItemIndex = visibleItems.findIndex(i=> i==newItem);
		    console.log('shift:',window.shiftKeyOn,' newItemIndex:',newItemIndex);
		    let ndxs = a.map((s)=>{
			return visibleItems.findIndex(i=> i==s);
		    });
		    
		    ndxs.sort();
		    let oldNdxs = ndxs.filter(i=> i!=newItemIndex);//.reduce((acc,(i)=>{if (i<newItemIndex) acc=i;return acc;}),0);
		    let max = oldNdxs.reduce((acc,i)=>{
			if (i>acc) acc=i;			
			return acc
		    },-1);
		    let min = oldNdxs.reduce((acc,i)=>{
			if (i<acc) acc=i;
			return acc
		    },9999999);
		    
		    console.log('ndxs:',ndxs,' oldNdxs:',oldNdxs,'min:',min,' max:',max,' newItemIndex:',newItemIndex);
		    if ((min == 9999999)&&(max==-1)) {
			console.log('ignore');
		    } else {
			let newIndexes = [];
			if ((newItemIndex>min) && (newItemIndex<max)) {
			    console.log('middle ignore');
			} else if ((newItemIndex<min) && (min != 9999999)) {
			    if (min-newItemIndex < 2) console.log('contiguous up ignore');
			    else {
				newIndexes = this.asIntArr(newItemIndex,min,1);
				console.log('UP:',newIndexes);//this.asIntArr(newItemIndex,min,1));
			    }
			} else if ((newItemIndex>max) && (max != -1)) {
			    if (newItemIndex - max < 2) console.log('contiguous down ignore');
			    else {
				newIndexes = this.asIntArr(max,newItemIndex,1);
				console.log('DOWN:',newIndexes);			    
			    }
			}

			if (newIndexes.length>0) {
			    //addIndexes = addIndexes.slice(1,addIndexes.length-1);
			    //console.log('RESULT:',newIndexes);
			    let newSelected = this.selectedLocal;
			    newIndexes.forEach((i)=>{
				newSelected.push(visibleItems[i]);
			    });
			    //note new one would be duplicated so we dedupe it with set
			    this.selectedLocal = [... new Set(newSelected)];
			    
			}
			
		    }

		    
		    //console.log('currentItems:',this.currentItems);
		}		
	    }
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
	    //console.log('optionsUpdate:',evt);
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
	sortTooltip: function(head) {
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
		return nextSortOrder;
	    }	   
	},
	/* Vuetify 3 does not support :item-class property on v-data-table yet so hide for now */
	rowColor: function(row) {
	    //console.log('colorizerows:',this.colorizerows,' rowColor:',row);
	    //if ((this.hasOwnProperty('colorizerows'))&&(this.colorizerows==false)) return [];
	    
	    let classes = [];
	    if (this.colorizeSetup==false) return {class: ''};
	    
	    let filterKeys = Object.keys(this.rowfiltersfunc(this)).sort();
	    //let filterKeys = Object.keys(this.rowFilters(this)).filter((fkn)=> {return (fkn != '_ctx')});
	    //console.log('filterKeys:',filterKeys);

	    for (let ndx=0;ndx<filterKeys.length;ndx++) {
		let fk = filterKeys[ndx];
		if (fk!='_ctx') {
		    let fo = this.rowfiltersfunc(this)[fk];
		    if (fo) {
			if (_.isFunction(fo)) {
			    //if (fk=='ClosedWithBalance') {
			    //	if (fo(row)) classes.push('error');
			    //}
			} else {
			    if (fo.color) {
				
				if (_.isFunction(fo.func)) {
				    //console.log('fo:',fo);
				    //console.log('   revenue.ejs row:',row);
				    //let colorTheRow = fo.func(row);
				    //console.log('      colorTheRow:',colorTheRow);
				    if (fo.func(row.item)) {
					classes.push(fo.color);
					//classes.push(' bg--lighten-2');
					break;
				    }
				} else {
				    console.log('func is not a function');
				}
			    }
			}
		    } else console.log('No fo found for ',fk);
		}
	    }
	    if (classes.length>0) {
		//console.log('ROW CLASSES:',classes);
	    }
	    
	    //works return {class: "dogpoop"}; //text-blue-darken-1"};
	    return {class: classes.join('')};
	    //return {};
	    //return {class: 'bg-blue'};
	},
	
	
    },
    watch: {
	//filtereditems: function(v,p) {
	//    let varr = v.map((i)=>i.id);
	//    let parr = p.map((i)=>i.id);
	//    console.log(parr,' => ',varr);
        //},
	//localPage: function(ov,v) {
	//    console.log('rctable watch ov:',ov,' v:',v);
	//},
	//selectedLocal: function(v,ov) {
	//    console.log('RcTable selectedLocal:',v);
	//},
    },
    template: `

       <v-card>
	  <v-card-title class="no-print">

	    <rc-table-toolbar
	      
	      v-if="!hidetoolbar"
	      
	      v-model:search="searchLocal"

	      :title="title"
              
	      :export-file-name="exportFileName"
	      :export-data="filtereditems"
	      
	      :allheaders="localHeaders"
	      v-model:visibleheaders="visibleHeaderNamesLocal"

	      :loadfunc="loadfunc"
	      :reloadtext="reloadtext"	      
	      :rowfiltersfunc="rowfiltersfunc"

	      v-model:rowfiltersselected="selectedRowFilterKeysLocal"
	      v-model:colorize="colorizeSetup" 
	      
	      v-model:page="localPage"
	      v-model:items-per-page="localItemsPerPage"

              :page-name="pageName"

	      >
	      
	      <template v-slot:toolbar-buttons>
		<slot name="toolbar-buttons">

		  
		</slot>				
	      </template>

	      
	    </rc-table-toolbar>
	    
	  </v-card-title>

	  <!-- note absence of :search="search". We want the text search filter to run in method searchFilterReduce (RcTableMixins) -->
	  <!-- :show-select="!xs" :disable-sort="xs" -->
	  <!-- show-expand -->
	  <v-data-table

	    :items="filtereditems"
	    :headers="visibleHeaders"
	    
	    :item-value="uniquekey"
	    
	    v-model:items-per-page="localItemsPerPage"
	    v-model:page="localPage"

	    v-model:expanded="expanded"

	    v-bind="$attrs"
	    
	    class="elevation-1"
	    
	    dense

	    :show-expand="showExpand"
	    :show-select="showSelect"
	    
	    v-model="selectedLocal"
	    return-object

	    @update:options="optionsUpdate($event)"
        
	    @update:modelValue="bulkSelect"
	    @update:current-items="currentItems = $event"

            :row-props="rowColor"

	    :mobile="xs"

	    >
	    <!-- PASSTHROUGH SLOTS -->
	    <!-- THIS CAUSES MASSIVE DELAY BETWEEN TABS
	    <template v-for="(_, name) in $slots" v-slot:[name]="slotData">
              <slot :name="name" v-bind="slotData" />
	    </template>
	    -->

	    <template v-slot:header.data-table-group>
	    </template>

	    <template v-slot:group-header="{ item, columns, toggleGroup, isGroupOpen }">
	      <slot name="group-header" v-bind="{ item, columns, toggleGroup, isGroupOpen }">	    
	      </slot>
	    </template>
	    
	    <!-- COLUMN FILTERS -->
	    <!--
	    <template v-for="bhead in visibleHeaders.filter((h) => (h.hasOwnProperty('columnfilter')) )" v-slot:[bhead.header_slot_name]="{ column }">
	    -->


	    <template v-for="bhead in visibleHeaders" v-slot:[bhead.header_slot_name]="{ column }">

	      <rc-column-filter3 v-if="column.hasOwnProperty('columnfilter')"
		:header="column"
		:items="allitems"
                :showexclude="column.columnfilter.showexclude"
                :arrayfield="column.columnfilter.arrayfield"
                :stringarrayfield="column.columnfilter.stringarrayfield"

		:selectedcolumnfilters="selectedColumnFiltersLocal"
		v-model:include="column.columnfilter.include"
		v-model:exclude="column.columnfilter.exclude"
		>
	      </rc-column-filter3>

	      <v-tooltip v-if="bhead.sortable ||(bhead.sortable == undefined)" location="top">
		<template v-slot:activator="{ props: tooltip }">
		  <!--class="pa-0" -->
		  <v-chip
		    v-bind="tooltip"		    
		    variant="text"
		    style="cursor:pointer!important;"
		    :class="'pa-0'+((column.title == 'Actions')?' no-print':'')"
		    >
		    <template v-slot:append>
		      <v-icon v-show="isAscSort(bhead.key)">mdi-chevron-up</v-icon>
		      <v-icon v-show="isDescSort(bhead.key)">mdi-chevron-down</v-icon>
		    </template>
		    <strong>{{ column.title }}</strong>
		  </v-chip>
		</template>
		<div v-html="sortTooltip(bhead)"></div>
	      </v-tooltip>

	      <v-chip
		v-else
		:class="'pa-0'+((column.title == 'Actions')?' no-print':'')"
		variant="text"
		style="cursor:pointer!important;"
		>
		<strong>{{ column.title }}</strong>
	      </v-chip>
	      
	    </template>

	    <template v-slot:expanded-row="{ columns, item }">
	      <td :colspan="columns.length">
		<v-card>
		  <div class="block-content" style="background:cyan;">
		    <pre style="white-space: pre-wrap;">{{JSON.stringify(item,null,2)}}</pre>
		  </div>
		</v-card>
	      </td>
	    </template>
	    
	    <template v-for="dhead in nonSpecialVisibleHeadersWithoutFormatter" v-slot:[dhead.item_slot_name]="scope">
	      <slot :name="dhead.item_slot_name" v-bind="scope">
		{{scope.value?scope.value:scope.item[dhead.key]}}
	      </slot>
	    </template>

	    <template v-for="chead in nonSpecialVisibleHeadersWithFormatter" v-slot:[chead.item_slot_name]="scope">
	      <slot :name="chead.item_slot_name" v-bind="scope">
		{{scope.value?chead.formatter(scope.value,chead,scope.item):chead.formatter(scope.item[chead.key],chead,scope.item)}}		 
	      </slot>	       	       
	    </template>

	    <template v-slot:header.data-table-select="{ props: props }">              
	      <rc-select-menu			
		:items="filtereditems"
		v-model:selected="selectedLocal"
		:visibleitems="currentlyVisibleItems"
		>
	      </rc-select-menu>
	    </template>

	    <template v-slot:tfoot="{ items }">	      
	      <tfoot style="background-color:#9c27b0;color:white;opacity:1 !important;position:sticky;bottom:0;">
		<tr>
		  <td v-for="n in totalerOffset"></td>
		  <!--<td v-if="showSelect"></td>-->

		  <td v-for="visHead in visibleHeaders" align="right" class="pr-4 grey--text">
		    <b v-if="visHead.hasOwnProperty('totaler')">
		      <v-divider></v-divider>
		      <strong>
			{{visHead.totaler(filtereditems,visHead.key)}}
		      </strong>
		    </b>
		  </td>
		</tr>
	      </tfoot>
	    </template>


	    <template v-slot:bottom>              
	      <span v-if="hidetoolbar && (itemsPerPage > -1)">
		<v-spacer></v-spacer>
		<div>
		</div>
	      </span>
              
	    </template>

	  </v-data-table>

	  
       </v-card>

`,
    
}
