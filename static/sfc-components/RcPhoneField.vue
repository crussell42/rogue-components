<template>
      <!--modelAttrSet: {{modelAttrSet}}-->
      <v-text-field
	ref="pfield"
	v-bind="$attrs"
	v-model="modelValueLocal"
	placeholder="phoneFieldPattern"
	@update:model-value="modelUpdated"
	@keydown="keyEvent"	
	>
      </v-text-field>
</template>

<script>
import {ref,reactive, nextTick} from 'vue'

export function digitsPhoneNumber(v) {
    return v.replace(/\D/g,'').substring(0,10);
}
export function validPhone(v) {
    const input = digitsPhoneNumber(v);
    return !!(input.length==10) || 'Invalid Phone Format';
}
export function	formattedPhoneNumber(newval) {
    if (newval==null) return phoneFieldPattern;
    const input = newval.replace(/\D/g,'').substring(0,10);    
    const ac = input.substring(0,3).padEnd(3,'?');
    const pre = input.substring(3,6).padEnd(3,'?');
    const suf = input.substring(6,10).padEnd(4,'?');
    return `(${ac}) ${pre} - ${suf}`;
}
const deleteKeys = ['Backspace','Delete']

const digitKeys = ['0','1','2','3','4','5','6','7','8','9'];
const patternChar = '?';
const phoneFieldPattern = '(???) ??? - ????';
const RIGHT=true;
const LEFT=true;

function isSpotDead(ndx) {
    return ((ndx<0)||(ndx>phoneFieldPattern.length)||(phoneFieldPattern.charAt(ndx) != patternChar));
}
function jumpOffsets() {
    let jumps = [];
    let lastWasGood = false;   
    [...phoneFieldPattern].forEach((c,index)=>{
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
    for (let ndx=jumpofs;ndx<phoneFieldPattern.length;ndx++) {
	if (phoneFieldPattern.charAt(ndx) != patternChar) return ndx;
    }
    return phoneFieldPattern.length;
}

function replaceAt(str,index, replacement) {
    if (index >= str.length) {
        return str;
    } 
    return str.substring(0, index) + replacement + str.substring(index + 1);
}

//export const RcPhoneField = {
export default {
    emits: ['update:modelValue'], //Seems only declarative but maybe I should do this.
    props: {
	modelValue: {type: String, default: undefined},
	//modelValue: phoneFieldPattern,
    },

    setup(props,ctx) {

	const modelAttrSet = props.modelValue != undefined;
	const fakeModelValue = ref(phoneFieldPattern);
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

	    digitsPhoneNumber,
	    validPhone,
	    formattedPhoneNumber,
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
		    if ((this.modelValue==null)||(this.modelValue.length<phoneFieldPattern.length)) return formattedPhoneNumber(this.modelValue);
		    //console.log('REAL');
		    return this.modelValue;
		} else {
		    if ((this.fakeModelValue==null)||(this.fakeModelValue.length<phoneFieldPattern.length)||(this.fakeModelValue.length>phoneFieldPattern.length)) return formattedPhoneNumber(this.fakeModelValue);
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
		return this.splat(1,phoneFieldPattern);
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

    
}
</script>