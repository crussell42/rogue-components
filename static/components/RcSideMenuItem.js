import {ref,reactive,defineAsyncComponent, computed, nextTick} from 'vue'

//Note that the only way I could get this recursive component to work was to
//register it globally (see scope.ejs)
//See //CIRCULAR comments

export const RcSideMenuItem = {
    //CIRCULAR RcSideMenuItem: defineAsyncComponent(() => import('./RcSideMenuItem.js'))
    //picked up globally from app.component call.....need to change this.
    components: {
    },
    props:  {
	item: {type: Object, default(rawProps) {return null}},
	user: {type: Object, default(rawProps) {return null}},
	opened: {type: Object, default(rawProps) {return []}},
	hot: {type: String, default:''},
    },
    setup(props,context) {

	const userCtxName = (varName) => {return 'osf_user_'+props.user.id+'_'+varName};

	//Why do I do a dereference here. It seems that props.item is a one way binding and so this should
	//not be necessary....	
	const cow = ref(props.item);

	return {
	    cow,
	    userCtxName,
	}
    },
    data() { return {
	
    }},
    computed: {
	hotColor() {
	    if (this.hot == this.item.key) {
		return 'primary';
	    }
	},
	myColor() {
	    if (this.hot == this.item.key) {
		return 'primary';
	    }
	},

    },
    methods: {

	wussSet(varName,val) {
	    if (window.sessionStorage) {
		let wussName = this.userCtxName(varName);
		let wussVal = JSON.stringify(val);
		window.sessionStorage.setItem(wussName,wussVal);
		//console.log('wussSet [',wussName,'] => [',wussVal,']');
	    }
	},

	
	userAllowed: function(menuItem) {
	    if ((menuItem.requiredRoles)&&(menuItem.requiredRoles.length>0)) {
		let found = false;
		if (this.user) {
		    if (this.user.isadmin) return true;
		    if ((this.user.roles)&&(this.user.roles.length>0)) {
			console.log('userAllowed menuItem.requiredRoles:',menuItem.requiredRoles);
			console.log('user roles:',this.user?.roles);
			found = menuItem.requiredRoles.some(r => this.user.roles.includes(r));
		    }
		}
		return found;
	    } else return true;
	},
	groupClicked(item) {
	    if (this.opened.includes(item.key)) {
		//console.log('CLOSING GROUP');
	    } else {
		//console.log('OPENING GROUP');
		//this.wussSet('menuHot',this.localHot);
		this.wussSet('menuHot',item.key);
		if (item.hasOwnProperty('to')) {
		//    nextTick(() => {
		//	setTimeout(()=>{
			    window.location = item.to;
		//	},0);
		//    });
		}
	    }
	},
	itemClicked(item) {
	    this.wussSet('menuHot',item.key);
	},

    },
    watch: {


    },

    template: `

    <!-- PARENT item (has children and user allowed to see it) (red) when opened -->
    <v-list-group v-if="(cow.subItems && (cow.subItems.length>0) && userAllowed(cow))" :value="cow.key" color="primary">
      <template v-slot:activator="{on:click,props}">
	<v-list-item
	  v-bind="props"
	  :prepend-icon="cow.icon"
	  :title="cow.label"
	  @click="groupClicked(cow)"
	  >
	</v-list-item>
      </template>

      <!-- recursively load all children-->
      <rc-side-menu-item 
	v-for="subItem in cow.subItems"
	:item="subItem"
	:user="user"
	:hot="hot"
	/>
      
    </v-list-group>

    <!-- CHILD item -->
    <v-list-item v-else v-show="userAllowed(cow)"
		 :prepend-icon="cow.icon"
		 :title="cow.label"
		 :value="cow.key"
		 :href="(cow.to && cow.to.length>0)?cow.to:null"
                 @click="itemClicked(cow)"
		 :base-color="hotColor"
                 :color="hotColor"
                 active-class="text-purple"
		 >
    </v-list-item>
	     
`
    
}
