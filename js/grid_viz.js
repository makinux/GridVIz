var ellipsoid = Cesium.Ellipsoid.WGS84;
var imageryUrl = './js/lib/cesium/Source/Assets/Textures/';
var infoValue="";
var cesiumViewer = new Cesium.Viewer('cesiumContainer', {
	timeline: false,
	animation: false,
	homeButton: false,
	geocoder: false,
	baseLayerPicker: false,
	fullscreenButton: true,
	sceneMode: Cesium.SceneMode.SCENE3D
});
var dataSource;
var extendArray = {};
var extendMaxVal = {};
var extendMinVal = {};
var cssColorArray=["#a7dbc7","#d6ea9a","#fff0b1","#ffd9ad","#ffb3d3","#ffffff"];
var getParamArray = getParam();
var cfDataList=[];
var cfDataObj;
var cfDataDimObj={};
var gridData;
var dimHash;
var varHash;
var currentTime;
var currentValName;
var currentValArray=[];
var varCols=getParamArray["varCols"].split(",");
var quartileArray={};
    
var WebGLGlobeDataSource = function(name) {
    //All public configuration is defined as ES5 properties
    //These are just the "private" variables and their defaults.
    this._name = name;
    this._changed = new Cesium.Event();
    this._error = new Cesium.Event();
    this._isLoading = false;
    this._loading = new Cesium.Event();
    this._entityCollection = new Cesium.EntityCollection();
};

Object.defineProperties(WebGLGlobeDataSource.prototype, {
    //The below properties must be implemented by all DataSource instances

    /**
     * Gets a human-readable name for this instance.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {String}
     */
    name : {
        get : function() {
            return this._name;
        }
    },
    /**
     * Since WebGL Globe JSON is not time-dynamic, this property is always undefined.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {DataSourceClock}
     */
    clock : {
        value : undefined,
        writable : false
    },
    /**
     * Gets the collection of Entity instances.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {EntityCollection}
     */
    entities : {
        get : function() {
            return this._entityCollection;
        }
    },
    /**
     * Gets a value indicating if the data source is currently loading data.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Boolean}
     */
    isLoading : {
        get : function() {
            return this._isLoading;
        }
    },
    /**
     * Gets an event that will be raised when the underlying data changes.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Event}
     */
    changedEvent : {
        get : function() {
            return this._changed;
        }
    },
    /**
     * Gets an event that will be raised if an error is encountered during
     * processing.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Event}
     */
    errorEvent : {
        get : function() {
            return this._error;
        }
    },
    /**
     * Gets an event that will be raised when the data source either starts or
     * stops loading.
     * @memberof WebGLGlobeDataSource.prototype
     * @type {Event}
     */
    loadingEvent : {
        get : function() {
            return this._loading;
        }
    }
});

/**
 * Asynchronously loads the GeoJSON at the provided url, replacing any existing data.
 * @param {Object} url The url to be processed.
 * @returns {Promise} a promise that will resolve when the GeoJSON is loaded.
 */
WebGLGlobeDataSource.prototype.loadUrl = function(url) {
    if (!Cesium.defined(url)) {
        throw new Cesium.DeveloperError('url is required.');
    }

    //Create a name based on the url
    var name = Cesium.getFilenameFromUri(url);

    //Set the name if it is different than the current name.
    if (this._name !== name) {
        this._name = name;
        this._changed.raiseEvent(this);
    }

    //Use 'when' to load the URL into a json object
    //and then process is with the `load` function.
    var that = this;
    return Cesium.when(Cesium.loadText(url), function(text) {
        return that.load(text, url);
    }).otherwise(function(error) {
        //Otherwise will catch any errors or exceptions that occur 
        //during the promise processing. When this happens, 
        //we raise the error event and reject the promise. 
        this._setLoading(false);
        that._error.raiseEvent(that, error);
        return Cesium.when.reject(error);
    });
};

/**
 * Loads the provided data, replacing any existing data.
 * @param {Object} data The object to be processed.
 */
