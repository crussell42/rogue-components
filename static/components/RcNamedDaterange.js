import {ref,reactive, computed, mergeProps} from 'vue'


//export const RcNamedDaterange = {
export default {

    props: {			

	dateRangeNames: {type: Array, default: function() {
	    return tmb.commonDateRangeNames;
	}},
	daterange: {type: Array, default: function() {return [null,null]}},
	daterangetext: {type: String, default: ''},
	selecteddaterangename: {type: String, default: 'Today'},

    },
    emits: ['update:daterange','update:daterangetext','update:selecteddaterangename'],
    setup(props,ctx) {

	return {
	    mergeProps,
	    //dateRangeFromName,
	}
    },
    data: function() {
	return {
	    showcustomdaterange: false,
	    daterangemenu: false,
	}
    },
    computed: {	
	
	daterangeLocal: {
	    get: function() {
		return this.daterange;		
	    },
	    set: function(val) {
		this.$emit('update:daterange',val);
	    }
	},
	//dates are treated differently in vue so you can not count on proper computed behavior here.
	daterangetextLocal: {
	    get: function() {
		let ans = '';
		if (this.daterangeLocal.length==0) ans = ''; //return '[ .. ]';
		else if (this.daterangeLocal.length==1) ans = ''+tmb.yoda(this.daterangeLocal[0])+' ..';
		else ans = ''+this.daterangeLocal.map((d)=> { return tmb.yoda(d)}).join('..')+'';

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
    	this.daterangeLocal = tmb.dateRangeFromName(this.selecteddaterangenameLocal);
	this.$emit('update:daterangetext',this.daterangetextLocal);
	//madening...if we dont go ahead and emit here, we dont get the initial value set in the parent even though it may have been passed in.
    },
    watch: {
	
        selecteddaterangenameLocal: function(val,oldVal) {
	    if (oldVal !== val) {
		if (val == 'Custom') {
		    this.showcustomdaterange = true;
		    this.daterangeLocal=[];
		} else {
		    this.showcustomdaterange = false;
		    let newRange = tmb.dateRangeFromName(val); //this sets dataStartDate, dataEndDate
		    //console.log('Resetting to:',newRange);
		    this.daterangeLocal = newRange;
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
	cancelRange: function() {
	    this.daterangemenu=!this.daterangemenu;
	    this.daterangeLocal = [];
	},
	updateRange: function() {	    
	    if (this.daterangeLocal.length==2) {
		this.daterangeLocal.sort(function(a,b) {
		    return a-b
		});		
		this.daterangemenu=!this.daterangemenu;
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
			  >
			  <v-icon small>mdi-calendar</v-icon>{{selecteddaterangenameLocal}}<v-icon>mdi-chevron-down</v-icon>
			  
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
			v-model="daterangeLocal"
			
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
		    {{daterangeLocal}}
		  </v-row>
		  -->
		</v-col>
		  
    `,

};
