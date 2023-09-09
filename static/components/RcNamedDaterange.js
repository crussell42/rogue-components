import {ref,reactive, computed, mergeProps} from 'vue'

//Should just move this to tmb.
export function dateRangeFromName(dateRangeName) {
    if (!dateRangeName) return;
    //console.log('dateRangeFromName:'+dateRangeName+'  current daterange:'+this.daterange);
    
    let startDate = new Date();
    let endDate = new Date();
    if (dateRangeName.indexOf('This Week')>=0) {
	startDate = tmb.dateFromYoda(tmb.adjustToFirstDayOfWeek(tmb.yoda(startDate)));
    } else if (dateRangeName.indexOf('This Month')>=0) {
	startDate.setDate(1); //set date to first day of month.
	//console.log('This Month:',startDate,endDate);
	//console.log('This Month YODA:',tmb.yoda(startDate),tmb.yoda(endDate));
    } else if (dateRangeName.indexOf('This Quarter')>=0) {
	
	startDate = new Date(endDate);
	let maxQtrMonth = (Math.floor(endDate.getMonth()/3)) * 3;
	startDate.setMonth(maxQtrMonth,1);
	
    } else if (dateRangeName.indexOf('This Year')>=0) {
	startDate.setDate(1);
	startDate.setMonth(0);		
    } else if (dateRangeName.indexOf('Epoch')>=0) {
	startDate = tmb.dateFromYoda('2020-03-01');
    } else if (dateRangeName.indexOf('Last 7 days')>=0) {
	startDate = tmb.dateFromYoda(tmb.adjustDayOfDateStr(tmb.yoda(startDate),-6));		
    } else if (dateRangeName.indexOf('Last 30 days')>=0) {
	startDate = tmb.dateFromYoda(tmb.adjustDayOfDateStr(tmb.yoda(startDate),-29));		
    }
    
    return [startDate,endDate];
}