WebGLGlobeDataSource.prototype.load = function(data) {
    this._setLoading(true);

    var heightScale = this.heightScale;
    var entities = this._entityCollection;

    entities.suspendEvents();
    entities.removeAll();

    gridData = JSON.parse(data);
    dimHash = gridData["dimHash"];
    varHash = gridData["var"];
    currentTime = gridData["time"][0];
    var n = gridData["dim"].length - 1;
    var defaultVar=varCols[0];
    var pts = new Array(n);
    var cols = new Array(n);
    var utm = "+proj=utm +zone=54";
    var wgs84 = "+proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs";
    for(varName in varCols){
    	extendArray[varCols[varName]]=[];
    }
    for (var i = 0; i < n; ++i) {
        var pt = gridData["dim"][i];
        var varValArray = varHash[currentTime][defaultVar][i].split(" ");
		//var degree=proj4(utm,wgs84,[pt[0], pt[1]]);
        //pts[i] = new Cesium.Cartesian3.fromDegrees(degree[0], degree[1], Math.abs((parseInt(pt[2]))+200));
        pts[i] = Cesium.Cartesian3.fromDegrees(dimHash["lon"][pt[0]],dimHash["lat"][pt[1]], Math.abs(Number(dimHash["p"][pt[2]])));
        
        cols[i] = new Cesium.Color.fromCssColorString(cssColorArray[varValArray[1]]);
        //cols[i].alpha=1;
	    var b = entities.add({
	        position : pts[i],
	        point : {
		        color : cols[i],
		        pixelSize: 20,
		        show: true
	        }
	    });
	    var infoValue="";
	    b.extendIndex = i;
	    var extendVal={};
	    for(timeName in gridData["time"]){
	    	infoValue+="time:"+gridData["time"][timeName];
	    	extendVal[gridData["time"][timeName]]={};
	    	var tmpExtendArray={"time":gridData["time"][timeName],"extendIndex":i};
	        for(varName in varCols){
	        	var varHashTemp = varHash[gridData["time"][timeName]][varCols[varName]][i].split(" ");
		        extendArray[varCols[varName]].push(varHashTemp[0]);
		        tmpExtendArray[varCols[varName]]=parseFloat(varHashTemp[0]);
		        extendVal[gridData["time"][timeName]][varCols[varName]]=[parseFloat(varHashTemp[0]),varHashTemp[1]];
		        infoValue+=","+varCols[varName]+":"+varHashTemp[0];
	        }
	        infoValue+="<br>";
	        //cfDataList.push(tmpExtendArray);
	    }
	    b.description=infoValue;
	    b.extendVal=extendVal;
    }

    //cfDataObj = crossfilter(cfDataList);
    
	var infoBoxModel = cesiumViewer.infoBox.viewModel;
	var viewModel = {
		layers : [],
		selectedLayer : null,
	};
	Cesium.knockout.track(viewModel);
	var toolbar = document.getElementById('toolbar');
	Cesium.knockout.applyBindings(viewModel, toolbar);
	
	
	timeMaxVal=Math.max.apply(null, gridData["time"]);
    timeMinVal=Math.min.apply(null, gridData["time"]);
	$("#slidebar").append("<td><div id='slider-range-time'></div><div id='slider-val-time'></div></td>");
	var timeArray = [];
	for(var i=0;i<gridData["time"].length;i++){
		timeArray.push(parseFloat(gridData["time"][i]));
	}
	var maxVal = parseFloat(timeMaxVal);
	var minVal = parseFloat(timeMinVal);
    var sliderObj = $("#slider-range-time").slider({
		orientation: "vertical",
		//range: "min",
		//values: [timeMinVal,timeMaxVal],
		min: timeMinVal,
		max: timeMaxVal,
		step: Math.abs(maxVal-minVal)/100,
		stop: function( event, ui ) {
			var value = findNearest(ui.value, gridData["time"]);
			sliderObj.slider('value',value);
			$("#slider-val-time").html("TIME:"+value);
			setTime(value);
		}
	});
    $("#slider-val-time").html("TIME:"+minVal);
	$("#slider-range-time").css({float: "left",margin: "20px",height:"250px"});
	$("#slider-val-time").css({clear: "both",margin:"10px",height:"40px",width:"20px"});
	
	for(i in varCols){
		var varName = varCols[i];
		//cfDataDimObj[varName] = cfDataObj.dimension(function(d) { return d[varName]; });
		//var extendArrayLength = extendArray[varName].length;
		//extendArray[varName] = cfDataDimObj[varName].bottom(extendArrayLength, varName);
		//For outlier excluded we were using the quartile.
		extendArray[varName]=extendArray[varName].sort(sortNumber);
	    quartileArray[varName] = quartile(extendArray[varName],[0.1,20,40,60,80,99.9]);
		extendMaxVal[varName]=quartileArray[varName][5];
	    extendMinVal[varName]=quartileArray[varName][0];
	    $("#slidebar").append("<td><div id='slider-range-"+ varName+"'></div><div id='slider-val-"+ varName+"'></div></td>");
		var minVal = parseFloat(extendMinVal[varName]);
		var maxVal = parseFloat(extendMaxVal[varName]);
	    $("#slider-range-"+ varName).slider({
			orientation: "vertical",
			range: true,
			values: [minVal, maxVal],
			min: minVal,
			max: maxVal,
			step: Math.abs(maxVal-minVal)/700,
			slide: function( event, ui ) {
				var varNameTemp=event.target.id.split("-")[2];
				currentValName=varNameTemp;
				$( "#slider-val-"+ varNameTemp).html("MIN:"+ui.values[0]+"<br/>MAX:"+ui.values[1]+"<br/>"+varNameTemp);
				if ($('#rangeQuartile').is(':checked')) {
					setShowRange();
					setRangeQuartile();
				} else {
					setShowRange(quartileArray[currentValName]);
				}
			}
		});
		$("#slider-val-"+ varName).html("MIN:"+extendMinVal[varName]+"<br/>MAX:"+extendMaxVal[varName]+"<br/>"+varName);
		$("#slider-range-"+ varName).css({float: "left",margin: "10px",height:"250px"});
		$("#slider-val-"+ varName).css({clear: "both",margin:"10px",height:"40px",width:"20px"});
	}
	
	// pointsize slider 
	$("#gridsize").append("<div id='slider-range-pointsize'></div><div id='slider-val-pointsize'></div>");
    $("#slider-range-pointsize").slider({
		orientation: "vertical",
		min: 1,
		max: 50,
		step: 1,
		slide: function( event, ui ) {
			$("#slider-val-pointsize").html("SIZE:"+ui.value);
			var pointsList = dataSource.entities.values;
			for(var key in pointsList){
				pointsList[key]._point.pixelSize=ui.value;
			}
		}
	});
	$("#slider-val-pointsize").html("SIZE:1");
	$("#slider-range-pointsize").css({float: "left",margin: "20px",height:"150px"});
	$("#slider-val-pointsize").css({clear: "both",margin:"10px",height:"20px",width:"20px"});
	
	$("#caption").attr("colspan",varCols.length);
	
	currentValName=varCols[0];
	setQuartileColorbar(quartileArray[currentValName]);
	setShowRange(quartileArray[currentValName],true);
	
	$('#rangeQuartile').change(function(){
		if ($(this).is(':checked')) {
			setRangeQuartile();
		} else {
			setQuartileColorbar(quartileArray[currentValName]);
			setShowRange(quartileArray[currentValName],true);
		}
	});
	
	for(var i=0;i<5;i++){
	    $("#q-alpha-"+ i).slider({
			orientation: "horizontal",
			min: 0,
			max: 1,
			value: 1,
			step: 0.1,
			slide: function( event, ui ) {
				var classIndex=event.target.id.split("-")[2];
				setClassAlpha(classIndex,ui.value);
			}
		});
		$("#q-alpha-"+ i).css({clear: "both",margin:"2px",height:"10px",width:"100px"});
	}
		
	
	
    entities.resumeEvents();
    this._changed.raiseEvent(this);
    this._setLoading(false);
};

