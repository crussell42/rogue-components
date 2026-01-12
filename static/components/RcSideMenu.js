//THE LEFT SIDE DRAWER MENU (Genericish)

import {ref,reactive,computed,toRaw,toValue} from 'vue'

//CIRCULAR import {RcSideMenuItem} from './RcSideMenuItem.js'
//NOTE: Since RcSideMenuItem is recursive, we have to register it globally.
//See comment //CIRCULAR for how it SHOULD work. When done like that though, the menus are not reactive for some reason...fuck sake.
//CIRCULAR import {RcSideMenuItem} from './RcSideMenuItem.js'
/*
  The way to use this in a components setup method is like this:
    setup(props,ctx) {
	//get the function to collapse all submenus within RcSideMenu component.
	const {opened,sideMenuItems,collapseSubMenus} = useSideMenuItems(
	    [
		{label:'Home', icon:'mdi-home', to: '/dashboard'},
		{label: 'Metrics', icon: 'mdi-chart-line', subItems: [
		    {label: 'Revenue', icon: 'mdi-finance', to: '/revenue'},
		    {label: 'Batch Revenue', icon: 'mdi-finance', to: '/batchrevenue'},	
		],},

		{label: 'Workers', icon: 'mdi-transit-transfer', subItems: [
		    {label: 'List', icon: 'mdi-list-status', to: '/referrallist'},
		],},
		{label:'Settings', icon:'mdi-cogs', active: false, subItems: [
		    {label:'Company', icon:'mdi-office-building-cog-outline', requiredRoles:[]},
		    {label:'User', icon:'mdi-account-cog-outline', to:'/usersettings'},
		],},
	    ]
	);

	Then, you can set the state of the side menu by changing the opened array:
	e.g. opened.push('a-1') would force the 2nd menu item open.
*/

export function useSideMenuItems(override) {
    if (override) sideMenuItems.value = override;
    return {
	opened,
	sideMenuItems,
	collapseSubMenus
    }
}


//ordered list
export const sideMenuItems = ref([

    {label:'Home', icon:'mdi-home', to: '/'},
    {label:'Settings', icon:'mdi-cogs', active: false, subItems: [
	{label: 'Company', icon:'mdi-office-building-cog-outline', requiredRoles:[]},
	{label:'User', icon:'mdi-account-cog-outline', to:'/usersettings'},
    ],},
    {label:'Logout', icon: 'mdi-logout'},
    
]);

const opened = ref([]);

function collapseSubMenus() {

    opened.value = [];

}



export const RcSideMenu = {

    components: {

    },

    props:  {
	items: {type: Object, default(rawProps) {return null}},
	rail: {type: Boolean, default: false},
	user: {type: Object, default(rawProps) {return null}},
	clickdata: {type: Object, default(rawProps) {return null}}
    },
    setup(props,ctx) {
	const userCtxName = (varName) => {return 'osf_user_'+props.user.id+'_'+varName};

	const {sideMenuItems} = useSideMenuItems();

	let localSideMenuItems = [];

	if (props.items) {
	    localSideMenuItems = toRaw(props.items); //LOCAL
	} else {
	    localSideMenuItems = toRaw(sideMenuItems); //GLOBAL
	}

	return {
	    toValue,
	    localSideMenuItems,
	    //sideMenuItems,
	    collapseSubMenus,
	    opened,
	    userCtxName,
	}
    },
    data() { return {
	hot: null,
	opened: [],
    }},
    computed: {

	localRail: {
	    get: function() { return this.rail},
	    set: function(val) {
		this.$emit('update:rail', val);
	    },	    
	},
	
	menuItemsWithKeys() {
	    //For the n depth expanding/contracting menu to work, each group must have unique id.
	    //Kinda hackey but it works...In theory, we could just use the label or label.label.label...
	    let outterCount = 0; //HACK 
	    const keyItems = (objArr,depth,count) => {
		//console.log('keyItems typeof:',typeof(objArr));
		
		const depthPrefixes = ['a','b','c','d','e'];
		
		objArr.forEach((obj,ndx) => {
		    outterCount+=1;
		    obj.key = depthPrefixes[depth]+'-'+outterCount;
		    if (obj.subItems && obj.subItems.length>0) keyItems(obj.subItems,depth+1,outterCount);
		});
	    }
	    keyItems(this.localSideMenuItems,0,outterCount);
	    return this.localSideMenuItems;
	},
    },
    methods: {
	//local browser window user session storage (wuss)...user level state maintained locally.
	//TODO: create globally defined headless vue component to make this available to vue.
	wussGet(varName) {
	    if (window.sessionStorage) {
		let wussName = this.userCtxName(varName);
		let wussValStr = window.sessionStorage.getItem(wussName);
		let wussVal = JSON.parse(wussValStr);
		//console.log('wussGet [',wussName,'] == [',wussVal,']');
		return(wussVal);
	    }
	    return null;
	},
	wussSet(varName,val) {
	    if (window.sessionStorage) {
		let wussName = this.userCtxName(varName);
		let wussVal = JSON.stringify(val);
		window.sessionStorage.setItem(wussName,wussVal);
		//console.log('wussSet [',wussName,'] => [',wussVal,']');
	    }
	},
    },
    mounted() {
	let openedWussVal = this.wussGet('menuState');
	if (openedWussVal) this.opened = openedWussVal;

	let hotWussVal = this.wussGet('menuHot');
	if (hotWussVal) this.hot = hotWussVal;
	
	let railWussVal = this.wussGet('railState');
	if (railWussVal!=null) this.localRail = railWussVal;

	//console.log('RcSideMenu.mounted opened:',this.opened,' hot:',this.hot,' rail:',this.rail);
	//example of controlling menu programatically
	//this.rail = false; (opens full side menu)
	//this.opened.push('b-3');
	//this.opened.push('a-2');
	
    },
    watch: {
	//hot(v,ov) {
	//    console.log('RcSideMenu hot v:',v,' ov:',ov);
	//},
	opened: {
	    handler(v,p) {
		//console.log('opened watcher:',v,' prev:',p);
		//always open full menu when going from empty to not empty.
		if ((p)&&(p.length==0)&&(v)&&(v.length>0)) this.localRail = false;
		this.wussSet('menuState',this.opened);
	    },
	    deep: true
	},

	localRail: function(v,ov) {
	    //console.log('rail state:',ov,' => ',v);
	    this.wussSet('railState',v);
	}

    },
    // 
    //  @update:opened="newOpened => opened = newOpened.slice(-1)"
    //  @update:opened="v=> openedUpdated(v)"
    //
    template: `


<v-list
  density="compact" 
  nav
  open-strategy="single"
  v-model:opened="opened"
  
  >
  <template v-for="(itm,ndx) in menuItemsWithKeys">

    <rc-side-menu-item v-if="!toValue(itm.hide)" :rail="localRail" :item="itm" :user="user" :opened="opened" :hot="hot" :clickdata="clickdata">
    </rc-side-menu-item>
    
  </template>
</v-list>

`,
    
}
