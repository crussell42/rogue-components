import {ref, reactive, mergeProps} from 'vue'

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

	//const localPage = ref(props.page);
	//const localItemsPerPage = ref(props.itemsPerPage);
	return {
	    childVisibleHeaders,
	    selectedrowfilternames,

	    //localPage,
	    //localItemsPerPage,
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
	
	
	computedheaders() {
	    if (typeof(this.allheaders) == 'object') return this.allheaders;
	    else return this.allheaders();
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
			    _.set(oneRec,valueName,_.get(item,valueName,''));
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
            return this.computedheaders.filter((ah) => {
		return (!ah.required);
	    }).map(fh => fh.title);
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

    <v-toolbar
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
	  <template v-slot:prepend>
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
	      <v-list-subheader>Optional Columns</v-list-subheader>
	      <v-list-item v-for="hname in allSelectableHeaderNames()" :key="hname" color="primary" density="compact">
		<!--<v-list-item-title v-text="hname"></v-list-item-title>-->
		<v-checkbox hide-details class="mx-auto" v-model="childVisibleHeaders" :value="hname" :label="hname" multiple density="compact" color="primary">	
		</v-checkbox>
		
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
	      <v-btn color="primary"
		     variant="outlined"
		     size="small"
		     elevation="3"
		     @click="exportmenu = false;"
		     >
		Cancel
	      </v-btn>
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
	      
	    </v-card-actions>
	    
	  </v-card>
	</v-menu>
      </div>
      
      
    </v-toolbar>


    `,
	    
}