WebGLGlobeDataSource.prototype._setLoading = function(isLoading) {
    if (this._isLoading !== isLoading) {
        this._isLoading = isLoading;
        this._loading.raiseEvent(this, isLoading);
    }
};

(function () {

	Cesium.InfoBoxViewModel.defaultSanitizer = function(rawHtml){ return rawHtml;};

	var scene = cesiumViewer.scene;
	scene.sunBloom = true;
	scene.skyBox.show = false;

	var infoBoxModel = cesiumViewer.infoBox.viewModel;
	var viewModel = {
		layers : [],
		selectedLayer : null,
	};
	Cesium.knockout.track(viewModel);

	// GeoJSON load
	dataSource = new WebGLGlobeDataSource();
	cesiumViewer.dataSources.add(dataSource);

	var entities;
	var centerNum = 0;
	var cartographicArray = [];
	//dataSource.loadUrl('/readData.py/readData?fileName='+getParamArray["fileName"]+'&dimCols='+getParamArray["dimCols"]+'&varCols='+getParamArray["varCols"]+'&gridStep='+getParamArray["gridStep"]+'&zAdjustment='+getParamArray["zAdjustment"]).then(function() {
	dataSource.loadUrl('/readData.py/readData?fileType='+getParamArray["fileType"]+'&varCols='+getParamArray["varCols"]+'&gridStep='+getParamArray["gridStep"]+'&zAdjustment='+getParamArray["zAdjustment"]).then(function() {
		cesiumViewer.zoomTo(dataSource.entities);
	});
	
}());

