import {ref,reactive} from 'vue'

//ordered list
export const sideMenuItems = ref([

    {label:'Home', icon:'mdi-home', to: '/'},
    {label:'Settings', icon:'mdi-cogs', active: false, subItems: [
	{label: 'Company', icon:'mdi-office-building-cog-outline', requiredRoles:[]},
	{label:'User', icon:'mdi-account-cog-outline', to:'/usersettings'},
    ],},
    {label:'Logout', icon: 'mdi-logout'},
    
]);

//const ass = ref(false);
const opened = ref([]);

export function collapseSubMenus() {

    //ass.value=!ass.value;

    //console.log('before:'+opened.value);
    //opened.value = opened.value.slice(-1);
    opened.value = [];
    //NOTE setting or removing an app is NOT what is causing the menu to collapse...it appears to JUST be reallocation of variable.
    //maybe they use a watcher......??????
    //console.log('after:'+opened.value);
    /*
    sideMenuItems.value.forEach((itm)=> {
	if ((itm.subItems) && (itm.subItems.length>0)) {
	    //console.log('collapse '+itm.label+' curVal:'+itm.active);
	    //NOTE: below, gotta use the parens so that rvalue is a boolean so from other components it seems like we are loosing reactivity???
	    //wonky behaviou itm.active= !itm.active;
	    itm.active= (!itm.active);	
	}
    });
    */
}
export function useSideMenuItems(override) {
    if (override) sideMenuItems.value = override;
    return {
	sideMenuItems,
	collapseSubMenus
    }
}

export const RcSideMenu = {
    props:  {
	items: {type: Object, default(rawProps) {return null}},
	user: {type: Object, default(rawProps) {return null}}
    },
    setup(props,ctx) {
	if (props.items) {
	    console.log('OVERRIDING SIDE MENU');
	}
	const {sideMenuItems} = useSideMenuItems();

	return {
	    sideMenuItems,
	    collapseSubMenus,
	    opened,
	    //ass
	}
    },
    data() { return {
	//opened: [],
    }},
    computed: {
	menuItems() {
	    const keyItems = (objArr,depth) => {
		const depthPrefixes = ['a','b','c','d','e'];
		objArr.forEach((obj,ndx) => {
		    obj.key = depthPrefixes[depth]+'-'+ndx;
		    if (obj.subItems && obj.subItems.length>0) keyItems(obj.subItems,depth+1);
		});
	    }
	    keyItems(this.sideMenuItems,0);
	    //console.log(this.sideMenuItems);
	    return this.sideMenuItems;
	},
    },
    methods: {
	userAllowed(menuItem) {
	    //if (!menuItem.requiredRoles) return true;
	    //console.log('menuItem:',menuItem);
	    if ((menuItem.requiredRoles)&&(menuItem.requiredRoles.length>0)) {
		if (menuItem.requiredRoles.includes('admin')) {
		    //console.log('MENU ITEM '+menuItem.label+' REQUIRES ROLE ',menuItem.requiredRoles);
		    return false;
		}
	    } else return true;
	},
	//collapseSubMenus() {
	//    this.menuItems.forEach((itm)=> {
	//	if ((itm.subItems) && (itm.subItems.length>0)) itm.active=!itm.active;
	//    });
	//},
	//barf(item) {
	//    console.log('barf:'+item.active);
	//},
	//openedUpdated(v) {
	//    console.log('opened updated:',v);
	//}
    },
    watch: {
	opened: {
	    handler(v,p) {
		console.log('opened: '+p+' => '+v);
	    },
	    deep: true
	}

	//ass(v,p) {
	//    console.log('ass: '+p+' => '+v);
	//},
	//sideMenuItems: {
	//    handler(v,p) {
	//	console.log('v:',v,'p:',p);
	//    },
	//    deep: true
	//}
    },
    // 
    //  @update:opened="newOpened => opened = newOpened.slice(-1)"
    //  @update:opened="v=> openedUpdated(v)"
    //
    template: `

<v-list
  density="compact" 
  nav
  :opened="opened"

  >
  <template v-for="(itm,ndx) in menuItems">
    <v-list-group v-if="(itm.subItems && (itm.subItems.length>0) && userAllowed(itm))" :value="itm.key" color="red">
      <template v-slot:activator="{on:click,props}">
	<v-list-item
	  v-bind="props"
	  :prepend-icon="itm.icon"
	  :title="itm.label"
	  
	  >
	</v-list-item>
      </template>
      <v-list-item v-for="(subItm,subNdx) in itm.subItems" 
		   v-show="userAllowed(subItm)"
		   :prepend-icon="subItm.icon"
		   :title="subItm.label"
                   :value="subItm.key"
		   :href="(subItm.to && subItm.to.length>0)?subItm.to:null"
		   @click="collapseSubMenus()"></v-list-item>
    </v-list-group>
    
    <v-list-item v-else v-show="userAllowed(itm)" 
		 :prepend-icon="itm.icon"
		 :title="itm.label"
		 :value="itm.key"
		 :href="(itm.to && itm.to.length>0)?itm.to:null"
		 ></v-list-item>
  </template>
</v-list>

`,
    
}
