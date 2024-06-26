import {ref,reactive,defineAsyncComponent} from 'vue'

//Note that the only way I could get this recursive component to work was to
//register it globally (see dashboard.ejs)
//See //CIRCULAR comments

export const RcSideMenuItem = {
    components: {
	//CIRCULAR RcSideMenuItem: defineAsyncComponent(() => import('./RcSideMenuItem.js'))
	//picked up globally from app.component call.....need to change this.
    },
    props:  {
	item: {type: Object, default(rawProps) {return null}},
    },
    setup(props,ctx) {
	const cow = ref(props.item);
	return {
	    cow,
	}
    },
    data() { return {
	
    }},
    computed: {
    },
    methods: {
	userAllowed(menuItem) {
	    if ((menuItem.requiredRoles)&&(menuItem.requiredRoles.length>0)) {
		if (menuItem.requiredRoles.includes('admin')) {
		    return false;
		}
	    } else return true;
	},
    },
    watch: {


    },

    template: `

<v-list-group v-if="(cow.subItems && (cow.subItems.length>0) && userAllowed(cow))" :value="cow.key" color="red">

  <template v-slot:activator="{on:click,props}">
    <v-list-item
      v-bind="props"
      :prepend-icon="cow.icon"
      :title="cow.label"      
      >
    </v-list-item>
  </template>

  <rc-side-menu-item v-for="subItem in cow.subItems" :item="subItem"/>

</v-list-group>

<v-list-item v-else v-show="userAllowed(cow)"
	     :prepend-icon="cow.icon"
	     :title="cow.label"
	     :value="cow.key"
	     :href="(cow.to && cow.to.length>0)?cow.to:null"
	     >
</v-list-item>
	     
`
    
}