// get GET PARAM
function getParam() {
	var vars = [], hash;
	var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
	for(var i = 0; i < hashes.length; i++) {
		hash = hashes[i].split('=');
		vars[hash[0]] = hash[1];
	}
	return vars;
}
function setQuartileColorbar(quartileArray) {
	$('#q1').html(quartileArray[0]+"-"+quartileArray[1]);
	$('#q2').html(quartileArray[1]+"-"+quartileArray[2]);
	$('#q3').html(quartileArray[2]+"-"+quartileArray[3]);
	$('#q4').html(quartileArray[3]+"-"+quartileArray[4]);
	$('#q5').html(quartileArray[4]+"-"+quartileArray[5]);
}

function setQuartileIndex(tmpValue, quartileArray) {
	var rangeIndex=0;
	if(tmpValue <= quartileArray[1]){
		rangeIndex = 0;
	} else if(tmpValue >= quartileArray[1] && tmpValue <= quartileArray[2]){
		rangeIndex = 1;
	} else if(tmpValue >= quartileArray[2] && tmpValue <= quartileArray[3]){
		rangeIndex = 2;
	} else if(tmpValue >= quartileArray[3] && tmpValue <= quartileArray[4]){
		rangeIndex = 3;
	} else if(tmpValue >= quartileArray[4]){
		rangeIndex = 4;
	}
	return rangeIndex;
}

