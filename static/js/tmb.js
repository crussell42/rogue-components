// tmb.js browser module
// e.g. in html do
// Old school straight <script> tag import with namespace tmb.
// var dog=(function {
//    return {
//       
//    }
// })();

/* OJN object literal notation version.
var tmb = (function() {
    var ver = function() {
	return 'TMB LOADED';
    };
    var ver2 = function() {
	return ver()+' PIG';
    };
    return {
	vet: ver,
	ver2: ver2
    }
})();
*/


//IIFE Immediatly Invoked Function Expression Version
//(function(namespace,undefined) {}())
(function(tmb,undefined) {

    // Always return an either [err,data] err is a string.
    tmb.eitherFetch = async function(nurl,data,multipart,method) {
	//console.log('tmb.eitherFetch: nurl:',nurl,' data:',data,' multipart:',multipart,' method:',method);
	try {
	    let options = {
		redirect: 'follow'
	    };

	    if (data) {
		//console.log('CONVERTING TO POST');
		if (method) options.method = method; //Allow   PUT
		else options.method = 'POST';        //Default POST

		if (!multipart) {
		    options.headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		    };
		    options.body = JSON.stringify(data);
		} else {
		    //RAW or multipart data (DO NOT CONVERT TO JSON).
		    //e.g. Since we are setting the body to a FormData object, I believe the
		    // Content-Type is getting set to
		    // 'multipart/form-data'
		    // By the browser as it encounters boundaries
		    // NOT: x-form-urlencoded ot application/json
		    //console.log('multipart/form data in body',options);

		    options.body = data;
		}
	    } else {
		if (method) options.method = method; //Allow   DELETE
		else options.method = 'GET';         //Default GET (redundant)
	    }

	    const res = await fetch(nurl,options,300000);
	    let resObj = null;
	    if (!res.ok) {
		throw'HTTP ERROR: ['+nurl+']['+res.status+'] ['+res.statusText+']';
	    } else {
		try {
		    resObj = await res.json();
		} catch (jperr) {
		    console.log('TEXT:',res.text);
		    throw 'RESPONSE JSON ERROR: '+jperr;
		}
		if (resObj.error) {
		    throw 'RESPONSE CONTAINED ERROR: '+(resObj.error.message?resObj.error.message:(resObj.error?resObj.error:'unknown'));
		}
	    }
	    return [null,resObj]
	} catch (ferr) {
	    console.log('tmb.eitherFetch error:',ferr);
	    return [ferr.toString(),null];
	}
    }
    
    
    ////////////NULL/NaN Related/CONVERSIONS ///////////////
    tmb.nub = function(str) {
	if (str == null) return '';
	return str.trim();
    }

    tmb.isDigitsOnly = function(s) {
	return /^[0-9]*$/.test(s);
    }
    
    //case insensitive test of (a==b, b.includes(a), a.includes(b))
    tmb.looseMatch = function(a,b) {
	let ca = tmb.nub(a).toUpperCase();
	let cb = tmb.nub(b).toUpperCase();
	if (ca == cb) return true;
	if (cb.indexOf(ca)>=0) return true;
	if (ca.indexOf(cb)>=0) return true;
	
	return false;
    },

    

    tmb.forceNumber = function(s) {
	//console.log('forceNumber typeof:'+typeof(s)+' val:'+s);
	if (typeof(s) === 'undefined') return 0;
	if (typeof(s) === 'number') return s;
	if (typeof(s) !== 'string') return NaN;
	let sx = tmb.nub(s);
	let sy = sx.replace(/[^0-9.-]+/g,"");
	//console.log('sx:'+sx+' sy:'+sy);
	
	try {
	    let n = Number(sy);
	    //console.log('n:'+n);
	    return n;
	} catch (err) {
	    return NaN;
	}
    }
    
    tmb.forceNumberOrZero = function(s) {
	let v = tmb.forceNumber(s);
	if (isNaN(v)) return 0;
	return v;
    }
    
    tmb.grokFloat = function grokFloat(sval) {
	if (typeof(sval) != 'string') return sval;
	return (1 * tmb.nub(sval).replace(/[^0-9.-]+/g,""));
    }

    tmb.flattenStringArray = function(arr) {
	let ans = [];
	arr.forEach((ae) => {
	    if (ae) {
		let parts = ae.split(',');
		if (parts) parts.forEach((p) => {ans.push(tmb.nub(p));});
	    }
	});
	return ans;
    }

    
    ///////////NUMBER FORMATTING FUNCTIONS////////////////////
    tmb.moneyStr = function(v) {
	if (v != null) return Number(v).toLocaleString('en-US', {style: 'currency',currency: 'USD'});	
    }
    tmb.commaStr = function(v) {
	if (v != null) return Number(v).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2, useGrouping: true});
    }
    tmb.commaIntStr = function(v) {
	if (v != null) return Number(v).toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0, useGrouping: true});
    }
    tmb.percentStr = function(v) {
	if (v != null) return Number(v).toLocaleString('en-US', {style:'percent'});
    }

    ///////////COLUMN TOTALING FUNCTIONS/////////////////////////////
    tmb.sumFilteredMoneyColumn = function(items,columnName) {
	const tot = items.reduce((acc,itm) => {acc += (1 * _.get(itm,columnName));return acc},0);
	return tmb.moneyStr(tot);
	//const prettyTot = Number(tot).toLocaleString('en-US',{style: 'currency',currency: 'USD'});
	//return prettyTot;
    },
    tmb.sumFilteredColumn = function(items,columnName) {
	const tot = items.reduce((acc,itm) => {acc += (1 * _.get(itm,columnName));return acc},0);
	return tmb.commaStr(tot);
	//const prettyTot = Number(tot).toLocaleString('en-US',{style: 'currency',currency: 'USD'});
	//return prettyTot;
    },

    tmb.sumFilteredIntColumn = function(items,columnName) {
	const tot = items.reduce((acc,itm) => {acc += (1 * _.get(itm,columnName));return acc},0);
	return tmb.commaIntStr(tot);
	//const prettyTot = Number(tot).toLocaleString('en-US', {minimumFractionDigits:0, maximumFractionDigits:0, useGrouping: true});
	//return prettyTot;
    },

    
    ////////////DATE FUNCTIONS///////////////
    // These date functions all try to deal with "Yoda" dates.
    // YODA DATE: A string representatin of a date YYYY-MM-DD
    //
    tmb.isYoda = function(str) {
	if (_.isString(str)) {
	    let parts = str.split('-');
	    if (parts.length != 3) return false;
	    if ((tmb.isDigitsOnly(parts[0]))&&(tmb.isDigitsOnly(parts[1]))&&(tmb.isDigitsOnly(parts[2]))) return true;
		else return false;
	} else return false;
    }

    // df(Date) returns a yyyy-mm-dd string from a Date value.
    // NO ERROR CHECKING SO MAKE SURE Date IS VALID
    // date format 2022-11-01
    tmb.df = function(dv) {
	let month = '' + (dv.getMonth() + 1);
	let day = '' + dv.getDate();
	let year = dv.getFullYear();
	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	return [year, month, day].join('-');
    }

    //Date and time format 2022-11-01 13:59:59
    tmb.datf = function(dv) {
	let ds = tmb.df(dv);
	let h = '' + dv.getHours();
	let m = '' + dv.getMinutes();
	let s = '' + dv.getSeconds();
	if (h.length<2) h = '0'+h;
	if (m.length<2) m = '0'+m;	
	if (s.length<2) s = '0'+s;	
	return ds+' '+h+':'+m+':'+s;
    }
    // mdf(Date) returns a mm-dd string from a Date value.
    // NO ERROR CHECKING SO MAKE SURE Date IS VALID
    // date format 2022-11-01
    tmb.mdf = function(dv) {
	if (_.isString(dv)) return dv;
	let month = '' + (dv.getMonth() + 1);
	let day = '' + dv.getDate();
	//let year = dv.getFullYear();
	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;
	return [month, day].join('-');
    }

    tmb.durationSeconds = function(t1,t2) {
	return Math.round(Math.abs(t1.getTime() - t2.getTime())/1000);
    }
    tmb.durationMinutes = function(t1,t2) {
	return Math.round(tmb.durationSeconds(t1,t2)/60);
    }
    tmb.formatMinutesAsDuration = function(m) {
	let hours = ''+Math.floor(m/60);
	if (hours.length<2) hours = '0'+hours;
	let mins = ''+(m % 60);
	if (mins.length<2) mins = '0'+mins;
	return hours+':'+mins;
    }

    //Ignore this.
    tmb.wccEpoch = function () {
	return '2020-03-01';
    }

    // Given a Date object or a yoda date string, return a yoda date string. Today if no Date passed in.
    tmb.yoda = function (d) {
	let cow = '';
	let dv = null;
	if (!d) {
	    dv = new Date();
	    cow = tmb.df(dv);
	    return (cow);
	} else {
	    
	    if (_.isString(d)) { //assume yoda
		dv = tmb.dateFromYoda(d);
	    } else dv = new Date(d);
	    
	    cow = tmb.df(dv);
	}
	return cow;
    }
    tmb.yodaWithTime = function (d) {
	let cow = '';
	let dv = null;
	if (!d) {
	    dv = new Date();
	    cow = tmb.datf(dv);
	    return (cow);
	} else {
	    dv = new Date(d);
	    cow = tmb.datf(dv);
	}
	return cow;	
    }

    // Given a string yyyy-mm-dd, return a Date object...
    // NO ERROR CHECKING SO CAREFUL.
    tmb.dateFromYoda = function (str) {
	if (!str) str = tmb.yoda();
	if (!tmb.isYoda(str)) return '0000-00-00';

	let parts = str.split('-');
	//if (parts.length != 3) return '0000-00-00';
	let d = new Date(parts[0], parts[1] - 1, parts[2]);
	return d;
    }

    tmb.adjustDayOfDate = function(d,numDays) {
	d = d.setDate(d.getDate() + numDays);
	return d;	
    }
    
    tmb.adjustDayOfDateStr = function (dstr, numDays) {
	let d = tmb.dateFromYoda(dstr);	
	//d = d.setDate(d.getDate() + numDays);
	//return tmb.yoda(d);
	return tmb.yoda(tmb.adjustDayOfDate(d,numDays));
    }

    tmb.adjustToLastDayOfMonth = function (yodaStr) {
	let d = tmb.dateFromYoda(yodaStr);
	let ldom = tmb.getDaysInMonth(d.getMonth() + 1, d.getFullYear());
	d.setDate(ldom);
	return tmb.df(d);
    }
    tmb.adjustToLastDayOfYear = function (yodaStr) {
	let d = tmb.dateFromYoda(yodaStr);
	d.setMonth(11);
	d.setDate(31);
	return tmb.df(d);
    }
    tmb.adjustToFirstDayOfWeek = function(yodaStr) {
	//Assume monday first day of week.
	let d = tmb.dateFromYoda(yodaStr);
	let dow = d.getDay(); //day of week..0=sunday, 6=saturday.
	let diff = d.getDate() - dow + (dow === 0 ? -6 : 1); //1..31 - dow + (dow === 0 ?-6:1)
	d.setDate(diff);
	return tmb.df(d);
    }
    
    tmb.adjustToFirstDayOfMonth = function (yodaStr) {
	let d = tmb.dateFromYoda(yodaStr);
	d.setDate(1);
	return tmb.df(d);
    }
    tmb.adjustToFirstDayOfQuarter = function (yodaStr) {
	let d = tmb.dateFromYoda(yodaStr);
	
	//let qtdStartDate = new Date(endDate);
	let maxQtrMonth = (Math.floor(d.getMonth() / 3)) * 3;
	d.setMonth(maxQtrMonth, 1);
	return tmb.df(d);
    }
    tmb.adjustToFirstDayOfYear = function (yodaStr) {
	let d = tmb.dateFromYoda(yodaStr);
	d.setMonth(0);
	d.setDate(1);
	return tmb.df(d);
    }
    
    tmb.thisMonthDateRange = function() {
	let endDateStr = tmb.yoda();
	let startDateStr = tmb.adjustToFirstDayOfMonth(endDateStr);
	return [startDateStr,endDateStr];
    }
    
    
    tmb.getDaysInMonth = function (month, year) {
	// Here January is 1 based
	//Day 0 is the last day in the previous month
	//THIS IS A HACK.
	return new Date(year, month, 0).getDate();
    }
    
    tmb.percentOfMonth = function (dateStr) {
	let d = tmb.dateFromYoda(dateStr);
	let dim = tmb.getDaysInMonth(d.getMonth() + 1, d.getFullYear());
	let ans = d.getDate() / dim;
	return ans;
    }
    tmb.percentOfMonthRemaining = function (dateStr) {
	let d = tmb.dateFromYoda(dateStr);
	return tmb.percentOfMonthIndexRemaining(d.getFullYear(), d.getMonth(), d.getDate());
	//let dim = tmb.getDaysInMonth(d.getMonth()+1,d.getFullYear());
	//let remainingDays = (dim - d.getDate())+1;
	//let ans = remainingDays/dim;
	//return ans;
    }
    //pass in month index 0..11
    tmb.percentOfMonthIndexRemaining = function (year, monthIndex, day) {
	let dim = tmb.getDaysInMonth(monthIndex + 1, year);
	let remainingDays = (dim - day) + 1;
	let ans = remainingDays / dim;
	return ans;
    }

    //////////// DATE RANGE HANDY FUNCTIONS /////////////////////////////
    // return a 30 day range from today (yoda style) inclusive back or forward in time.
    // e.g. thirtyRange(1) would return [today,today+30days] 
    
    tmb.thirtyRange = function(num) {
	let startStr = null;
	let endStr = null;
	if (num<0) {
	    //So num == -3 should return everything older than 90 days.
	    endStr = tmb.adjustDayOfDateStr(tmb.yoda(),num * 30);
	    startStr = '2020-03-01';
	} else { 
	    let numBack = - ((num * 30)-1);
	    startStr = tmb.adjustDayOfDateStr(tmb.yoda(),numBack);
	    endStr = tmb.adjustDayOfDateStr(startStr,30 - 1);
	}
	return [startStr,endStr];
    }
    ///////////////////////////NAMED DATE RANGES/////////////////////// 
    // Date Range Names...these are always handy when doing metrics and very commonly used..
    
    
    tmb.commonDateRangeNames = ['Today','This Week','Last Week','This Month','This Quarter','This Year','Last 7 days','Last 30 days','Custom'];

    
    tmb.dateRangeFromName = function(dateRangeName) {
	//Always fall back to today.
	//if (!dateRangeName) return;
	//console.log('dateRangeFromName:'+dateRangeName+'  current daterange:'+this.daterange);
	
	let startDate = new Date();
	let endDate = new Date();

	if (!tmb.commonDateRangeNames.includes(dateRangeName)) return [startDate,endDate];
	
	if (dateRangeName.indexOf('This Week')>=0) {
	    startDate = tmb.dateFromYoda(tmb.adjustToFirstDayOfWeek(tmb.yoda(startDate)));
	} else if (dateRangeName.indexOf('Last Week')>=0) {
	    let newStartDateStr = tmb.adjustDayOfDateStr(tmb.adjustToFirstDayOfWeek(tmb.yoda(startDate)),-7);
	    startDate = tmb.dateFromYoda(newStartDateStr);
	    endDate = tmb.dateFromYoda(tmb.adjustDayOfDateStr(newStartDateStr,6));
	} else if (dateRangeName.indexOf('This Month')>=0) {
	    startDate.setDate(1); //set date to first day of month.
	    //console.log('This Month:',startDate,endDate);
	    //console.log('This Month YODA:',tmb.yoda(startDate),tmb.yoda(endDate));
	} else if (dateRangeName.indexOf('This Quarter')>=0) {
	    
	    startDate = new Date(endDate);
	    let maxQtrMonth = (Math.floor(endDate.getMonth()/3)) * 3;
	    startDate.setMonth(maxQtrMonth,1);
	    
	} else if (dateRangeName.indexOf('This Year')>=0) {
	    startDate.setDate(1);
	    startDate.setMonth(0);		
	} else if (dateRangeName.indexOf('Epoch')>=0) {
	    startDate = tmb.dateFromYoda('2020-03-01');
	} else if (dateRangeName.indexOf('Last 7 days')>=0) {
	    startDate = tmb.dateFromYoda(tmb.adjustDayOfDateStr(tmb.yoda(startDate),-6));		
	} else if (dateRangeName.indexOf('Last 30 days')>=0) {
	    startDate = tmb.dateFromYoda(tmb.adjustDayOfDateStr(tmb.yoda(startDate),-29));		
	}
	
	return [startDate,endDate];
    }


    
    
    ////////////////OBJECT/ARRAY FUNCTIONS////////////////////////


    tmb.arr_value_add = function(a1,a2) {
	//console.log('arr_value_add');
	//console.log('a1:'+a1);
	//console.log('a2:'+a2);
	if (a1.length!=a2.length) return null;
	let maxLen = a1.length>a2.length?a1.length:a2.length;
	let ans = [];
	for (let ndx=0;ndx<maxLen;ndx++) {
	    let a1val = (ndx<a1.length)?a1[ndx]:0;
	    let a2val = (ndx<a2.length)?a2[ndx]:0;
	    ans.push((a1val+a2val));
	}
	return ans;
    }
    
    
    tmb.flattenObject = function(o, prefix = '', result = {}, keepNull = true, pathSeperater) {
	if (_.isString(o) || _.isNumber(o) || _.isBoolean(o) || (keepNull && _.isNull(o))) {
	    result[prefix] = o;
	    return result;
	}
	
	if (_.isArray(o) || _.isPlainObject(o)) {
	    //console.log('O:',o);
	    for (let i in o) {
		let pref = prefix;
		if (_.isArray(o)) {
		    pref = pref + `[${i}]`; //condition_tag[0...] splating out like this in probably not what is needed...string, string, string???
		    //pref = pref + `[${i}]`; //condition_tag[0...] splating out like this in probably not what is needed...string, string, string???
		} else {
		    if (_.isEmpty(prefix)) {
			pref = i;
		    } else {
			pref = prefix + (pathSeperater?pathSeperater:'.') + i;
		    }
		}
		tmb.flattenObject(o[i], pref, result, keepNull,pathSeperater);
	    }
	    return result;
	}
	return result;
    }


    tmb.sleep = function(ms) {
	return new Promise(resolve => setTimeout(resolve,ms));
    }



    tmb.replaceAt = function(str,index, replacement) {
	if (index >= str.length) {
            return str;
	} 
	return str.substring(0, index) + replacement + str.substring(index + 1);
    }



    

    // not sure how this worked but it did }(window.tmb = window.tmb || {}));
})(window.tmb = window.tmb || {});
