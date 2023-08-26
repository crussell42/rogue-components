import {ref,reactive, computed, nextTick} from 'vue'

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
//let instanceFieldPattern='???';
const patternChar = '?';



const deleteKeys = ['Backspace','Delete']

const digitKeys = ['0','1','2','3','4','5','6','7','8','9'];
const RIGHT=true;
const LEFT=true;


export const RcPatternField = {
    //export default {
    //Hack that allows RcPatternField.formattedPattern() from parent instead of Refs or 
    damnit: function() {
	console.log('DAMNIT');
    },
    
    name: 'RcPatternField',
    emits: ['update:modelValue'], //Seems only declarative but maybe I should do this.
    props: {
	fieldPattern: {type: String,
		       default: '???',
		      },
	modelValue: {type: String,
		     default: undefined,
		    },
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

	//METHODS TO EXPORT.

	//Given a pattern check if an offset falls on a dead (non typable) spot ??deadspots?? if patternChar is ?
	function isSpotDead(ndx) {
	    //console.log('isSpotDead:',ndx);
	    return ((ndx<0)||(ndx>props.fieldPattern.length)||(props.fieldPattern.charAt(ndx) != patternChar));
	}

	
	//Given pattern (???) ??? - ???? return array of jump offsets [1,6,12]
	// jump spots    ^    ^     ^ 
	const jumpOffsets = computed(()=>{
	    let jumps = [];
	    let lastWasGood = false;   
	    [...props.fieldPattern].forEach((c,index)=>{
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
	});

	//given an offset, where is the next available non-dead spot.
	function nextGoodSpot(curSpot) {
	    let testSpot = curSpot+1;
	    while (testSpot<props.fieldPattern.length) {
		if (props.fieldPattern.charAt(testSpot)==patternChar) return testSpot;
		testSpot += 1;
	    }
	    return 0;
	}
	//just exxtracts didgits
	//TODO should extract only chars from the pattern...maybe not digits.	
	function extractPattern(v) {
	    return v.replace(/\D/g,'').substring(0,props.fieldPattern.length);
	}
	function formatPattern(v) {
	    let cs = extractPattern(v);
	    let ans = props.fieldPattern;
	    let ansNdx = -1;
	    for (let ndx=0;ndx<cs.length;ndx++) {
		let c = cs[ndx];
		ansNdx = nextGoodSpot(ansNdx);
		ans = tmb.replaceAt(ans,ansNdx,c);
	    }
	    //console.log('formatPattern:',ans);
	    return ans;
	}
	function validLen() {
	    let ans=0;
	    [...props.fieldPattern].forEach((c) => {
		if (c == patternChar) ans++;
	    });
	    return ans;
	}
	function validPattern(v) {
	    const input = extractPattern(v);
	    //console.log('input['+input+'] pattern len:'+instanceFieldPattern.length);
	    return !!(input.length==validLen()) || 'Invalid';
	}
	
	return {
	    modelAttrSet,
	    fakeModelValue,
	    
	    pfield,
	    pcursor,
	    pkey,

	    jumpOffsets,
	    isSpotDead,
	    jumpOffsets,
	    nextGoodSpot,
	    
	    validPattern,
	    extractPattern,
	    formatPattern,
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
		    //console.log('REAL ['+this.modelValue+']');
		    if ((this.modelValue==null)||
			(this.modelValue.length<this.fieldPattern.length))
			return this.formatPattern(this.modelValue);
		    //if you just always return this.formatPattern(this.modelValue) deletes pull everything left
		    //Which you may prefer.
		    return this.modelValue;
		} else {
		    if ((this.fakeModelValue==null)||(this.fakeModelValue.length<this.fieldPattern.length)||(this.fakeModelValue.length>this.fieldPattern.length)) return this.formatPattern(this.fakeModelValue);
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

	mDamnit() {
	    console.log('mDamnit');
	},
	endAdjust(n) {
	    // determine actual position we want to replace.
	    // (nnn) nnn - nnnn
	    // 0123456789012345
	    if (this.isSpotDead(n)) return this.nextJumpOffset(n);
	    return n;	    
	},

	//given an offset, find next available jump spot past current position.
	nextJumpOffset(n) {
	    let ofs = this.jumpOffsets;
	    //first jump point>n
	    for (let ndx=0;ndx<ofs.length;ndx++) {
		if (ofs[ndx]>n) return ofs[ndx];
	    }
	    return ofs[0]; //wrap to first
	},
	//given offset find previous jump spot
	prevJumpOffset(n) {
	    //console.log('prevJumpOffset:',n);
	    let ofs = this.jumpOffsets;
	    //firt jump point <= n
	    for (let ndx=ofs.length-1;ndx>=0;ndx--) {
		if (ofs[ndx]<=n) {
		    return ofs[ndx];
		}
	    }
	    return ofs[ofs.length-1]; //wrap to last
	},
	lastGoodSpot(jumpofs) {
	    for (let ndx=jumpofs;ndx<this.fieldPattern.length;ndx++) {
		if (this.fieldPattern.charAt(ndx) != patternChar) return ndx;
	    }
	    return this.fieldPattern.length;
	},
	prevGoodSpot(ofs) {
	    if (ofs<=0) return this.fieldPattern.length;
	    for (let ndx=ofs;ndx>=0;ndx--) {
		if (this.fieldPattern.charAt(ndx) == patternChar) return ndx;
	    }
	    return this.fieldPattern.length-1;	    
	},

	setPos(n) {	    
	    setTimeout(()=> {
		this.pfield.setSelectionRange(n,n);
	    },0);	    
	},
	
	//Set modelValueLocal to val or reset existing if no val (noop) and leave the cursor at position n
	splat(n,val) {
	    if (val) this.modelValueLocal=val;
	    else this.modelValueLocal=this.modelValueLocal.substring(0,this.fieldPattern.length);
	    this.setPos(n);
	},

	// splat and jump to next good spot or last available good spot 
	//jumpSplat(right,curPos,val) {
	//    if (!this.isSpotDead(curPos)) return this.splat(curPos,val); //really do nothing.
	//    if (right) return this.splat(this.nextJumpOffset(curPos),val); //do nothing but position cursor in next jump position.
	//    return this.splat(this.lastGoodSpot(this.prevJumpOffset(curPos)),val); //do nothing but position cursor at end of previous jump position.
	
	jumpSplat(right,curPos,val) {
	    //console.log('curPos:',curPos);
	    let computedPos=curPos;
	    if (this.isSpotDead(curPos)) {		
		if (right) {
		    computedPos = this.nextGoodSpot(curPos);
		}
		else computedPos = this.lastGoodSpot(this.prevJumpOffset(curPos));
	    } else {
		if (!right) computedPos = this.prevGoodSpot(curPos);
	    }
	    this.splat(computedPos,val);
	},

	

	//NOTE: This is a quickie and relies on a single character change at a time.
	// If timing goes nuts it is possible that we could have missed a key.
	// If I have time I may create a fifo queue of key,cursorPos tuples ro work from rather than
	// this.pkey and this.pfield.selectionStart
	modelUpdated(newVal) {
	    //console.log('J:',jumpOffsets());
	    //console.log('\nmodelUpdated selectStart:'+this.pfield.selectionStart+' local['+this.modelValueLocal+'] val['+newVal+']');
	    if ((newVal==null)||(newVal.length==0)) {
		return this.jumpSplat(RIGHT,0,this.fieldPattern);
	    }
	    if (this.pfield.selectionStart > this.fieldPattern.length) {
		return this.jumpSplat(RIGHT,0);
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
		if (!this.isSpotDead(deleteNdx)) deleteVal = tmb.replaceAt(this.modelValueLocal,deleteNdx,'?');
		this.jumpSplat((this.pkey=='Delete'),deleteNdx,deleteVal);

	    } else {
		// CHARACTER KEYS
		// 
		let inputCursor = this.pfield.selectionStart - 1;
		if (inputCursor<0) inputCursor=0;

		let addedChar = newVal[this.pfield.selectionStart==0?this.pfield.selectionStart:this.pfield.selectionStart-1];
		//console.log('  addedChar=>',tmb.nub(addedChar));
		    
		let replaceNdx = this.endAdjust(inputCursor);
		let newCursorPosition=digitKeys.includes(addedChar)?this.nextGoodSpot(replaceNdx):this.nextGoodSpot(inputCursor);
		    
		//if they inserted a valid char move to current cursor position (set to one past where they typed char).
		//invalid chars, we are actually moving cursor back one.
		let replaceVal;
		if (digitKeys.includes(addedChar)) replaceVal = tmb.replaceAt(this.modelValueLocal,replaceNdx,addedChar);
		else newCursorPosition = inputCursor
		//console.log('      newCursorPosition:',newCursorPosition);
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
