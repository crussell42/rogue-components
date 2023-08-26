import {ref,reactive} from 'vue' 

export const RcTagsAddField = {
    props: {			    
	items: {type: Array, default: function() {return []}},	
	selected: {type: Array, default: function() {return []}},

	label: {type: String, default: 'Tags'},
	hint: {type: String, default: 'Type condition name if not listed and hit <Enter>'},

	lowercase: {type: Boolean, default: false},
	colorsmap: {type: Object, default: function () {return {dvt:'purple',sales:'green', manager: 'yellow', developer:'orange'}}},
	name: {type: String, default: 'tagsaddfield'}
    },
    setup(props,context) {
	const availabletags = ref(props.items);
	return {
	    availabletags
	}
    },
    data: function() {
	return {
	    tagsearch:'',

	    //after add accept or reject tags.
	    editRules: [function(v) {
		//console.log('V:'+v);
		//return 'error msg';
		return true;
	    }],	    
	}
    },
    computed: {
        availableTagNames() {
	    let all = [...new Set([...this.selectedLocal, ...this.availabletags])];
	    let combined = all.flat();
	    return combined;
	},

	//I dig this pattern better than my old method per event emitter
	//prop value gets pulled in and emitted when changed.
	// Use it in v-model of templates v-combobox.
	//   So when the v-combobox mutates this, it emits the appropriate update event.
	//   And you dont get the Warning about mutating property.
	selectedLocal: {
	    get: function() {
		return this.selected;
	    },
	    set: function(value) {
		this.$emit('update:selected',value);		
	    }
	},
    },
    methods: {
	filter: function(item, queryText, itemText) {
	    //console.log('itm:'+item+' query:'+queryText+' itemText:'+itemText);
            //if (item.header) return false
	    
            //const hasValue = val => val != null ? val : ''
	    
            //const text = hasValue(itemText)
            //const query = hasValue(queryText)
	    
            //return text.toString()
	    //	.toLowerCase()
	    //	.indexOf(query.toString().toLowerCase()) > -1
	},
	colorFromTag: function(item) {
	    //console.log('colorFromTag:',item);
	    if (!this.colorsmap.hasOwnProperty(item)) return 'primary';
	    return this.colorsmap[item];
	},
	removeSelectedLocal(name) {
	    //console.log('remove:',name);
	    let idx = this.selectedLocal.findIndex((elem)=> elem == name);
	    if (idx>=0) this.selectedLocal.splice(idx,1);
	},
  
    },
    watch: {
	
    },
    mounted: function() {

    },
    template: `
        <v-combobox
	  v-model="selectedLocal"
	  :items="availableTagNames"

          :filter="filter"		      
	  :hint="hint"
	  :label="label"

	  multiple
	  	  
          :menu-props="{closeOnContentClick:true}"
          :rules="editRules"
	  variant="underlined"

	  :name="name"
	  >
	  <!--new version does not destructure data to attrs, item, parent,selected-->
	  <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs"
              label
              small
              :color="colorFromTag(data.item.title.toLowerCase())"
	      closable
	      @click:close="removeSelectedLocal(data.item.title)"
              >
              <span class="pr-2">
		{{ data.item.title }}
              </span>
            </v-chip>
	  </template>          

	  <template v-slot:no-data>
	    <v-list-item>

	      <v-list-item-title>
		No {{ label }} Named "<strong>{{ tagsearch }}</strong>". Press <kbd>enter</kbd> to create a new one
	      </v-list-item-title>
	      
	    </v-list-item>
	  </template>


	  
	  <template v-slot:append>
	    <slot name="append">
	      
	      
	    </slot>
	  </template>
	  
	  
	</v-combobox>

    `,
};
