import {ref, reactive, mergeProps,toValue} from 'vue'
import {useDisplay} from 'vuetify'

import {RcPagination} from './RcPagination.js'
import JsonExcel from 'vue-json-excel3'

const downloadExcel = JsonExcel;

export const RcTableToolbar = {
    components: {
	JsonExcel,
	RcPagination,
    },
    setup(props,context) {
	const childVisibleHeaders = ref(props.visibleheaders);
	const selectedrowfilternames = ref(props.rowfiltersselected);

	const { xs,smAndDown } = useDisplay();

	//const localPage = ref(props.page);
	//const localItemsPerPage = ref(props.itemsPerPage);
	return {
	    childVisibleHeaders,
	    selectedrowfilternames,

	    //localPage,
	    //localItemsPerPage,
	    xs,smAndDown,
	}
    },
    props: {
	search: {type: String, default: ''},

	pageName: {type: String, default: ''},
	title: {type: String, default: ''},
	exportFileName: {type: String, default: ''},
	exportData: null,
	allheaders: null,
	visibleheaders: null,
	rowfiltersfunc: null,
	rowfiltersselected: {type: Object, default(rawProps) {return []}},
	colorize: {type: Boolean, default: null},
	
	processfunc: null,
	processtext: {type: String, default: 'Process Selected Items'},
	reloadtext: {type: String, default: 'Reload Items'},
	zerofunc: null,
	loadfunc:  null,

	page: {type:Number, default: 1},
	itemsPerPage: {type:Number, default: 100},

    },
    data: function() {
	return {
	    toolbarSearchText: '',

	    columnmenu: false,
	    //childVisibleHeaders: Vue.util.extend([], this.visibleheaders),

	    exportmenu: false,
	    exportHiddenColumns: false,
	    childExportRadioGroup: 'csv',
	    childExportFileName: this.exportFileName,

	    filtermenu: false,

	    columnNameSortState: 0, //0-unsorted, 1-sorted ascending, -1-sort decending
            //selectedrowfilternames: Vue.util.extend([],this.rowfiltersselected),
	    //Ok, this pulls it through once but does not seem to be bound to the data version.
	    //This the "2-way" contract does not seem to be complete unless we put a watcher on the prop and
	    //manually propagate the value from the prop to the data.
	    //selectedrowfilternames: [],
	    //rowfiltersselected: [],
	    colorizeswitch: this.colorize,
	}
    },
    computed: {

	searchBadgeModel() {
	    return true;
	},


	columnNameSortIcon() {
	    if (this.columnNameSortState == -1) return 'mdi-sort-variant'; //descending
	    else if (this.columnNameSortState == 1) return 'mdi-sort-reverse-variant'; //ascending
	    return 'mdi-sort-variant-off';
	},
	
	//pageCount () {
	//    console.log('pageCount:',Math.ceil(this.exportData.length / this.localItemsPerPage));
        //    return Math.ceil(this.exportData.length / this.localItemsPerPage);
	//},

	localSearch: {
	    get: function() {		
		return this.search;
	    },
	    set: function(value) {
		this.$emit('update:search',value);
	    }	    
	},

	
	localPage: {
	    get: function() {
		//console.log('rc-table-toolbar reading page:',this.page);
		return this.page;
	    },
	    set: function(value) {
		//console.log('rc-table-toolbar emitting update:page:',value);
		this.$emit('update:page',value);
	    }	    
	},

	localItemsPerPage: {
	    get: function() {
		return this.itemsPerPage;
	    },
	    set: function(value) {
		this.$emit('update:itemsPerPage',value);
	    }	    
	},
	//mobileItemsPerPage() {
	//    return 4;
	//},
	
	computedheaders() {
	    console.log('computedheaders isFunction:',_.isFunction(this.allheaders));
	    //if (_.isFunction(this.allheaders)) return this.allheaders();
	    //else return this.allheaders;
	    //else return this.allheaders();
	    //return toValue(this.allheaders);
	    if (typeof(this.allheaders) == 'object') {
		console.log('     using OBJECT form');
		return this.allheaders;
	    } else {
		console.log('     using METHOD form');
		return this.allheaders();
	    }
	},
	
	fullExportFileName() {
	    if ((!this.childExportFileName)||(this.childExportFileName.length==0)) this.childExportFileName = 'export-data';
	    return this.childExportFileName+'.'+this.childExportRadioGroup;
	},

	//Updated to deal with object and function types
	//Also meant to produce option objects for a v-select so use ('title', 'value') not ('name' and 'key' as before)
	availableRowFilterOptions() {
	    let filterOptions = [];
	    if (this.rowfiltersfunc) {		
		let filterKeys = Object.keys(this.rowfiltersfunc());
		filterKeys.forEach((fk) => {
		    let fo = this.rowfiltersfunc()[fk];
		    if (_.isFunction(fo)) {
			filterOptions.push({value: fk, title: fk});			
		    } else {
			filterOptions.push({value: fk, title: fo.name, color: fo.color});
		    }
		    //console.log('availableRowFilterOptions:',filterOptions);
		});
	    }
	    return filterOptions;
	},
	rowFilterActive() {
	    //console.log('ZOP:'+this.selectedrowfilternames);
	    //return false;
	    return ((this.selectedrowfilternames) && (this.selectedrowfilternames.length>0));
	},

	formattedSelectedRowFilters() {
	    let ans = 'None';
	    if ((this.selectedrowfilternames)&&(this.selectedrowfilternames.length>0)) {
		ans = '';
		this.selectedrowfilternames.forEach((rf) => {
		    ans = ans+'</br>'+rf.title+' ';
		    if (rf.color) {
			//ans = ans + '<v-avatar size="20" :color="'+this.fixColorName(rf.color)+'" small></v-avatar>';
			ans = ans + '<v-avatar size="20" color="red" small></v-avatar>';
		    }
		});
	    }
	    return ans;
	},
	
	dataToExport() {
	    if (this.exportHiddenColumns) {
		//Export Hidden columns.
		//return this.exportData;
		let flatArray = [];
		this.exportData.forEach((rowObj) => {
		    flatArray.push(tmb.flattenObject(rowObj,'',{},true,'_'));
		});
		//console.log('flatArray:',JSON.stringify(flatArray));
		return flatArray;
	    } else {
		let ans = [];

		let exportFieldNames = [];
		let exportFieldValues = [];
		this.visibleheaders.forEach((vh) => {
		    let foundHeader = this.computedheaders.find(h => h.title == vh);
		    if (foundHeader) {
			exportFieldValues.push(foundHeader.key); //Actual data path name (e.g. dog.poop.title)
			exportFieldNames.push(foundHeader.title); //Nice Name like (e.g. Title)
		    }
		});
		//console.log('visibleheaders:',this.visibleheaders);
		//console.log('exportFieldValues:',exportFieldValues);
		//console.log('EXPORT DATA:',this.exportData);
		if (this.exportData) {
		    for (let ndx=0;ndx<this.exportData.length;ndx++) {
			let item = this.exportData[ndx];
			let oneRec = {};
			exportFieldValues.forEach((valueName,index) => {
			    //valueName is something like dog.poop.title;
			    //Does not work for nested.
			    //oneRec[valueName] = item[valueName];
			    //ALSO DNW for nested..???eval('item.'+valueName);
			    //let columnName = exportFieldNames[index];
			    //let objPath = valueName;
			    //oneRec[columnName] = _.get(item,objPath,'');
			    //console.log('columnName ['+columnName+'] objPath ['+objPath+'] value ['+_.get(item,objPath,'')+']');
			    //oneRec[valueName] = item[valueName];


			    //WANKER
			    //Columns that have a value: method, we must call the method to get the value

			    let derivedValue = null;
			    let formattedDerivedValue = null;
			    
			    let valuesHeader = this.computedheaders.find(h => h.key == valueName);
			    if (valuesHeader.hasOwnProperty('value')) {
				if (_.isFunction(valuesHeader.value)) {
				    derivedValue = valuesHeader.value(item);
				} else {
				    derivedValue = _.get(item,valueName);
				}			    

			    } else {			    
				//ORIGINAL _.set(oneRec,valueName,_.get(item,valueName,''));
				derivedValue = _.get(item,valueName,'');
			    }

			    //Once derived, a formatter may be run on it as well which produces funky output.
			    //For instance, it might use a unit of measure field in the row to further define how the
			    // output should appear to the user.
			    formattedDerivedValue = derivedValue;
			    if (valuesHeader.hasOwnProperty('formatter')) {
				// params for any formatter (val,header,row)
				if (_.isFunction(valuesHeader.formatter)) {
				    formattedDerivedValue = valuesHeader.formatter(derivedValue,valuesHeader,item);
				} else {
				    //really nothing to do if its not a function...I guess we could use the value of it???
				}
			    }
			    
			    _.set(oneRec,valueName,formattedDerivedValue);
			    
			});
			//console.log('ONE REC:',JSON.stringify(oneRec));
			ans.push(oneRec);
		    }
		}
		//How do we set headers of export???
		//Filtered Data
		return ans;
	    }
	},
	exportHeaderNames() {
	    let exportFields = {}; //{title:key,title:key}
	    if (this.exportHiddenColumns) { //return null; //return all colums in the export...raw
		let columnNames = [];
		this.dataToExport.forEach((row)=>{
		    //console.log(row.referring_physician,' keys:',Object.keys(row));
		    columnNames = [...new Set([...columnNames,...Object.keys(row)]) ];
		});

		columnNames.forEach((cname)=>{
		    exportFields[cname] = cname;
		});
		//console.log('GLOB OH SHIT:',exportFields);
		return exportFields;

	    }	    

	    this.visibleheaders.forEach((vh) => {
		let foundHeader = this.computedheaders.find(h => h.title == vh);
		if (foundHeader) {
		    exportFields[foundHeader.title] = foundHeader.key;
		}
	    });
	    return exportFields;
	}
    },
    methods: {
	mergeProps,


	columnNameSort() {
	    this.columnNameSortState += 1;
	    if (this.columnNameSortState>1) this.columnNameSortState = -1;
	    //console.log('columnNameSortState:',this.columnNameSortState);
	},
	
	exportHL7: async function() {
	    //dataToExport, exportHeaderNames,fullExportFileName
	    this.exportHiddenColumns=true;

	    this.exportData.forEach((r)=>{
		console.log('Export row as HL7:',r); //<-Actual filtered items.raw values....
	    });
	    let [err,res] = await tmb.eitherFetch('/api/referral/as_hl7');
	    if (!err) {
		console.log('asHL7:',res);
	    }

	},
  
	//lank(w) {
	//    console.log('Lank:',w);
	//},
	//cank(w) {
	//    console.log('Cank:',w);
	//},
	fixColorName(cn) {
	    return cn?.replace('bg-','');
	},

								
	updateToolbarSearchText() {
	    console.log('input');
	    this.$emit('input',this.toolbarSearchText);
	},
	allSelectableHeaderNames() {
	    let colNames = this.computedheaders.filter((ah) => {
		return (!ah.required);
	    }).map(fh => fh.title);
	    if (this.columnNameSortState != 0) {
		if (this.columnNameSortState == 1) colNames.sort();
		else if (this.columnNameSortState == -1) colNames.sort().reverse();
	    }
	    return colNames;
            //return this.computedheaders.filter((ah) => {
	    //	return (!ah.required);
	    //}).map(fh => fh.title);
	},
	ctxName(varName) {
	    if ((this.pageName)&&(this.pageName.length>0)) {
		return 'osf_'+this.pageName + '_'+varName;
	    }
	    let pname = window.location.pathname.split('/').pop();
            if (pname) {
		let qname = pname.split('?');
		if (qname.length>0) {
		    qname = qname.shift();
		    return 'osf_'+qname+'_'+varName;
		} else {
		    return 'osf_'+pname+'_'+varName;
		}
	    }
	    return 'osa_'+varName;
	},

	toolbarButtonMenuItems() {
	    return [
		{label: 'View Label', icon: 'mdi-book-alert', click: (chem)=>{}},
		{label: 'View SDS', icon: 'mdi-biohazard', click: (chem)=>{}},
	    ];
	},

    },
    mounted() {
    	//console.log('OSA-TABLE-TOOLBAR loaded:'+JSON.stringify(this.childVisibleHeaders));
	
	if (window.sessionStorage) {
	    if (window.sessionStorage.getItem(this.ctxName('childVisibleHeaders'))) {	    
		this.childVisibleHeaders = JSON.parse(window.sessionStorage.getItem(this.ctxName('childVisibleHeaders')));
	    }
	}

    },
    watch: {

	childVisibleHeaders: async function(val,oldVal) {
	    if (oldVal !== val) {
		this.$emit('update:visibleheaders',this.childVisibleHeaders);

		if (window.sessionStorage) {		    
		    window.sessionStorage.setItem(this.ctxName('childVisibleHeaders'),JSON.stringify(this.childVisibleHeaders));
		}
	    }
	},

	selectedrowfilternames: async function(val,oldVal) {
	    if (oldVal != val) {
		this.$emit('update:rowfiltersselected',val);
	    }
	},

	colorizeswitch: async function(val,oldVal) {
	    if (oldVal != val) {
		this.$emit('update:colorize',val);
	    }
	},

	
	//NOTE: (cant (or shouldnt 2 way bind to prop) cause prop gets re-written when parent re-rendered.)
	// prop.rowfiltersselected is 2 way bound to <=> parent.selectedRowFilters.
	// prop.rowfilterselected is ONE TIME bound to data.selectedrwofilternames (on initialization)
	// so there is a disconnect between the property and the data value. We rectify that here
	// by watching prop.rowfiltersselected.
	// We know that if it changes, the parent is trying to clear the selected filters.
	// THE PARENT actually clears the application of the filters on the table...removes them from the stack.
	// we are just trying to clear out the drop down that allows them to select the row filters to apply to the table.
	// Seems like a dangerous loop.
	// parent click reset filters. changes child property. child watch property changes data from prop. data change the drop down.
	//
	// -or- other way. child clicks filter, changes child data, child watch data causes event emmit, event emit updates
	// parent data with new value. New parent data value clears or changes tables filters applied.
	
	rowfiltersselected: function(val,oldVal) {
	    //Seems like a HACK.
	    if (val !== oldVal) {
		//console.log('PROP CHANGED rowfiltersselected:'+val);
		this.selectedrowfilternames = val; //could really just set to [];
	    }
	},

	//localPage: function(val,oldVal) {
	//    console.log('rc-table-toolbar watch localPage val:',val,' oldVal:',oldVal);
	//},


      
    },
    template: `



      <!-- MOBILE VERSION -->
      <v-toolbar v-if="xs" extended extension-height="100">
	<v-toolbar-title>

	  <slot name="toolbar-buttons">
	    
	  </slot>

	</v-toolbar-title>

	<v-menu>

	  <template v-slot:activator="{ props }">
	    <v-btn fab icon="mdi-dots-vertical" variant="text" v-bind="props" size="small"></v-btn>
	  </template>
	  <!-- class="pl-6" menu offset-y -->
	  <v-card>	  
	  <v-card-text>
	    <v-row>
	      <v-menu
		v-if="rowfiltersfunc!=null"
		v-model="filtermenu"
		:close-on-content-click="false"
		location="start"
		>
		<template v-slot:activator="{ props: menu }">		  
		  <v-tooltip location="bottom">
		    <template v-slot:activator="{ props: tooltip }">
		      
		      <!-- FILTERS BUTTON-->
		      <v-btn
			variant="outlined"
			color="primary"
			elevation="3"
			v-bind="mergeProps(menu,tooltip)"
			>
			<v-badge dot overlap v-model="rowFilterActive" color="success">
			  <v-btn color="primary" icon="mdi-filter" variant="outlined" size="x-small"></v-btn>
			</v-badge>
			
		      </v-btn>
		    </template>
		    
		    <span>
		      Filter items in/out of the list.<br/>
		      <span v-if="(selectedrowfilternames.length>0)">Currently Selected:</span>
		      <ul>
			<li v-for="selFil in selectedrowfilternames">
			  {{selFil.title}} <v-avatar v-if="selFil.color" size="20" :color="fixColorName(selFil.color)" small></v-avatar>
			</li>
		      </ul>
		    </span>
		    
		  </v-tooltip>
		</template>
		
		<v-card width="500">
		  <!-- Content of filter menu dropdown -->
		  <v-list density="compact">		    
		    <v-list-item>
		      <v-list-item-action>
			<v-btn
			  color="primary"
			  density="compact"
			  variant="outlined"
			  elevation="3"		      
			  @click="filtermenu = false; selectedrowfilternames = [];"
			  >
			  Clear
			</v-btn>
			<v-btn
			  color="secondary"
			  density="compact"		  		  
			  variant="outlined"
			  elevation="3"
			  @click="filtermenu = false;"
			  >
			  Apply
			</v-btn>
		      </v-list-item-action>
		      
		      <v-col>
			<v-list-item-title density="compact">Row Filters</v-list-item-title>
			
			<v-switch v-show="colorizeswitch!=null"
				  v-model="colorizeswitch"
				  label="Colorize Rows"
				  color="primary"
				  density="compact"
				  >
			</v-switch>
			
		      </v-col>
		      
		    </v-list-item>
		  </v-list>
		  
		  <v-divider density="compact"></v-divider>
		  
		  
		  <v-container>
		    <v-select v-model="selectedrowfilternames"
			      :items="availableRowFilterOptions"
			      return-object
			      label="Only Show"
			      multiple
			      min-width="600"
			      density="compact"
			      >
		      
		      <!-- THIS WORKS AS EXPECTED....only diff is the v-slot:prepend="{isActive}" part -->
		      <template v-slot:item="{item, props}">
			<v-list-item v-bind="props">		      
			  <template v-slot:prepend="{ isActive }">
			    <v-list-item-action start>
			      <v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
			    </v-list-item-action>
			  </template>
			  <template v-slot:title>
			    {{item.title}}
			  </template>
			  <template v-slot:append>
			    <!--vuetify 3.3.9->3.5.2 changed from item.value to item.raw -->
			    <v-avatar size="20" v-show="item.raw.color" :color="fixColorName(item.raw.color)" small></v-avatar>
			  </template>
			  
			</v-list-item>
		      </template>		  
		    </v-select>
		    
		  </v-container>
		  
		  
		  <v-card-actions>
		  </v-card-actions>
		  
		</v-card>
	      </v-menu>
	    </v-row>
	    
	    <v-row>
	      <v-tooltip location="bottom">
		<template v-slot:activator="{ props: tooltip }">
		  <v-btn
		    v-if="loadfunc!=null"			
		    color="primary"
		    variant="outlined"
		    dark
		    elevation="3"
		    v-bind="tooltip"
		    @click="loadfunc"
		    >
		    <v-icon>mdi-refresh</v-icon>
		  </v-btn>
		</template>
		<span>
		  {{reloadtext}}
		</span>
	      </v-tooltip>
	    </v-row>
	    
	    <v-row>
	      <v-menu
		v-model="columnmenu"
		:close-on-content-click="false"
		offset-y
		>
		<template v-slot:activator="{ props: menu }">
		  
		  <v-tooltip location="bottom">
		    <template v-slot:activator="{ props: tooltip }">
		      <v-btn			
			color="primary"
			variant="outlined"
			dark
			v-bind="mergeProps(menu,tooltip)"
			elevation="3"
			>
	  		<v-icon>mdi-ballot-outline</v-icon>
		      </v-btn>
		    </template>	      
		    <span>
		      Select columns to display
		    </span>
		  </v-tooltip>
		</template>
		<v-card class="mx-auto" max-width="300">
		  
		  <v-list density="compact">
		    <v-list-item>
	      	      <v-list-item-action>		  
			
			<v-btn
			  color="primary"
			  density="compact"		  		  
			  variant="outlined"
			  elevation="3"
			  @click="columnNameSort"
			  >
			  Sort <v-icon>{{columnNameSortIcon}}</v-icon>
			</v-btn>
			
			<v-btn
			  color="secondary"
			  density="compact"		  		  
			  variant="outlined"
			  elevation="3"
			  @click="columnmenu = false;"
			  >
			  Cancel
			</v-btn>
			
		      </v-list-item-action>
		    </v-list-item>
		    <v-list-item>
		      <v-list-item-title density="compact">
			<v-row><v-col>Show Columns</v-col></v-row>
		      </v-list-item-title>
		    </v-list-item>
		    
		    <v-list-item v-for="hname in allSelectableHeaderNames()" :key="hname" color="primary" density="compact">
		      <v-checkbox hide-details class="mx-auto" v-model="childVisibleHeaders" :value="hname" :label="hname" multiple density="compact" color="primary">	
		      </v-checkbox>
		      
		    </v-list-item>
		    
		    <v-list-item>
	      	      <v-list-item-action>		  
			
			<v-btn
			  color="primary"
			  density="compact"		  		  
			  variant="outlined"
			  elevation="3"
			  @click="columnNameSort"
			  >
			  Sort <v-icon>{{columnNameSortIcon}}</v-icon>
			</v-btn>
			
			<v-btn
			  color="secondary"
			  density="compact"		  		  
			  variant="outlined"
			  elevation="3"
			  @click="columnmenu = false;"
			  >
			  Cancel
			</v-btn>
			
		      </v-list-item-action>
		    </v-list-item>
		    
		    
		  </v-list>
		</v-card>
	      </v-menu>
	    </v-row>
	    
	    <v-row>
	      <v-menu
		v-if="exportData"
		v-model="exportmenu"
		:close-on-content-click="false"
		offset-y
		>
		<template v-slot:activator="{ props: menu }">
		  <v-tooltip location="bottom">
 		    <template v-slot:activator="{ props: tooltip }">
		      <v-btn
			dark
			color="primary"
			variant="outlined"
			elevation="3"
			v-bind="mergeProps(menu,tooltip)"
			>
			<v-icon>mdi-file-export-outline</v-icon>		    
		      </v-btn>
		    </template>
		    <span>
		      Export table to Excel or CSV
		    </span>
		  </v-tooltip>
		</template>
		<v-card>
		  <v-card-text>
		    
		    <v-radio-group v-model="childExportRadioGroup">
		      <v-radio
			label="Export CSV"
			value="csv"
			>
		      </v-radio>
		      <v-radio
			label="Export Excel"
			value="xls"
			>			
		      </v-radio>
                      <!--NO
			  <v-radio
			    label="Export HL7"
			    value="hl7"
			    @click="exportHiddenColumns=true"
			    >			
			  </v-radio>
			  -->
		    </v-radio-group>
		    
		    <v-switch
		      v-model="exportHiddenColumns"
		      label="Export All Columns"
		      >
		    </v-switch>
		    
		    <v-text-field
		      v-model="childExportFileName"
		      label="Export File Name"
		      dense
		      >
		    </v-text-field>
		  </v-card-text>
		  <v-card-actions>
		    <v-btn v-if="childExportRadioGroup == 'hl7'"
			   color="primary"
			   variant="outlined"
			   size="small"
			   elevation="3"
			   @click="exportmenu = false;exportHL7()"
			   >
		      Export
		    </v-btn>
		    <json-excel
		      v-else
		      :data="dataToExport"
		      
                      :fields="exportHeaderNames"
		      
		      :type="childExportRadioGroup"
		      :name="fullExportFileName"
		      class="v-btn">
		      <v-btn
			color="primary"
			variant="outlined"
			size="small"
			elevation="3"
			@click="exportmenu = false;"
			>
			Export
		      </v-btn>
		    </json-excel>
		    
		    <v-btn color="secondary"
			   variant="outlined"
			   size="small"
			   elevation="3"
			   @click="exportmenu = false;"
			   >
		      Cancel
		    </v-btn>
		    
		    
		  </v-card-actions>
		  
		</v-card>
	      </v-menu>
	    </v-row>
	  </v-card-text>
	  </v-card>
	</v-menu>

	
	<template v-slot:extension>
	  <v-col>
	    <v-row>
	      <v-col>
		<div class="pt-4 pb-0">
		  <rc-pagination
		    :filtereditems="exportData"
		    v-model:page="localPage"
		    v-model:items-per-page="localItemsPerPage">
		  </rc-pagination>
		</div>
	      </v-col>
	    </v-row>
	    
	    <v-row class="pt-0">
	      <v-col class="pt-0">		
		<v-text-field
		  v-model="localSearch"
		  clearable
		  label="Search"
		  variant="solo"
		  single-line
		  hide-details
		  density="compact"
		  color="primary"
		  class="shrink pt-0"
		  >
		  <template v-slot:append-inner>
 		    <v-badge v-model="searchBadgeModel" :content="exportData.length" floating color="success">
		      
		      <v-icon
			color="primary"
			icon="mdi-magnify"
			/>
		      
		    </v-badge>
		    
		  </template>
		</v-text-field>
	      </v-col>
	    </v-row>
	  </v-col>
	</template>
	
      </v-toolbar>

      <!-- END MOBILE -->



















      
    <v-toolbar

      v-else

      flat      
      dark
      density="compact"
      rounded
      >
      

      <slot name="toolbar-buttons">
	
      </slot>

      

      <v-toolbar-title class="text-subtitle-2">
	{{title}}
      </v-toolbar-title>
      
      <v-text-field
	v-model="localSearch"
	clearable
	label="Search"
	variant="solo"
	single-line
	hide-details
	density="compact"
	color="primary"
	class="shrink"
	>

	<template v-slot:append-inner>
	  <v-icon
	    color="primary"
	    icon="mdi-magnify"
	    />
	</template>

	
      </v-text-field>
      
      
      
      <div class="pl-6">
	<rc-pagination
	  :filtereditems="exportData"
	  v-model:page="localPage"
	  v-model:items-per-page="localItemsPerPage">
	</rc-pagination>
      </div>

      <div class="pl-6">
	<v-menu
          v-if="rowfiltersfunc!=null"
	  v-model="filtermenu"
	  :close-on-content-click="false"
	  offset-y
	  >
	  <template v-slot:activator="{ props: menu }">		  
	    <v-tooltip location="bottom">
	      <template v-slot:activator="{ props: tooltip }">
		
		<!-- FILTERS BUTTON-->
		<v-btn
		  variant="outlined"
		  color="primary"
		  elevation="3"
		  v-bind="mergeProps(menu,tooltip)"
		  >
		  <v-badge dot overlap v-model="rowFilterActive" color="success">
		    <!--
			<v-btn fab size="x-small" color="primary" variant="outlined">
			  <v-icon>mdi-filter-outline</v-icon>
			</v-btn>
			-->
			<v-btn color="primary" icon="mdi-filter" variant="outlined" size="x-small"></v-btn>
		  </v-badge>
		  
		</v-btn>
	      </template>
	      
	      <span>
		Filter items in/out of the list.<br/>
		<span v-if="(selectedrowfilternames.length>0)">Currently Selected:</span>
		<ul>
		  <li v-for="selFil in selectedrowfilternames">
		    {{selFil.title}} <v-avatar v-if="selFil.color" size="20" :color="fixColorName(selFil.color)" small></v-avatar>
		  </li>
		</ul>
	      </span>
	      
	    </v-tooltip>
	  </template>
	  
	  <v-card width="500">
	    <!-- Content of filter menu dropdown -->
	    <v-list density="compact">		    
	      <v-list-item>
		<v-list-item-action>
		  <v-btn
		    color="primary"
		    density="compact"
		    variant="outlined"
		    elevation="3"		      
		    @click="filtermenu = false; selectedrowfilternames = [];"
		    >
		    Clear
		  </v-btn>
		  <v-btn
		    color="secondary"
		    density="compact"		  		  
		    variant="outlined"
		    elevation="3"
		    @click="filtermenu = false;"
		    >
		    Apply
		  </v-btn>
		</v-list-item-action>
		
		<v-col>
		  <v-list-item-title density="compact">Row Filters</v-list-item-title>
		  
		  <v-switch v-show="colorizeswitch!=null"
			    v-model="colorizeswitch"
			    label="Colorize Rows"
			    color="primary"
			    density="compact"
			    >
		  </v-switch>
		  
		</v-col>
		
	      </v-list-item>
	    </v-list>
	    
	    <v-divider density="compact"></v-divider>
	    
	    
	    <v-container>
	      <v-select v-model="selectedrowfilternames"
			:items="availableRowFilterOptions"
			return-object
			label="Only Show"
			multiple
			min-width="600"
			density="compact"
			>
		
		<!-- THIS WORKS AS EXPECTED....only diff is the v-slot:prepend="{isActive}" part -->
		<template v-slot:item="{item, props}">
		  <v-list-item v-bind="props">		      
		    <template v-slot:prepend="{ isActive }">
		      <v-list-item-action start>
			<v-checkbox-btn :model-value="isActive"></v-checkbox-btn>
		      </v-list-item-action>
		    </template>
		    <template v-slot:title>
		      {{item.title}}
		    </template>
	            <template v-slot:append>
		      <!--vuetify 3.3.9->3.5.2 changed from item.value to item.raw -->
		      <v-avatar size="20" v-show="item.raw.color" :color="fixColorName(item.raw.color)" small></v-avatar>
                    </template>
		    
		  </v-list-item>
		</template>		  
	      </v-select>
	      
	    </v-container>
	    
	    
	    <v-card-actions>
	    </v-card-actions>
	    
	  </v-card>
	</v-menu>
      
      
	<v-tooltip location="bottom">
	  <template v-slot:activator="{ props: tooltip }">
	    <v-btn
              v-if="loadfunc!=null"			
	      color="primary"
	      variant="outlined"
	      dark
	      elevation="3"
	      v-bind="tooltip"
	      @click="loadfunc"
	      >
	      <v-icon>mdi-refresh</v-icon>
	    </v-btn>
	  </template>
	  <span>
	    {{reloadtext}}
	  </span>
	</v-tooltip>
	
	
	<v-menu
	  v-model="columnmenu"
	  :close-on-content-click="false"
	  offset-y
	  >
	  <template v-slot:activator="{ props: menu }">
	    
	    <v-tooltip location="bottom">
	      <template v-slot:activator="{ props: tooltip }">
		<v-btn			
		  color="primary"
		  variant="outlined"
		  dark
		  v-bind="mergeProps(menu,tooltip)"
		  elevation="3"
		  >
	  	  <v-icon>mdi-ballot-outline</v-icon>
		</v-btn>
	      </template>	      
	      <span>
		Select columns to display
	      </span>
	    </v-tooltip>
	  </template>
	  <v-card class="mx-auto" max-width="300">

	    <v-list density="compact">
	      <v-list-item>
	      	<v-list-item-action>		  

		  <v-btn
		    color="primary"
		    density="compact"		  		  
		    variant="outlined"
		    elevation="3"
		    @click="columnNameSort"
		    >
		    Sort <v-icon>{{columnNameSortIcon}}</v-icon>
		  </v-btn>

		  <v-btn
		    color="secondary"
		    density="compact"		  		  
		    variant="outlined"
		    elevation="3"
		    @click="columnmenu = false;"
		    >
		    Cancel
		  </v-btn>

		</v-list-item-action>
	      </v-list-item>
	      <v-list-item>
		<v-list-item-title density="compact">
		  <v-row><v-col>Show Columns</v-col></v-row>
		</v-list-item-title>
	      </v-list-item>

	      <v-list-item v-for="hname in allSelectableHeaderNames()" :key="hname" color="primary" density="compact">
		<v-checkbox hide-details class="mx-auto" v-model="childVisibleHeaders" :value="hname" :label="hname" multiple density="compact" color="primary">	
		</v-checkbox>
		
	      </v-list-item>

	      <v-list-item>
	      	<v-list-item-action>		  


		  <v-btn
		    color="primary"
		    density="compact"		  		  
		    variant="outlined"
		    elevation="3"
		    @click="columnNameSort"
		    >
		    Sort <v-icon>{{columnNameSortIcon}}</v-icon>
		  </v-btn>

		  <v-btn
		    color="secondary"
		    density="compact"		  		  
		    variant="outlined"
		    elevation="3"
		    @click="columnmenu = false;"
		    >
		    Cancel
		  </v-btn>

		</v-list-item-action>
	      </v-list-item>

	      
	    </v-list>
	  </v-card>
	</v-menu>
	
      
	<v-menu
          v-if="exportData"
	  v-model="exportmenu"
	  :close-on-content-click="false"
	  offset-y
	  >
	  <template v-slot:activator="{ props: menu }">
	    <v-tooltip location="bottom">
 	      <template v-slot:activator="{ props: tooltip }">
		<v-btn
		  dark
		  color="primary"
		  variant="outlined"
		  elevation="3"
		  v-bind="mergeProps(menu,tooltip)"
		  >
		  <v-icon>mdi-file-export-outline</v-icon>		    
		</v-btn>
	      </template>
	      <span>
		Export table to Excel or CSV
	      </span>
	    </v-tooltip>
	  </template>
	  <v-card>
	    <v-card-text>
	      
	      <v-radio-group v-model="childExportRadioGroup">
		<v-radio
		  label="Export CSV"
		  value="csv"
		  >
		</v-radio>
		<v-radio
		  label="Export Excel"
		  value="xls"
		  >			
		</v-radio>
                <!--NO
		<v-radio
		  label="Export HL7"
		  value="hl7"
		  @click="exportHiddenColumns=true"
		  >			
		</v-radio>
		-->
	      </v-radio-group>
	      
	      <v-switch
		v-model="exportHiddenColumns"
		label="Export All Columns"
		>
	      </v-switch>
	      
	      <v-text-field
		v-model="childExportFileName"
		label="Export File Name"
		dense
		>
	      </v-text-field>
	    </v-card-text>
	    <v-card-actions>
	      <v-btn v-if="childExportRadioGroup == 'hl7'"
		     color="primary"
		     variant="outlined"
		     size="small"
		     elevation="3"
		     @click="exportmenu = false;exportHL7()"
		     >
		Export
	      </v-btn>
	      <json-excel v-else
			  :data="dataToExport"
			  
                          :fields="exportHeaderNames"
			  
			  :type="childExportRadioGroup"
			  :name="fullExportFileName"
			  class="v-btn">
		<v-btn
		  color="primary"
		  variant="outlined"
		  size="small"
		  elevation="3"
		  @click="exportmenu = false;"
		  >
		  Export
		</v-btn>
	      </json-excel>

	      <v-btn color="secondary"
		     variant="outlined"
		     size="small"
		     elevation="3"
		     @click="exportmenu = false;"
		     >
		Cancel
	      </v-btn>

	      
	    </v-card-actions>
	    
	  </v-card>
	</v-menu>
      </div>
      
      
    </v-toolbar>


    `,
	    
}
