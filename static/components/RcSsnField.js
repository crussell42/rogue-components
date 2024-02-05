import {ref,reactive, nextTick} from 'vue'

/* RogueComponent phone number field that just makes sense.
PARENT .html USAGE
<head>
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css" rel="stylesheet">
    <link href="https://unpkg.com/vuetify@3.3.9/dist/vuetify-labs.min.css" rel="stylesheet">
</head>


<script type="importmap">
{
  "imports": {
    "vue": "https://unpkg.com/vue@3.2.47/dist/vue.esm-browser.js",
    "vuetify": "https://unpkg.com/vuetify@3.3.9/dist/vuetify-labs.esm.js",
    "vuetifycolors": "https://unpkg.com/vuetify@3.3.9/lib/util/colors.mjs",
  }
}
    </script>

<script type="module">

    import { createApp, ref, reactive } from 'vue' 
    import { createVuetify } from 'vuetify'
    const vuetify = createVuetify();

    import {RcPhoneField,validPhone,formattedPhoneNumber,digitsPhoneNumber} from '/static/components/RcPhoneField.js'
    const app = createApp({
       components: {RcPhoneField,},
       props: {
       },
       setup(props,ctx) {
       },
       data() {
         return {
	     dog: '123.456.7890',
         }
       }
       computed: {
       },
       methods: {
          validPhone,formattedPhoneNumber,digitsPhoneNumber, 
       },
     });
     app.use(vuetify);
     app.mount('#app')

</script>


template: `
   <rc-phone-field
      v-model="dog"
      :rules="[validPhone]"
      label="My Phone Number"
      clearable>
   </rc-phone-field>
`
*/
const fieldPattern='???-??-????';
const patternChar = '?';

export function digitsSsn(v) {
    return v.replace(/\D/g,'').substring(0,fieldPattern.length);
}
export function validSsn(v) {
    const input = digitsSsn(v);
    return !!(input.length==fieldPattern.length) || 'Invalid SSN';
}

const deleteKeys = ['Backspace','Delete']

const digitKeys = ['0','1','2','3','4','5','6','7','8','9'];
const RIGHT=true;
const LEFT=true;

function isSpotDead(ndx) {
    return ((ndx<0)||(ndx>fieldPattern.length)||(fieldPattern.charAt(ndx) != patternChar));
}
function jumpOffsets() {
    let jumps = [];
    let lastWasGood = false;   
    [...fieldPattern].forEach((c,index)=>{
	if (c == patternChar) {
	    if (!lastWasGood) {
		jumps.push(index);
	    }
	    lastWasGood=true;
	} else {
	    lastWasGood=false;
	}
    });
    return jumps;
}
function nextJumpOffset(n) {
    let ofs = jumpOffsets();
    //first jump point>n
    for (let ndx=0;ndx<ofs.length;ndx++) {
	if (ofs[ndx]>n) return ofs[ndx];
    }
    return ofs[0]; //wrap to first
}
function prevJumpOffset(n) {
    let ofs = jumpOffsets();
    //firt jump point <= n
    for (let ndx=ofs.length-1;ndx>=0;ndx--) {
	if (ofs[ndx]<=n) return ofs[ndx];
    }
    return ofs[ofs.length-1]; //wrap to last
}
function lastGoodSpot(jumpofs) {
    for (let ndx=jumpofs;ndx<fieldPattern.length;ndx++) {
	if (fieldPattern.charAt(ndx) != patternChar) return ndx;
    }
    return fieldPattern.length;
}

function replaceAt(str,index, replacement) {
    if (index >= str.length) {
        return str;
    } 
    return str.substring(0, index) + replacement + str.substring(index + 1);
}

