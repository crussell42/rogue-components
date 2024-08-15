//THE LEFT SIDE DRAWER MENU (Genericish)

import {ref,reactive,computed} from 'vue'

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
    console.log('collapseSubMenus before opened:',opened);
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



export const RcSideMenu = {

    components: {
	//RcSideMenuItem,
    },
    //emits: ['update:rail'],

    props:  {
	items: {type: Object, default(rawProps) {return null}},
	rail: {type: Boolean, default: false},
	user: {type: Object, default(rawProps) {return null}}
    },
    setup(props,ctx) {
	if (props.items) {
	    console.log('OVERRIDING SIDE MENU');
	}

	
	const userCtxName = (varName) => {return 'osf_user_'+props.user.id+'_'+varName};
	const {sideMenuItems} = useSideMenuItems();
//	const localRail = computed({
//	    get: ()=> props.rail,
//	    set: (val)=> {
//		console.log('EMITTING:',val);
//		ctx.emit('update:rail', val);
//	    },
//	});



	
	return {
	    sideMenuItems,
	    collapseSubMenus,
	    opened,
//	    localRail,
	    userCtxName,
	}
    },
    data() { return {
	opened: [],
    }},
    computed: {

	localRail: {
	    get: function() { return this.rail},
	    set: function(val) {
		//console.log('EMITTING:',val);
		this.$emit('update:rail', val);
	    },	    
	},
	
	menuItemsWithKeys() {
	    //For the n depth expanding/contracting menu to work, each group must have unique id.
	    //Kind hackey but it works...In theory, we could just use the label or label.label.label...
	    let outterCount = 0; //HACK 
	    const keyItems = (objArr,depth,count) => {
		const depthPrefixes = ['a','b','c','d','e'];
		
		objArr.forEach((obj,ndx) => {
		    outterCount+=1;
		    obj.key = depthPrefixes[depth]+'-'+outterCount;
		    if (obj.subItems && obj.subItems.length>0) keyItems(obj.subItems,depth+1,outterCount);
		});
	    }
	    keyItems(this.sideMenuItems,0,outterCount);
	    return this.sideMenuItems;
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

	let railWussVal = this.wussGet('railState');
	if (railWussVal!=null) this.localRail = railWussVal;

	//example of controlling menu programatically
	//this.rail = false; (opens full side menu)
	//this.opened.push('b-3');
	//this.opened.push('a-2');
	
    },
    watch: {
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

    <rc-side-menu-item :item="itm" :user="user">
    </rc-side-menu-item>
    
  </template>
</v-list>

`,
    
}
