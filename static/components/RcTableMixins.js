export const RcTableMixins = {

    methods: {
	/* Below are the RcTable filter methods...Normally, 
	   I would have these methods in a mixin since they are common accross components that use the RcTable component.
	*/
	
	mapVisibleColumnValues(item) {
	    let vs = this.visibleHeaders.map((vh) => {
		return _.get(item,vh.key);
	    }).filter((v)=> { return ((v!=undefined)&&(v!=null)&&(v.toString().length>0)) }).map((v)=>{return v.toString().toLowerCase()});
	    return vs;
	},	
	searchFilterReduce (value, search, rawitem) {
	    //console.log('searchFilterReduce:',value,' search:',search,' rawitem:',rawitem);
	    if ((!value)&&(tmb.nub(search).length>0)) {
		let showRow = this.mapVisibleColumnValues(rawitem).join(',').indexOf(search.toLowerCase())>=0;
		return showRow;
	    } else return true;
	},
	// for every row, -OR- test every selected filter.
	rowFilterReduce(items,selectOptions,rowFilters) {
	    
	    let ans = items;
	    if (selectOptions.length>0) {
		ans = ans.filter((i) => {
	    	    return selectOptions.reduce((showRow,option) => {
			//filterObj is an option object from a select so we need to get the actual filterObject
			let filterKey = option.value;
			let fo = rowFilters(this)[filterKey];
			if (fo) {
			    //console.log('FO:',fo);
			    if (_.isFunction(fo)) return (showRow || rowFilters(this)[filterKey](i));
			    else {
				console.log('rowFilterReduce filterKey:',filterKey);
				return (showRow || rowFilters(this)[filterKey].func(i));
			    }
			} else return showRow;
	    	    },false);
	    	});		
	    }
	    return ans;
	},
	
	// Column filters are a little different...they get pushed out as "filterActions" by RcTable and should
	// be self contained instructions on how to filter....then we interprut those instructions here.
	//
	// See RcColumnFilter for full story on what a FilterAction can include
	// Inverted, for every filter, filter all the rows (so I guess that makes it an AND test).
	// Could or should turn into a reduce call and fail fast on first 'false'
	// e.g. row 0 check col filter 0,1,2,3 until a false is found. If no false show the row. (LOGICAL AND)
	columnFilterReduce(items,selectedFilters) {
	    let ans = items;
	    
	    selectedFilters.forEach((filterAction) => {
		//console.log('filterAction:',filterAction);
		let head = this.visibleHeaders.find((vh) => (vh.key == filterAction.cname));		
		if (head) {
		    let valDataType = 'string';
		    if (head.columnfilter.hasOwnProperty('dataType')) valDataType = head.columnfilter.dataType;
		    
		    ans = ans.filter((i) => {
			let val = _.get(i,filterAction.cname);			
			let shouldInclude = true;
			let shouldExclude = false;
			if (valDataType == 'string') {
			    //DEFAULT CASE WHEN NOT DEFINED IN columnfilter definition.
			    
			    if (head.columnfilter.arrayfield) {
				if (!val) val = [];
				//For array fields, the value will be an array.
				//e.g. ['developer','manager','accountant']
				//In this case we only want to see if some value in the includeValues matches any of the elements in the val array
				shouldInclude = ((filterAction.includeValues)&&(filterAction.includeValues.length>0))?filterAction.includeValues.some(sv => val.includes(sv)):true;
				shouldExclude = ((filterAction.excludeValues)&&(filterAction.excludeValues.length>0))?filterAction.excludeValues.some(sv => val.includes(sv)):false;
			    } else {
				//Assuming val is a straight string
				//this.selectedNames.some(sn => sn == val);
				shouldInclude = ((filterAction.includeValues)&&(filterAction.includeValues.length>0))?filterAction.includeValues.some(sv => sv == val):true;
				shouldExclude = ((filterAction.excludeValues)&&(filterAction.excludeValues.length>0))?filterAction.excludeValues.some(sv => sv == val):false;
			    }
			    //console.log('inc:'+shouldInclude+' exc:'+shouldExclude);
			} else if (valDataType == 'date') {
			    //head has the full column filter in it.
			    if ((filterAction.includeValues)&&(filterAction.includeValues.length>0)) {
				shouldInclude = filterAction.includeValues.reduce((showRow,includeValue)=>{
				    let farr = head.columnfilter.ranges.filter((r) => {
					return r.name == includeValue
				    });
				    if ((farr)&&(farr.length>0)) {
					return showRow || this.dateRangeOp(val,farr[0].ops,farr[0].range);
				    } else return false;
				    
				},false);
			    }
			    if ((filterAction.excludeValues)&&(filterAction.excludeValues.length>0)) {
				shouldExclude=filterAction.excludeValues.reduce((showRow,excludeValue)=>{
				    let excludeRangeDefs = head.columnfilter.ranges.filter((rd) => {
					return rd.name == excludeValue
				    });
				    if ((excludeRangeDefs)&&(excludeRangeDefs.length>0)) {
					let excludeRangeDef = excludeRangeDefs[0];
					return showRow || this.dateRangeOp(val,excludeRangeDef.ops,excludeRangeDef.range);
				    } else return false;

				    /*
				    if (excludeValue == '1..30 Days') {
					return showRow || ((val >= range1[0]) && (val <= range1[1]));
				    } else if (excludeValue == '31..60 Days') {
					return showRow || ((val >= range2[0]) && (val <= range2[1]));
				    } else if (excludeValue == '61..90 Days') {
					return showRow || ((val >= range3[0]) && (val <= range3[1]));
				    } else if (excludeValue == 'Over 90 Days') {
					return showRow || (val < range3[0]);
				    } else return showRow || false;
				    */
				},false);
			    }
			    
			    //console.log('shouldInclude ['+shouldInclude+'] shouldExclude ['+shouldExclude+']   ans=>'+((shouldInclude) && (!shouldExclude)));
			}
			
			return ((shouldInclude) && (!shouldExclude));
		    });
		}
	    });		  
	    return ans;
	},

	//Should go ahead and create a reverse polish notation (infix,prefix) processor using eval but this is just a example
	dateRangeOp(val,op,range) {
	    //console.log('val['+val+'] op['+op+'] range:',range);
	    if (op == 'inclusive-range') {
		if ((val>=range[0])&&(val<=range[1])) return true;
	    } else if (op == 'lt') {
		return val<range[0];
	    } else if (op == 'lte') {
		return val<=range[0];
	    } else if (op == 'gt') {
		return val>range[0];
	    } else if (op == 'gte') {
		return val>=range[0];
	    } else return false;
	},

	
    },
}