export const RcSsnField = {
    emits: ['update:modelValue'], //Seems only declarative but maybe I should do this.
    props: {
	modelValue: {type: String, default: undefined},
	//modelValue: fieldPattern,
    },

    setup(props,ctx) {

	const modelAttrSet = props.modelValue != undefined;
	const fakeModelValue = ref(null);
	//This is a hack to see if the parent included a v-model="" attr
	//If no v-model is specified in parent then our computed modelValueLocal concept breaks
	//because when we make a change, we emmit but it never circles back through the prop.....
	//see modelValueLocal for more.
	
	const pfield = ref(null);
	const pcursor = ref(0);
	const pkey = ref(null);
	return {
	    modelAttrSet,
	    fakeModelValue,
	    
	    pfield,
	    pcursor,
	    pkey,

	    digitsSsn,
	    validSsn,
	}
    },

    data: function() {
	return {
	}
    },

    computed: {
	//Note, that the model value MUST be fully formed thus the if
	modelValueLocal: {
	    get: function() {
		if (this.modelAttrSet) {
		    if ((this.modelValue==null)||(this.modelValue.length<fieldPattern.length)) return formattedPhoneNumber(this.modelValue);
		    //console.log('REAL');
		    return this.modelValue;
		} else {
		    if ((this.fakeModelValue==null)||(this.fakeModelValue.length<fieldPattern.length)||(this.fakeModelValue.length>fieldPattern.length)) return formattedPhoneNumber(this.fakeModelValue);
		    //console.log('FAKE:',this.fakeModelValue);
		    return this.fakeModelValue;
		}
	    },
	    set: function(value) {
		if (this.modelAttrSet) {
		    this.$emit('update:modelValue',value);
		} else {
		    //SORT OF WORKS but we can get off kilter
		    nextTick(() => {
		    //console.log('NO EMIT:',value);
		    //MUCH WORSE (handing it back to browser first) setTimeout(()=> {
			this.fakeModelValue = value;
		    //},0);
		    });	
		}
	    }
	},
    },

    methods: {

	endAdjust(n) {
	    // determine actual position we want to replace.
	    // (nnn) nnn - nnnn
	    // 0123456789012345
	    if (isSpotDead(n)) return nextJumpOffset(n);
	    return n;	    
	},

	//Set modelValueLocal to val or reset existing if no val (noop) and leave the cursor at position n
	splat(n,val) {
	    if (val) this.modelValueLocal=val;
	    else this.modelValueLocal=this.modelValueLocal.substring(0,16);
	    setTimeout(()=> {
		this.pfield.setSelectionRange(n,n);
	    },0);
	},
	// splat and jump to next good spot or last available good spot 
	jumpSplat(right,curPos,val) {
	    if (!isSpotDead(curPos)) return this.splat(curPos,val); //really do nothing.
	    if (right) return this.splat(nextJumpOffset(curPos),val); //do nothing but position cursor in next jump position.
	    return this.splat(lastGoodSpot(prevJumpOffset(curPos)),val); //do nothing but position cursor at end of previous jump position.
	},

	//NOTE: This is a quickie and relies on a single character change at a time.
	// If timing goes nuts it is possible that we could have missed a key.
	// If I have time I may create a fifo queue of key,cursorPos tuples ro work from rather than
	// this.pkey and this.pfield.selectionStart
	modelUpdated(newVal) {
	    //console.log('J:',jumpOffsets());
	    //console.log('\nmodelUpdated ofs:'+this.pfield.selectionStart+' local['+this.modelValueLocal+'] val['+newVal+']');
	    if ((newVal==null)||(newVal.length==0)) {
		//return this.splat(1,fieldPattern);
		return this.jumpSplat(RIGHT,0,fieldPattern);
	    }
	    if (this.pfield.selectionStart > 16) {
		return this.splat(1);
	    }

	    if (deleteKeys.includes(this.pkey)) {
		// DELETE KEYS
		// When a delete key is hit, the cursor remains where it was in the input field
		// (or put another way nothing was inserted so cursor did not move) and so
		// our 'deleteNdx is just the cursor position.
		// For a 'Delete' leave the cursor where it was.
		// For a 'Backspace' move it left (delete left)
		//   if 'Delete' hit in dead space jump right
		//   if 'Backspace' hit in dead space jump left
		//console.log(this.pkey+' at '+deleteNdx);
		
		let deleteNdx = this.pfield.selectionStart;		
		let deleteVal;
		if (!isSpotDead(deleteNdx)) deleteVal = replaceAt(this.modelValueLocal,deleteNdx,'?');
		this.jumpSplat((this.pkey=='Delete'),deleteNdx,deleteVal);

	    } else {
		// CHARACTER KEYS
		// 
		let inputCursor = this.pfield.selectionStart - 1;
		if (inputCursor<0) inputCursor=0;
		let addedChar = newVal[inputCursor];
		//console.log('  =>',addedChar);
		
		let replaceNdx = this.endAdjust(inputCursor);
		let newCursorPosition = digitKeys.includes(addedChar)?this.pfield.selectionStart:inputCursor;
		//if they inserted a valid char move to current cursor position (set to one past where they typed char).
		//invalid chars, we are actually moving cursor back one.
		let replaceVal;
		if (digitKeys.includes(addedChar)) replaceVal = replaceAt(this.modelValueLocal,replaceNdx,addedChar);
		this.jumpSplat(RIGHT,newCursorPosition,replaceVal); 
	    }
	},
	
	//every time key is pressed, save the key for use above
	keyEvent(evt) {
	    this.pkey = evt.key;
	    //Could build queue.
	    
	},
    },

    
    template: `
      <!--modelAttrSet: {{modelAttrSet}}-->
      <v-text-field
	ref="pfield"
	v-bind="$attrs"
	v-model="modelValueLocal"
	placeholder="fieldPattern"
	@update:model-value="modelUpdated"
	@keydown="keyEvent"	
	>
      </v-text-field>
       
    `,
}
