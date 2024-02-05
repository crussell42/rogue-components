import {useTheme} from 'vuetify'
import {ref,reactive} from 'vue' 


import {RcBastardScroll} from './RcBastardScroll.js'
import {RcSideMenu, useSideMenuItems} from './RcSideMenu.js'

//const pageProps = reactive({
//    appBarTitle: 'AppBar',
//    drawer: true,
//    rightDrawer: false,
//    rail: false,
//});

//export function usePageProps() {
//    const pageProps = reactive({
//	appBarTitle: 'AppBar',
//	drawer: true,
//	rightDrawer: false,
//	rail: false,
//    });
//    return {
//	pageProps,
//    }
//}

export const RcLoggedInBaseApp = {

    props: {
	user: {type: Object, default(rawProps) {return {}}},
	clientPageProps: {type: Object, default(rawProps) {return {appBarTitle: 'appBarTitle'}}},
	alert: {type: Boolean, default: false},
	alertText: {type: String, default: 'Well this is embarrasing'},
    },    
    setup(props,ctx) {
	const theme = useTheme();

	const pageProps = reactive({
	    drawer: true,
	    rightDrawer: false,
	    rail: false,	    
	    ...props.clientPageProps,
	});
	
	const {collapseSubMenus} = useSideMenuItems();

	return {
	    theme,
	    toggleTheme: () => theme.global.name.value = theme.global.current.value.dark ? 'light' : 'dark',

	    collapseSubMenus,
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
	RcSideMenu
    },
    created() {

    },

    template: `

	<v-app>	  
	  <v-app-bar class="white">
	    <v-app-bar-nav-icon @click.stop="collapseSubMenus();pageProps.rail = !pageProps.rail"></v-app-bar-nav-icon>
	    
	    <v-app-bar-title>
	      {{pageProps.appBarTitle}} 
	    </v-app-bar-title>
	    <v-spacer></v-spacer>
	    <v-btn icon="mdi-theme-light-dark" @click="toggleTheme">
	    </v-btn>
	  </v-app-bar>


	  <v-navigation-drawer
            v-model="pageProps.drawer"
            :rail="pageProps.rail"
            permanent
            @click="pageProps.rail = false"
	    >

            <v-list-item
              :prepend-avatar="user.avatarUrl?user.avatarUrl:'https://randomuser.me/api/portraits/men/85.jpg'"
              :title="displayname"
              nav
              >
              <template v-slot:append>
		<v-btn
		  variant="text"
		  icon="mdi-chevron-left"
		  @click.stop="collapseSubMenus();pageProps.rail = !pageProps.rail"
		  ></v-btn>
              </template>
            </v-list-item>

	    <v-divider>
	    </v-divider>
	    
            <rc-side-menu>
            </rc-side-menu>


	  </v-navigation-drawer>

	  
	  <!-- RIGHT DRAWER -->
	  <v-navigation-drawer
	    v-model="pageProps.rightDrawer"
            permanent
            location="right"
	    >

	  </v-navigation-drawer>
	  
	  <v-main>
	    <v-container fluid>
	      <v-row>
		<v-col cols="1" md="2" lg="3"></v-col>
		<v-col cols="10" md="8" lg="6">		  
		  <v-alert v-if="alert" color="error" closable>
		    <div class="text-center">
		      {{alertText}}
		    </div>
		  </v-alert>
		</v-col>	    
	      </v-row>


	      

              <slot>
              </slot>


	      <rc-bastard-scroll>
	      </rc-bastard-scroll>	      
	    </v-container>
	  </v-main>	
	</v-app>



          `,

}
