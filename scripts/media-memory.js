//global variables
var siteUrl, newTime, pushUrl, ready,
loaded = 0, elementNum = 0,
media = new Array();

var mediaObject = function(id, i, type, time){
	if(id){ //if the elements has an id
		this.id = id;
	}else{
		this.id = false;
	}
	this.i = i; //a unique index number
	this.type = type; //type of media (video/audio)
	this.time = time; //the playback time
	this.elementClass = type+i; //a class we'll add for selecting the element later on
	
	this.update = function(elementClass, newTime){
		for (var i = 0; i < media.length; i++){
			if(media[i].elementClass == elementClass){
				media[i].time = newTime;
			}
			if(elementClass == false){
				media[i].time = "00:00";
			}
		}
	}
}


function stripPreviousTime(url){
	return url.split('?')[0];
}


function convertSecondsToMmss(totalSeconds){
	minutes = parseInt(totalSeconds/60) % 60;
	seconds = parseInt(totalSeconds) % 60;
	
	result = (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds  < 10 ? "0" + seconds : seconds);
	return result;
}


function convertMmssToSeconds(mmss){
	mmss = mmss.split(":");
	if(mmss.length == 2){
	    result = 60 * mmss[0] + 1 * mmss[1];
	}else{
	    result = 60 * 60 * mmss[0] + 60 * mmss[1] + 1 * mmss[2];
	}
	return result;
}


function pushState(url){
	var url = url,
	    title = "",
	    state = {
	        address : url
	    };
	window.history.pushState(state, title, url);
}


function mediaPaused(element, i){
	i++; //increase i by 1 to make it more user friendly
	elementID = element.tagName.toLowerCase()+i;
	currentTime = $(".playback-js-"+elementID).get(0).currentTime; //get the media's playback position
	currentTime = convertSecondsToMmss(currentTime); //convert the media's playback position to MM:SS
	relatedElement = element.id;
	if(currentTime != "00:00"){
		pushUrl = "?";
		postData = 0;
		for (var i = 0; i < media.length; i++){ //run a loop for each element
				media[i].update(elementID, currentTime);
				if(media[i].time != "00:00" && media[i].time){
					if(postData > 0){pushUrl = pushUrl + "&"}
					pushUrl = pushUrl + media[i].elementClass + "=" + media[i].time;
					postData++;
				}
		}
		$(".share[rel=\'"+relatedElement+"\']").val(siteUrl + "?"+elementID+"="+currentTime);
		pushState(pushUrl);
	}
}


window.addEventListener('loadedmetadata', wait, true); //this will trigger the initialisation of the script as soon as all media has loadedmetadata


function wait(){
	if(loaded == 0){ //before media elements load, count how many there are
		$('audio, video').each(function(){
			elementNum++;
		})
	}
	loaded++;
	if(loaded == elementNum){ //once all media elements have 'loadedmetadata'…
		ready = true;
		initialise(); //start kicking ass
	}
}


function initialise(){
	getMediaElements(); //find all of the media elements on page	
	getPostData(document.location.href, media.length); //get the post data from the URL and update the media objects
	loadFromMediaObjects(); //set up the media to reflect the post data
}


function getMediaElements(){
	videoi = 0;
	audioi = 0;
	$('audio, video').each(function(i){ //for each media element in the document
		type = $(this).get(0).tagName.toLowerCase(); //work out the element type (audio/video)
		if(type == "video"){
			i = i - audioi; //adjust the i value so it doesn't include audio elements
			$(type).get(videoi).addEventListener('pause',function(){mediaPaused(this, i)},false); //add listeners to the pause buttons on all elements
			videoi++; //we want the index number to start from 1 to be a little more user friendly
			id = $(this).attr('id');
			elementClass = type+videoi;
			$(this).addClass("playback-js-"+elementClass);
			media.push(new mediaObject(id, videoi, type, "00:00")); //save each element as an object	
		}else{
			i = i - videoi; //adjust the i value so it doesn't include video elements
			$(type).get(audioi).addEventListener('pause',function(){mediaPaused(this, i)},false); //add listeners to the pause buttons on all elements
			audioi++; //we want the index number to start from 1 to be a little more user friendly
			id = $(this).attr('id');
			elementClass = type+audioi;
			$(this).addClass("playback-js-"+elementClass);
			media.push(new mediaObject(id, audioi, type, "00:00")); //save each element as an object	
		}
	})
	
}