export const RcNamedDaterange = {

    props: {			

	dateRangeNames: {type: Array, default: function() {return ['Today','This Week','This Month','This Quarter','This Year','Last 7 days','Last 30 days','Custom']}},
	daterange: {type: Array, default: function() {return [null,null]}},
	daterangetext: {type: String, default: ''},
	selecteddaterangename: {type: String, default: 'Today'},

    },
    emits: ['update:daterange','update:daterangetext','update:selecteddaterangename'],
    setup(props,ctx) {

	//let dpval = ref([]);

	/*
	const daterangeLocal = computed({
	    get: function() {
		return this.daterange;		
	    },
	    set: function(val) {
		console.log('daterangeLocal set:',val);
		ctx.emit('update:daterange',val);
	    }
	});
	*/


	if (props.selecteddaterangename) {
	    if (props.dateRangeNames.includes(props.selecteddaterangename)) {
		//Override the passed in or default daterange.
		//console.log('OVERRIDE BY NAME:',props.selecteddaterangename);
		//dpval = dateRangeFromName(props.selecteddaterangename);
		//daterangeLocal = dateRangeFromName(props.selecteddaterangename);
	    }
	}
	
	return {
	    mergeProps,
	    //dpval,
	    dateRangeFromName,
	    //daterangeLocal,
	}
    },
    data: function() {
	return {

	    showcustomdaterange: false,
	    daterangemenu: false,

	    loading: false,
	    forcedrt: 0,
	    dpval: [],
	}
    },
    computed: {	
	
	daterangeLocal: {
	    get: function() {
		return this.daterange;		
	    },
	    set: function(val) {
		this.forccedrt = this.forcedrt + 1;
		this.$emit('update:daterange',val);
	    }
	},
	//dates are treated differently in vue so you can not count on proper compputed behavior.
	daterangetextLocal: {
	    get: function() {
		this.forcedrt;

		//NA, we want to controll what daterange text is...
		//this.actual_daterange;
		//this.daterangeLocal;

		let ans = '';
		if (this.daterangeLocal.length==0) ans = ''; //return '[ .. ]';
		else if (this.daterangeLocal.length==1) ans = ''+tmb.yoda(this.daterangeLocal[0])+' ..';
		else ans = ''+this.daterangeLocal.map((d)=> { return tmb.yoda(d)}).join(' .. ')+'';

		//console.log('COMPILED daterangetextLocal:',ans);
		return ans;		
	    },
	    set: function(val) {
		//Never called.....so no emit...see watcher for this computed.
		//This one seems to do nothing...had to add watcher???????
		//console.log('daterangetextLocal set:',val);
		this.$emit('update:daterangetext',val);
	    },
	},

	selecteddaterangenameLocal: {
	    get: function() {
		return this.selecteddaterangename;
	    },
	    set: function(val) {
		this.$emit('update:selecteddaterangename',val);
	    },
	},
	
    },
    created: function() {
    	this.daterangeLocal = dateRangeFromName(this.selecteddaterangenameLocal);
	this.forccedrt = this.forcedrt + 1;
	this.$emit('update:daterangetext',this.daterangetextLocal);
	//madening...if we dont go ahead and emit here, we dont get the initial value set in the parent even though it may have been passed in.
    },
    watch: {

	
        selecteddaterangenameLocal: function(val,oldVal) {
	    if (oldVal !== val) {
		if (val == 'Custom') {
		    this.showcustomdaterange = true;
		    //this.daterangemenu=true;
		    this.dpval = [];
		    this.daterangeLocal=[];
		} else {
		    this.showcustomdaterange = false;
		    let newRange = dateRangeFromName(val); //this sets dataStartDate, dataEndDate
		    //console.log('Resetting to:',newRange);
		    this.daterangeLocal = newRange;
		    this.dpval = newRange;
		}
	    }
	},
	
	
	daterangetextLocal: function(val,oldVal) {
	    //console.log('local text changed:'+val);
	    //Shouldnt have to do this here but the v-date-range does something funky when interacting with its text field.
	    this.$emit('update:daterangetext',val);
	},
	
    },
    
    methods: {
	/*
	dateRangeFromName: function(dateRangeName) {
	    if (!dateRangeName) return;
	    //console.log('dateRangeFromName:'+dateRangeName+'  current daterange:'+this.daterange);
	    
	    let startDate = new Date();
	    let endDate = new Date();
	    if (dateRangeName.indexOf('This Week')>=0) {
		startDate = tmb.dateFromYoda(tmb.adjustToFirstDayOfWeek(tmb.yoda(startDate)));
	    } else if (dateRangeName.indexOf('This Month')>=0) {
		startDate.setDate(1); //set date to first day of month.
		//console.log('This Month:',startDate,endDate);
		//console.log('This Month YODA:',tmb.yoda(startDate),tmb.yoda(endDate));
	    } else if (dateRangeName.indexOf('This Quarter')>=0) {
		
		startDate = new Date(endDate);
		let maxQtrMonth = (Math.floor(endDate.getMonth()/3)) * 3;
		startDate.setMonth(maxQtrMonth,1);
		
	    } else if (dateRangeName.indexOf('This Year')>=0) {
		startDate.setDate(1);
		startDate.setMonth(0);		
	    } else if (dateRangeName.indexOf('Epoch')>=0) {
		startDate = tmb.dateFromYoda('2020-03-01');
	    } else if (dateRangeName.indexOf('Last 7 days')>=0) {
		startDate = tmb.dateFromYoda(tmb.adjustDayOfDateStr(tmb.yoda(startDate),-6));		
	    } else if (dateRangeName.indexOf('Last 30 days')>=0) {
		startDate = tmb.dateFromYoda(tmb.adjustDayOfDateStr(tmb.yoda(startDate),-29));		
	    }


	    //this.daterangeLocal = [startDate,endDate];
	    //this.dpval = [startDate,endDate];
	    //this.daterangetextLocal; //force an eval
	    return [startDate,endDate];
	},
	*/
	
	cancelRange: function() {
	    this.daterangemenu=!this.daterangemenu;
	    this.dpval = [];
	    this.daterangeLocal = [];
	},
	updateRange: function() {	    
	    if (this.dpval.length==2) {
		//console.log('updateRange before sort:',this.dpval);
		this.dpval.sort(function(a,b) {
		    return a-b
		});		
		//console.log('updateRange after sort:',this.dpval);
		this.daterangemenu=!this.daterangemenu;
		
		this.daterangeLocal = this.dpval;
	    } else {
	    }
	},
    },

    template: `
                <v-col>
                  <v-row>

		    <!-- DATE RANGE NAME DRODOWN -->
		    
		    <v-menu offset-y>
		      <template v-slot:activator="{ props:menu }">
			<v-btn
			  small
			  variant="outlined"
			  elevation="3"

			  
			  color="primary"
			  v-bind="menu"
			  :disabled="loading"
			  >
			  <v-icon small>mdi-calendar</v-icon>{{selecteddaterangenameLocal}}<v-icon>mdi-chevron-down</v-icon>
			  <!--			  
			  <v-progress-circular v-if="loading" indeterminate :size="20" color="primary">		  
			  </v-progress-circular>
			  -->
			  
			</v-btn>
		      </template>
		      <v-list>
			<v-item-group 
			  v-model="selecteddaterangenameLocal"
			  mandatory
			  dense
			  >
			  <v-list-item
			    v-for="(item, index) in dateRangeNames"
			    :key="index"
			    :value="item"
			    @click="selecteddaterangenameLocal = item"
			    >
			    <v-list-item-title>{{ item }}</v-list-item-title>
			  </v-list-item>
			</v-item-group>
		      </v-list>
		    </v-menu>

		    <!-- END DATE RANGE NAME DRODOWN -->

		    <v-menu
		      v-model="daterangemenu"
		      :close-on-content-click="false"
		      :nudge-right="40"
		      transition="scale-transition"
		      offset-y
		      min-width="auto"
		      density="compact"

		      >
		      <template v-slot:activator="{ props:menu }">			
			<v-tooltip location="bottom">
			  <template v-slot:activator="{ props: tooltip }">
			    
			    <v-text-field
			      density="compact"
			      class="mx-2"
			      v-model="daterangetextLocal"
			      label="Date Range"


			      v-bind="mergeProps(menu,tooltip)"
			      :disabled="!showcustomdaterange"
			      >
			    </v-text-field>
			    
			  </template>
			  <span>
			    Select <b>Custom</b> to manually set range
			  </span>
			</v-tooltip>
			
		      </template>
		      
		      
		      <v-date-picker
			v-model="dpval"
			
			show-adjacent-months
			multiple
			@click:cancel="cancelRange"
			@click:save="updateRange"

			>
		      </v-date-picker>
		    </v-menu>
	          </v-row>
		  <!--
		  <v-row>
		    {{dpval}} | {{daterangeLocal}}
		  </v-row>
		  -->
		</v-col>
		  
    `,

};
