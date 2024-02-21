import {useTheme} from 'vuetify'
import {ref,reactive} from 'vue' 


import {RcBastardScroll} from './RcBastardScroll.js'


export const RcBaseApp = {

    props: {
	user: {type: Object, default(rawProps) {return {}}},
	clientPageProps: {type: Object, default(rawProps) {return {appBarTitle: 'appBarTitle'}}}
    },    
    setup(props,ctx) {
	const theme = useTheme();

	const pageProps = reactive({
	    drawer: true,
	    rightDrawer: false,
	    rail: false,	    
	    ...props.clientPageProps,
	});
	
	//const {collapseSubMenus} = useSideMenuItems();

	return {
	    theme,
	    toggleTheme: () => theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark',

	    //collapseSubMenus,
	    pageProps,
	} 
    },

    data: function() {
	return {

	}
    },
    computed: {
	displayname() {
	    
	    if (this.user) {
		let dname = '';
		if ((this.user?.first_name?.length==0)&&(this.user?.last_name?.length==0)) {
		    dname = dname+this.user.username;
		} else {
		    if (this.user.first_name?.length>0) dname = dname+this.user.first_name+' ';
		    if (this.user.last_name?.length>0) dname = dname+this.user.last_name+' ';
		}		      
		return dname.trim();
	    } else return 'Unknown Person';
	},
    },
    methods: {

    },
    components: {
	RcBastardScroll,
    },
    created() {

    },

    template: `

	<v-app>	  
	  <v-main>
	    
	    <v-app-bar density="prominent" elevation="0" style="background: linear-gradient(180deg, rgba(211,240,254,1) 0%, #FFFFFF 100%);">

	      <v-app-bar-title class="text-h4 font-weight-light text-center text-red">{{pageProps.appBarTitle}}</v-app-bar-title>
	      <v-row>
		<v-spacer></v-spacer>
		<!--
		<div class="text-h4 font-weight-light text-red text-left pull-up">
		  {{pageProps.appBarTitle}}
		</div>
		-->
		<v-spacer></v-spacer>
		<img src="/static/images/rc-logo-tb.png" contained><img>
		<v-spacer></v-spacer>
		<v-btn icon="mdi-theme-light-dark" @click="toggleTheme"></v-btn>
	      </v-row>
	      
	    </v-app-bar>

	    <v-container fluid>
		
		
              <slot>
              </slot>
	      
	      
	      <rc-bastard-scroll>
	      </rc-bastard-scroll>	      
	    </v-container>
	    
	  </v-main>
	</v-app>

          `,

}