function getPostData(url, mediaNum){
	url = url.split('?')[1]; //get all of the post data
	
	for (var i = 0; i < mediaNum; i++){ //for each media element…
		elementClass = media[i].elementClass;
		
		media[i].time = "00:00"; //reset all of the times (we'll change them if there's history…)
		
		if(url){
			tempPostData = url.split('&'); //get each separate post data (variable and value)
			for(var j = 0; j < tempPostData.length; j++){
				key = tempPostData[j].split('=')[0]; //the key is the variable before the "="
				value = tempPostData[j].split('=')[1]; //the value is the variable after the "="
				if(key == elementClass){ //if there is post data on this loop...
					media[i].update(key, value); //update the time to reflect the history
				}
			}
		}
	}
}


function loadFromMediaObjects(){
	siteUrl = stripPreviousTime(document.location.href); //get the url excluding the playback time(s)	
	for (var i = 0; i < media.length; i++){ //for each post data found in the url...
		tmpMedia = media[i];
		elementID = $(".playback-js-"+tmpMedia.elementClass).attr("id"); //find which media element the post data variable is related to
		currentTime = tmpMedia.time;
		if(currentTime){
			$(".playback-js-"+tmpMedia.elementClass).get(0).currentTime = convertMmssToSeconds(currentTime);
			if(currentTime == "00:00"){
				$(".share[rel=\'"+elementID+"\']").val(siteUrl);
			}else{
				$(".share[rel=\'"+elementID+"\']").val(siteUrl + "?"+tmpMedia.elementClass+"="+currentTime); //add the playback position to the share input
			}
		}
	}
}


$(".history").click(function(){
	if(ready){
	relatedElement = $(this).attr('rel'); //find which media element the "add to history" button is related to
	elementID = $("#"+relatedElement).attr('class').replace("playback-js-", ""); //get the class we added on doc ready and tidy it up (examples: video1, audio1)
	currentTime = $("#"+relatedElement+".playback-js-"+elementID).get(0).currentTime; //get the media's playback position
	currentTime = convertSecondsToMmss(currentTime); //convert the media's playback position to MM:SS
	
	if(currentTime != "00:00"){
		pushUrl = "?";
		postData = 0;
		for (var i = 0; i < media.length; i++){ //run a loop for each element
				media[i].update(elementID, currentTime);
				if(media[i].time != "00:00" && media[i].time){
					if(postData > 0){pushUrl = pushUrl + "&"}
					pushUrl = pushUrl + media[i].elementClass + "=" + media[i].time;
					postData++;
				}
		}
		$(".share[rel=\'"+relatedElement+"\']").val(siteUrl + "?"+elementID+"="+currentTime); //add the playback position to the share input
		pushState(pushUrl);
	}
	}
});


$(window).bind("popstate", function(){ //if the history has changed (user hit back button etc)
	getPostData(document.location.href, media.length);
	loadFromMediaObjects(); //set up the media to reflect the post data
});


$(window).bind("beforeunload", function(){ //when the window is unloaded...
	if(ready){ //if the media elements have loaded...
		videoi = 0;
		audioi = 0;
		$('audio, video').each(function(i){
			type = $(this).get(0).tagName.toLowerCase(); //work out the element type (audio/video)
			if(type == "video"){
				i = i - audioi; //adjust the i value so it doesn't include audio elements
				videoi++; //we want the index number to start from 1 to be a little more user friendly
				elementID = type+videoi;
			}else{
				i = i - videoi; //adjust the i value so it doesn't include video elements
				audioi++; //we want the index number to start from 1 to be a little more user friendly
				elementID = type+audioi;
			}
			currentTime = $(".playback-js-"+elementID).get(0).currentTime; //get the media's playback position
			currentTime = convertSecondsToMmss(currentTime); //convert the media's playback position to MM:SS
			media[i].time = currentTime;
		});
	}
});


