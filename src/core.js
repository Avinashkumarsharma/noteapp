var note = {};
var render ={};
var map;
//prefixes of implementation that we want to test
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
//prefixes of window.IDB objects
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange
note.init = function (){
	$(document).on('ready', function(){
		$('#geo').hide(1);
		$('#delete').hide(1);
		$('#edit').hide(1);
	});
	if('onhashchange' in window) {
		window.onhashchange = note.loadContent;
	}else alert("Upgrade your browser! Feature not supported");
	//initializing the localStorage
	if(localStorage && !localStorage['id']) {
		//note.clearDB();
		localStorage['id']=1;
	}
	note.initDB();
	}
note.toggleStates = function () {
	$('#title').attr("readonly");
	//$('#delete').css('visibility', 'visible');
	$('#delete').show();
	$('#geo').show();
	$('#edit').show();
	$('#text').attr("readonly");
};
note.loadContent = function (event) {
	$('#save').hide(1);
	$('#update').css('display', 'inline');
	note.toggleStates();
	hash = location.hash.slice(1);
	console.log(hash);
	note.readNote(hash);
};
note.getId = function () {
	if(!localStorage['id']) {
		localStorage['id']=1;
		return 1;
	}
	else
		return localStorage['id'];
};
note.initDB = function (){
	if(!window.indexedDB) {
		alert("Local Storage not supported, update browser");
		return;
	}
	version = 2;
	var request = window.indexedDB.open('notedb', version);
	request.onerror = function(event) {
		console.log("error: ");
	};
	request.onsuccess = function(event) {
		note.db = request.result;
		console.log("Database initialized"+ note.db.objectStoreNames);
		note.listmenu();
		if(!!location.hash)
			note.loadContent();
		};
	request.onupgradeneeded = function(event) {
		console.log('Updrageneeded');
		var db = event.currentTarget.result;
		if(!db.objectStoreNames.contains("note"))
		var objectStore = db.createObjectStore("note", {keyPath: "id"});
	};
};

note.listmenu = function () {
		//console.log("Inside listmenu"+note.db);
        var objectStore = note.db.transaction(['note']).objectStore("note");
        objectStore.openCursor().onsuccess = function(event) {
          var cursor = event.target.result;
          if (cursor) {
                render.updateList(cursor.value);
                cursor.continue();
          }
          else {

          }
        };      
};
note.readNote = function (id) {
		var db = note.db;
		var transaction = db.transaction(["note"]);
        var objectStore = transaction.objectStore("note");
        var request = objectStore.get(id);
        request.onerror = function(event) {
          alert("Unable to retrieve from database!");
        };
        request.onsuccess = function(event) {
          if(request.result) {
          	note.renderNote(request.result);
          } else {
                alert("Couldn't be found in your database!");  
          }
        };
};
note.add = function () {

		var db = note.db;
		data = note.getData();
		//console.log(data);
	 	var request = db.transaction(["note"], "readwrite")
                .objectStore("note")
                .put(data);               
        request.onsuccess = function(event) {
        		localStorage['id']++;
                //alert("New note added!");
                render.updateList(data);

        };
         
        request.onerror = function(event) {
                alert("Unable to add data");   
        }
};
note.update = function () {
		var db = note.db;
		var id = location.hash.slice(1);
		data = note.getData();
		data['id'] = id;
		var request = db.transaction(["note"], "readwrite")
                .objectStore("note")
                .put(data);               
        request.onsuccess = function(event) {
                //alert("Note Updated!");
                render.updateList(data);
        };
         
        request.onerror = function(event) {
                alert("Unable to add data");   
        }


};
note.delete = function () {
	console.log('Trying to delete..');
	var db = note.db;
	var id = location.hash.slice(1);
	if(!!!id) return;
	var request = db.transaction(["note"], "readwrite")
				  .objectStore('note')
				  .delete(id);
	request.onsuccess = function (event) {
		console.log('Deleted');
		//render.updateList(null, id);
	};
	request.onerror = function (event) {
		alert('Error deleting');
	};
};

note.getData = function() {
	var title = $("#title").val();
	var msg = $("#text").val();
	//console.log(msg);
	var id = note.getId();
	var lat = render.geo.lat;
	var lon = render.geo.lon;
	console.log(lon);
	var color = $("#colorpicker").val();
	data = {'id': id, 'title': title, 'msg': msg, 'lat':lat, 'lon':lon, 'color':color};
	//console.log(data);
	return data;
}
note.renderNote= function(data) {
	var title = data.title;
	var msg = data.msg;
	var lat = data.lat;
	var lon = data.lon;
	var color = data.color;
	$('#title').val(title).attr('readonly', 'true');
	$('#text').val(msg).attr('readonly', 'true');
	$('#colorpicker').val(color);
	render.map({'lat': lat, 'lon': lon});
};
 render.updateList = function(data, id){
 	if(data == null && !!id) {
 		$('a[href = "#'+id+'"]').parent().remove();
 		return;
 	}
 	var color = data.color;
 	var id = data.id;
 	var title = data.title;
 	var sel = 'a[href = "#'+id+'"]';
 	if($(sel)[0]) {
 	$(sel).text(title);
 	$(sel).parent().css('border-left', 'solid 5px '+ color);
 	}
 	else {
 		var style = 'style="border-left: solid 5px '+ color + ' "';
 		var li = '<li '+ style +'> <a href="#'+id+'">'+title+'</a></li>';
 		$("#notes").prepend(li);
 	}

 };
note.save = function () {
	$("#sub").click();
}
$('form').submit(function() {
	if($('#save').css('display')=='none')
	return false;
	else{
		$(this).submit();
	}
});
render.geo = function () {
	if(!navigator.geolocation) {
		alert('Geolocation not supported');
		return false;
	}
	console.log('Getting latitude and longitude');
	navigator.geolocation.getCurrentPosition(function (position) {
		console.log('from postion');
		  render.geo.lat = position.coords.latitude;
		 render.geo.lon = position.coords.longitude;
		 //render.map(render.geo);
		 console.log("Lat="+render.geo.lat);
		 console.log("Lon="+render.geo.lon);
	}, function(pe) {
		console.log(pe);
	});	

};
render.map = function(pos) {
	console.log(pos.lat);
	  var mapOptions = {
    zoom: 15,
    center: new google.maps.LatLng(pos.lat, pos.lon)
  };
  map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);
}
render.mapInit = function () {
	var mapOptions = { zoom: 15};
	navigator.geolocation.getCurrentPosition(function (position) {
		console.log(position);
		var geolocate = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		map.setCenter(geolocate);

	},function(pe) {
		console.log(pe);
	});
};
note.init();
$(document).ready(function() {
	render.geo();
	render.mapInit();
});
//content logic
$('#edit').click(function () {
	$('#title').removeAttr("readonly").focus();
	$('#text').removeAttr("readonly");
});
$('#delete').click(function() {
	note.delete();
	x=location.href.indexOf("#");
	url = window.location.href.substr(0,x);
	window.location.href = url;
});