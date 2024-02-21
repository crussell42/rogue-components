<template>
	<v-col>
	  <v-row>

	      <v-menu
		v-model="showipp"
		:close-on-content-click="false"
                class="pa-0"

		>


		<template v-slot:activator="{ props: menu }">		  
		  <v-tooltip location="top">
		    <template v-slot:activator="{ props: tooltip }">		      
		      <v-btn
			density="compact"
			min-width="136" width="136"
			variant="outlined"
			class="elevation-1"
			color="primary"
			v-bind="mergeProps(menu,tooltip)"
                        
			>
			<div class="text-caption">{{paginationSummary}}</div>
		      </v-btn>
		    </template>
		    <span>Select Rows Per Page</span>
		  </v-tooltip>
		</template>

		<v-card width="300">
		  <v-card-text>
		    <div class="text-caption text-center">Select Rows Per Page</div>
		    <!--
		    <v-text-field
		      v-model.number="localItemsPerPage"
		      type="number"
		      style="width: 80px"
		      density="compact"
		      hide-details
		      variant="outlined"
		      ></v-text-field>
		    -->

		    <v-select
		      :items="rowsPerPageItems"
		      v-model="localItemsPerPage"
		      density="compact"
		      >
		    </v-select>

		  </v-card-text>
		</v-card>			  
	      </v-menu>
	      
	    </v-row>
	    
            <v-row>
	      
	      <v-tooltip location="bottom">
		<template v-slot:activator="{ props: tooltip }">		      
		  <v-btn :disabled="((itemsPerPage<0)||(localPage<=1))"
			 @click="decrPage"
			 density="compact"
			 min-width="30" width="30"
			 variant="outlined"
			 class="elevation-1"
			 color="primary"
			 v-bind="tooltip">
		    <v-icon>mdi-chevron-left</v-icon>
		  </v-btn>
		</template>
		Previous Page
	      </v-tooltip>

	      <v-tooltip location="bottom">
		<template v-slot:activator="{ props: tooltip }">		      	      
		  <v-btn :disabled="((itemsPerPage<0)||(localPage<=1))"
			 @click="setPage(1)"
			 density="compact"
			 min-width="30" width="30"
			 variant="outlined"
			 class="elevation-1"
			 color="primary"
			 v-bind="tooltip">
		    <v-icon>mdi-page-first</v-icon>
		  </v-btn>		  
	      	</template>
		First Page
	      </v-tooltip>
	      
	      <v-tooltip location="bottom">
		<template v-slot:activator="{ props: tooltip }">		      		  
		  <v-btn :disabled="(localPage==pageCount)"
			 @click="setPage(pageCount)"
			 density="compact"
			 min-width="30" width="30"
			 variant="outlined"
			 class="elevation-1"
			 color="primary"
			 v-bind="tooltip">
		    <v-icon>mdi-page-last</v-icon>
		  </v-btn>
		</template>
		Last Page
	      </v-tooltip>

	      <v-tooltip location="bottom">
		<template v-slot:activator="{ props: tooltip }">		      
		  <v-btn :disabled="(localPage==pageCount)"
			 @click="incrPage"
			 density="compact"
			 min-width="30" width="30"
			 variant="outlined"
			 class="elevation-1"
			 color="primary"
			 v-bind="tooltip">
		    <v-icon>mdi-chevron-right</v-icon>
		  </v-btn>
		</template>
		Next Page
	      </v-tooltip>
	      
	    </v-row>
	  </v-col>

</template>

<script>
import {ref, reactive, mergeProps} from 'vue'

//export const RcPagination = {
export default {
    components: {
    },

    props: {
	filtereditems: null,
	page: {type:Number, default: 1},
	itemsPerPage: {type:Number, default: 10},
    },
    setup(props,context) {
	
	return {
	}
    },
    data: function() {
	return {
	    rowsPerPageItems: [
		{value:5,title:" 5 Records"},
		{value:10,title:" 10 Records"},
		{value:20,title:" 20 Records"},
		{value:100,title:" 100 Records"},
		{value:-1,title:'All'}],
	    
	    showipp: false,

	}
    },
    computed: {

	localPage: {
	    get: function() {
		//console.log('rc-pagination read page:',this.page);
		return this.page;
	    },
	    set: function(value) {
		//console.log('rc-pagination emit update:page:',value);
		this.$emit('update:page',value);
	    }	    
	},

	localItemsPerPage: {
	    get: function() {
		return (this.itemsPerPage*1);
	    },
	    set: function(value) {
		this.$emit('update:itemsPerPage',value);
	    }	    
	},
	
	
	totalRecords() {
            return this.filtereditems.length
	},
	pageCount() {
	    if (this.localItemsPerPage<0) return 1;
            else return Math.ceil(this.totalRecords / this.localItemsPerPage);
	},
	paginationSummary() {
	    let pe = (((this.localPage) * (this.localItemsPerPage<0?this.totalRecords:this.localItemsPerPage)));
	    let maxRec = (pe>this.totalRecords)?this.totalRecords:pe;
	    return 'p'+this.localPage+' ('+(((this.localPage-1) * this.localItemsPerPage)+1)+'-'+maxRec+') of '+this.totalRecords;
	},

	
    },
    methods: {
	mergeProps,
	incrPage() {
	    if (this.localPage<this.pageCount) this.localPage=this.localPage+1;
	},
	decrPage() {
	    if (this.localPage>1) this.localPage=this.localPage-1;
	},
	setPage(val) {
	    this.localPage = (val*1);
	},


    },
    mounted() {

    },
    watch: {
	localItemsPerPage: function(val,oldVal) {
	    //Ugly but effective way to close the activator menu when the v-select for number of items per page
	    //value changes.
	    if (val !== oldVal) this.showipp=false;
	},
    },


}
</script>