function setRangeQuartile() {
	dataSource.entities.suspendEvents();
	var pointsList = dataSource.entities.values;
	var currentRangeValList={};
	for(varName in varCols){
		currentRangeValList[varCols[varName]]=$("#slider-range-"+ varCols[varName]).slider( "values" );
	}
	//cfDataDimObj[currentValName].filterRange(currentRangeValList[currentValName]);
	//var tempArray = cfDataDimObj[currentValName].bottom(cfDataObj.size(), currentValName);
	currentValArray.sort(sortNumber);
	var quartileVal = quartile(currentValArray,[0.1,20,40,60,80,99.9]);
	setQuartileColorbar(quartileVal);
	for(var key in pointsList){
		if(pointsList[key].show == true){
			var tmpValue = pointsList[key].extendVal[currentTime][currentValName][0];
			var rangeIndex = setQuartileIndex(tmpValue, quartileVal);
			pointsList[key]._point.color = new Cesium.Color.fromCssColorString(cssColorArray[rangeIndex]);
			pointsList[key].extendVal[currentTime][currentValName][1]=rangeIndex;
		} else {
			if(pointsList[key].extendVal)pointsList[key].extendVal[currentTime][currentValName][1]=5;
		}
	}
    dataSource.entities.resumeEvents();
}
function setShowRange(quartileVal) {
	dataSource.entities.suspendEvents();
	currentValArray=[];
	var pointsList = dataSource.entities.values;
	var currentRangeValList={};
	for(varName in varCols){
		currentRangeValList[varCols[varName]]=$("#slider-range-"+ varCols[varName]).slider( "values" );
	}
	for(var key in pointsList){
		var varValArray = {};
		var multiCondBool=true;
		for(varName in varCols){
			varValArray[varCols[varName]] = pointsList[key].extendVal[currentTime][varCols[varName]];
			var currentRangeVal=currentRangeValList[varCols[varName]];
			if(varValArray[varCols[varName]][0]<=currentRangeVal[0] || varValArray[varCols[varName]][0]>=currentRangeVal[1]){
				multiCondBool=false;
			}
		}
		if(multiCondBool){
			pointsList[key].show=true;
			currentValArray.push(pointsList[key].extendVal[currentTime][currentValName][0]);
			if(quartileVal){
				var tmpValue = pointsList[key].extendVal[currentTime][currentValName][0];
				var rangeIndex = setQuartileIndex(tmpValue, quartileVal);
				pointsList[key]._point.color = new Cesium.Color.fromCssColorString(cssColorArray[rangeIndex]);
				pointsList[key].extendVal[currentTime][currentValName][1]=rangeIndex;
			}
		} else {
			pointsList[key].show=false;
		}
	}
    dataSource.entities.resumeEvents();
}
function findNearest(nowVal, valueList) {
	var nearest = null;
	var diff = null;
	for (var i = 0; i < valueList.length; i++) {
	    if ((valueList[i] <= nowVal) || (valueList[i] >= nowVal)) {
	        var newDiff = Math.abs(nowVal - valueList[i]);
	        if (diff == null || newDiff < diff) {
	            nearest = valueList[i];
	            diff = newDiff;
	        }
	    }
	}
	return nearest;
}
function setTime(timeVal) {
	currentTime=timeVal;
	if ($('#rangeQuartile').is(':checked')) {
		setShowRange(quartileArray[currentValName],true);
		setRangeQuartile();
	} else {
		setShowRange(quartileArray[currentValName],true);
	}
}
function setViewClass(classIndex) {
	var pointsList = dataSource.entities.values;
	for(var key in pointsList){
		if(pointsList[key].extendVal[currentTime][currentValName][1]==classIndex){
			if(pointsList[key].show){
				pointsList[key].show=false;
			} else {
				pointsList[key].show=true;
			}
		}
	}
	dataSource.entities.resumeEvents();
}
function setClassAlpha(classIndex,alphaVal) {
	dataSource.entities.suspendEvents();
	var pointsList = dataSource.entities.values;
	for(var key in pointsList){
		if(pointsList[key].extendVal[currentTime][currentValName][1]==classIndex){
			if(pointsList[key].show){
				pointsList[key]._point.color._value.alpha=alphaVal;
			}
		}
	}
	dataSource.entities.resumeEvents();
}
function quartile(array, percentList){
	var quartileArray=[];
	var n=[];
	for(var i=0;i<percentList.length;i++){
		n.push(Math.round(array.length * percentList[i] / 100));
	}
	if(n[n.length-1]==array.length)n[n.length-1]=array.length-1;
	for(var i=0;i<array.length;i++){
		if(n.length>0){
			if(n[0]==i){
				n.shift();
				quartileArray.push(array[i]);
			}
		}
	}
	return quartileArray;
}
var onKeyDown = function(e) {
	if (e.keyCode === '1'.charCodeAt(0)) {
	  setViewClass(0);
	  e.preventDefault();
	}
	if (e.keyCode === '2'.charCodeAt(0)) {
	  setViewClass(1);
	  e.preventDefault();
	}
	if (e.keyCode === '3'.charCodeAt(0)) {
	  setViewClass(2);
	  e.preventDefault();
	}
	if (e.keyCode === '4'.charCodeAt(0)) {
	  setViewClass(3);
	  e.preventDefault();
	}
	if (e.keyCode === '5'.charCodeAt(0)) {
	  setViewClass(4);
	  e.preventDefault();
	}
};
function sortNumber(a,b)
{
return a - b;
}
window.addEventListener('keydown', onKeyDown, false);