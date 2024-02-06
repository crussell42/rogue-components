import {ref,reactive, mergeProps} from 'vue'

export const RcColumnFilter = {

    // General purpose filter component.
    // This component relies on the parent to do the actual filtering. See parent.filterItems()
    // and relies on a href.
    //
    // PROPS
    // .header provides the .value which represents the fieldname that will be used to get
    // the data values to filter on, the .text and other goodies that come with a v-data-table header.
    // 
    // .includeLabel...text to display on the filter card for unique items to include (OR'd together)
    // .excludeLabel...text to display on the filter card for unique items to exclude (AND'd together)
    // .showexclude....boolean of show the exclude option or not.
    //
    // .items...This is the filtered list of items in the table. (NOT NECESSARILY THE ENTIRE LIST)
    //          Generally this is a computed property in the parent.
    //          This computedFilteredItems method is where actual filtering of items takes place (even
    //          though that method calls this.rowFilter(row) in this component.
    //
    // .anycolumnfiltersselected...Number that gets incremented anytime a filter in here gets added or removed. (A TRIGGER)
    //                             for the parent to re-run the filteredItems() computed value.
    //                             In parent: 	:anycolumnfiltersselected.sync="anyColumnFiltersSelected"
    //                             Then in filteredItems() computed property, just add this.anyColumnFoltersSelected;
    //                             So now when this number changes the computed filteredItems() runs.
    //
    // .forceinclude...Sets initial values
    //
    // .stringarrayfield or .arrayfield booleans tells us what type of .values we are dealing with.
    // either as string or actual array e.g. "tag1, tag2, tag3" or ["tag1","tag2","tag3"] type field.
    // with neither, it is assumed the .value will be a single primitive value. "dog" or 42.
    //
    // VERIFIED PROPS OF columnfilter: {
    //     dataType: 'string','date' <--currently only date or string. arrays use arrayfield or stringarrayfield 
    //     arrayfield: true,         <-e.g. a tags array gets split and filter looks for includes ['x','y','z']
    //     stringarrayfield: true,   <- e.g. ('x,y,z')
    //
    //     showexclude: default true,<- AND exclude values.
    //     showinclude: default true,<- OR include value	
    //     forceinclude: ['x','y'],  <- FORCE initial set value and makes sure it adds it to the initial selection list even if none have it.
    //
    //    ranges: [                  <- only for dataType: 'date' currently...should do for values also.
    //      {name: '1..30 Days',range: tmb.thirtyRange(1)},
    //      {name: '31..60 Days',range: tmb.thirtyRange(2)},
    //      {name: '61..90 Days',range: tmb.thirtyRange(3)},
    //      {name: 'Over 90 Days',range: tmb.thirtyRange(3)},
    //    ],
    //
    //    tooltip
    // }
    // 
    // POSSIBLE/TODO PROPS NOT YET IMPLEMENTED.
    //    ?name: 'Vendr/Consigner'       optional, default 'variableName Filter'
    //    ?filterType: 'unique-value-filter',  optional, default 'unique-value-filter'
    //    ?availableitems: null,         optional, default unique values for this column from ALL elements (not just filtered)
    //    ?dataType: 'string','tags','tags-array', etc... optional, default 'string'. 
    //    ?filterfunc: null,             optional, filter function to call if one of the values from the list is selected
    //    ?forceexclude: ['a','b'],

    props: {
	header: null,
	includelabel: {type: String, default: null},
	excludelabel: {type: String, default: null},

	items: null,

	include: {type: Array, default: function() {return []}},
	exclude: {type: Array, default: function() {return []}},

	stringarrayfield: {type: Boolean, defaut: false},
	arrayfield: {type: Boolean, defaut: false},
	showexclude: {type: Boolean, default: true},
	
	anycolumnfiltersselected: {type: Number, default: 0}, //.sync int force re-filter from parent.

	selectedcolumnfilters: {type: Array, default: ()=>{return []}}, //.sync columnfilter objects {columnname: (from header.value), value:selectedValue,exclude:boolean,

	tooltip: {type: String, default: 'Click for Column Filter'},
    },

    setup(props,ctx) {
	const selectedNames = ref(props.include);
	const removedNames = ref(props.exclude);
	return {
	    selectedNames,
	    removedNames,
	}
    },

    
    data: function() {
	return {
	    showmenu: false,
	    
	    //selectedNames: Vue.util.extend([],this.include),
	    //removedNames: Vue.util.extend([],this.exclude),

	    fixedUniqueNames: [],
	    NO_TAGS_LABEL: '*Empty*',
	}
    },
    computed: {
	showExcludeLocal() {
	    //console.log('column filter showexclude ['+this.header.columnfilter.showexclude+']');
	    if ((this.header.columnfilter)&&(this.header.columnfilter.showexclude==false)) {
		//console.log('WANKER DOODLE DOG');
		return false;
	    }
	    return this.showexclude;
	},
	
	selectedColumnFiltersLocal: {
	    get: function() {
		return this.selectedcolumnfilters;
	    },
	    set: function(value) {
		//let cfaIndex = this.selectedColumnFiltersLocal.findIndex((cfa) => {return cfa.cname == this.header.value});
		//if (cfaIndex>=0) this.selectedColumnFiltersLocal.splice(cfaIndex,1);
		//Remove empty ones before emitting
		this.$emit('update:selectedcolumnfilters',value);
	    }
	},

	includeLabel() {
	    if (this.includelabel) return this.includelabel;
	    return 'Only Show These '+this.header.title;
	},
	excludeLabel() {
	    if (this.excludelabel) return this.excludelabel;
	    return "Don't Show These "+this.header.title;
	},
	filterActive() {
	    return ( ((this.selectedNames) && (this.selectedNames.length>0)) || ((this.removedNames)&&(this.removedNames.length>0)) );
	},

	uniqueNames() {
	    let valDataType = 'string';
	    if (this.header.columnfilter.hasOwnProperty('dataType')) {
		valDataType = this.header.columnfilter.dataType; 
	    }
	    let ans = [];
	    // ONLY WANT TO CALL THIS WHEN FULL DATA SET HAS BEEN CHANGED AND BEFORE ANY FILTERS APPLIED.
	    // WATCH OUT FOR [Vue warn]: You may have an infinite update loop in a component render function.
	    // Only reactive value that should mater is this.items
	    // stringarrayfield and arrayfield are just props.
	    if (valDataType == 'string') {
		if (this.stringarrayfield) {
		    //MULTI VALUE STRING
		    this.items.forEach((itm) => {
			let tarr = [];
			let itmVal = itm[this.header.key];
			if ((!itmVal)||(itmVal.trim().length==0)) {
			    tarr.push(this.NO_TAGS_LABEL);
			} else tarr = itmVal.split(',');
			tarr = tarr.map(function(t) {return tmb.nub(t);});
			if ((tarr)&&(tarr.length>0)) ans = [...new Set([...ans, ...tarr])];
			//console.log('TARR:',ans);
		    });
		} else if (this.arrayfield) {
		    //MULTI VALUE ARRAY
		    this.items.forEach((itm) => {
			let tarr = itm[this.header.key];
			//console.log('TARR',tarr);
			if ((tarr)&&(tarr.length>0)) {
			    //tarr = tarr.map(function(t) {return tmb.nub(t);});
			    ans = [...new Set([...ans, ...tarr])];
			}
		    });
		} else {
		    //SINGLE VALUE STRING.
		    //console.log('PATH:'+this.header.value);
		    //ans = [...new Set(this.items.map(item => item[this.header.value]))]; <-Does NOT work for nested path.gotta lodashit
		    
		    ans = [...new Set(this.items.map(item => _.get(item,this.header.key))) ];
		}
		
		ans = [...ans];
		ans.sort((a,b) => { return this.mySort(a,b); });
		//console.log('uniqueNames items.length:'+this.items.length,' ANS:',ans);

	    } else if (valDataType == 'date') {
		ans = this.header.columnfilter.ranges.map(x => x.name);
	    }
	    
	    //forceinclude values from columnfilter definition.
	    //todo: handle the other dataTypes this works for unique strings 
	    if ((this.header.columnfilter.forceinclude)&&(this.header.columnfilter.forceinclude.length>0)) {
		ans = [...new Set([...ans,...this.header.columnfilter.forceinclude])];
		this.header.columnfilter.forceinclude.forEach((fiv)=> {
		    if (!this.selectedNames.includes(fiv)) this.selectedNames.push(fiv);
		});
	    }
	    //console.log('uniqueItems for columnfilter:',ans);
	    return ans;
	},

	// Should return a 1 element array or null
	scopedColFilter() {
	    return this.selectedcolumnfilters.filter((scf)=>{return scf.cname === this.header.key});
	},
	columnFilterIncludes() {
	    if ((this.scopedColFilter)&&(this.scopedColFilter.length>0)) return this.scopedColFilter.includeValues;
	    return [];		
	},
	columnFilterExcludes() {
	    if ((this.scopedColFilter)&&(this.scopedColFilter.length>0)) return this.scopedColFilter.excludeValues;
	    return [];
	},

    },
    methods: {
	mergeProps,


	hasSomeFilterValues() {
	    return (this.columnFilterIncludes?.length>0);

	    //return ( ((this.scopedColFilter) && (this.scopedColFilter.length>0)) &&
	    //	     (this.columnFilterIncludes?.length>0) || (this.columnFilterExcludes?.length>0)
	    //	   );
	},

	
	mySort(a,b) {
	    let aa = tmb.nub(''+a);
	    let bb = tmb.nub(''+b);
	    return aa.localeCompare(bb,{'sensitivity':'base'});
	},

	clearFilter() {
	    this.selectedNames=[];
	    this.removedNames=[];
	},

	// ****FilterActions...the main output of this component to be used by PARENT or above to actually do the filtering
	// With composition, I should probably push out to composables but for now just getting my vuetify2 =>3 working.
	// A filter action object contains
	// {
	//     cname: The name of the row field that the parent will be testing.
	//     includeValues: [] of values to include when testing.
	//     excludeValues: [] of value to exclude when testing.
	// }
	// ex. If yoy had these rows
	// {animal: 'Dog'}, {animal: 'Cow'}, {animal: 'Pig'}
	// The FilterAction might look like this if you only wanted rows with animal=='Pig'||'Cow' to show up.
	// filterAction = {cname:'animal', includeValues: ['Pig','Cow'], excludeValues: []}
	// -or if you dont like dogs
	// filterAction = {cname:'animal', includeValues: [], excludeValues: ['Dog']}
	// Lot of the logic below is dedupeing because this is called from a watcher.
	
	dedupAddFilterAction(val,exclude) {


	    let filterAction = {cname:this.header.key};
	    let cfaIndex = this.selectedColumnFiltersLocal.findIndex((cfa) => {return cfa.cname == this.header.key});

	    if (cfaIndex>=0) filterAction = this.selectedColumnFiltersLocal[cfaIndex]; //DeDupe
	    
	    let newIncludeValues = filterAction.includeValues?filterAction.includeValues:[];
	    let newExcludeValues = filterAction.excludeValues?filterAction.excludeValues:[];

	    if (exclude) {
		newExcludeValues = val;
	    } else {
		newIncludeValues = val;
	    }
	    
	    let emptyIncluded = (newIncludeValues.length == 0);
	    let emptyExcluded = (newExcludeValues.length == 0);
	    if (emptyIncluded && emptyExcluded) {
		if (cfaIndex>=0) {
		    //remove it since its all empty
		    //console.log('deleting because empty');
		    this.selectedColumnFiltersLocal.splice(cfaIndex,1);
		}
	    } else {
		//This actually trigers the reactive.
		filterAction.includeValues = newIncludeValues;
		filterAction.excludeValues = newExcludeValues;
		
		if (cfaIndex<0) {
		    this.selectedColumnFiltersLocal.push(filterAction);
		}
	    }
	},
    },
    created() {

    },

    watch: {
	removedNames: async function(val,oldVal) {
	    this.dedupAddFilterAction(val,true);
	},
	selectedNames: async function(val,oldVal) {
	    this.dedupAddFilterAction(val);
	},	
    },
    template: `

	<v-menu
	  v-model="showmenu"
	  :close-on-content-click="false"
	  class="pa-0"
	  >
	  <template v-slot:activator="{ props: menu }">
	    <v-tooltip location="top">
	      <template v-slot:activator="{ props: tooltip }">
		<v-chip
		  v-bind="mergeProps(menu,tooltip)"
		  class="pa-1"
		  variant="text"
		  style="min-width:0"
		  >
		  <template v-slot:append>
		    <v-badge v-model="filterActive" dot overlap color="success">
		      <v-icon>mdi-filter</v-icon>
		    </v-badge>

		  </template>
		</v-chip>
	      </template>

	      {{tooltip}}	

	      <div v-for="selFil in scopedColFilter">
		

		<v-col>
		  <div v-if="selFil.includeValues?.length>0">
		    <b>Include:</b> 
                    <ul>
		      <li v-for="incVal in selFil.includeValues">
			{{incVal}}
		      </li>
		    </ul>
		  </div>
		  
		  <div v-if="selFil.excludeValues?.length>0">
		    <b>Exclude:</b>		      
                    <ul>
		      <li v-for="excVal in selFil.excludeValues">
			{{excVal}}
		      </li>
		    </ul>
		  </div>
		</v-col>
		
	      </div>

	    </v-tooltip>
	  </template>
	  
	  
	  <v-card width="400">
	    <v-list density="compact">	      
	      <v-list-item>
		<v-list-item-action>
		  <v-btn
		    color="primary"
		    size="small"
		    variant="outlined"
		    elevation="3"
		    @click="showmenu = false; clearFilter();"
		    >
		    Clear
		  </v-btn>
		  <v-btn
		    color="secondary"
		    size="small"
		    variant="outlined"
		    elevation="3"
		    @click="showmenu = false;"
		    >
		    Apply
		  </v-btn>
		</v-list-item-action>
	
		<v-list-item-title>{{header.title}} Filter</v-list-item-title>
		
	      </v-list-item>
	    </v-list>
	    
	    <v-divider></v-divider>
	    
	    <v-list>
	      <v-list-item>
		<v-list-item-action>
		  <v-select v-model="selectedNames" :items="uniqueNames" :label="includeLabel" multiple>	
		  </v-select>
		</v-list-item-action>
	      </v-list-item>			  
	    </v-list>
	    
	    <v-list v-show="showExcludeLocal">
	      <v-list-item>
		<v-list-item-action>
		  <v-select v-model="removedNames" :items="uniqueNames" :label="excludeLabel" multiple>	
		  </v-select>
		</v-list-item-action>
	      </v-list-item>			  
	    </v-list>
	    
	    <v-card-actions>
	    </v-card-actions>
	  </v-card>
	</v-menu>

    `,
	    
};
