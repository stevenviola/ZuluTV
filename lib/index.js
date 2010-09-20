var j=0;
var bc_links = new Array();
var bc_names = new Array();
bc_links[0] = "getRecentShows()";
bc_names[0] = "Home";
var state = {
    "main": {
        "show": function(){
            getRecentShows();
        },
        "scroll": 0
    },
    "series":{
		"show": function(){
			getShow(this.series,this.id,this.seas);
		},
		"scroll": 0
    },
    "search": {
        "show": function(){
			bc_links[1] = "getTVInfo('"+this.name+"','true')";
			bc_names[1] = "Search - "+this.name;
			bc_names.length=2;
			bc_links.length=2;
            getTVInfo(this.name,true);
        },
        "scroll": 0
    }
};

window.onload = function initPage() {
	$("<div id='breadcrumb'></div>").appendTo('#main');
	$("<ul id='gallery'></ul>").appendTo('#main');
	$("<div id='show' class='center'></div>").appendTo('#main');
	displayBreadcrumbs();
	
	if (_.indexOf(bt.stash.keys(), "state") !== -1) {
        $.each(JSON.parse(bt.stash.get("state")), function (context, properties) {
            $.each(properties, function (key, value) {
                state[context][key] = value;
            });
        });
    }
	
	if (_.indexOf(bt.stash.keys(), "context") !== -1) {
        state[bt.stash.get("context")].show();
    } else {
        getRecentShows();
    }	
    $(window).scroll(function () {
        if (bt.stash.get("context") === "main") {
            state.main.scroll = $(window).scrollTop();
            bt.stash.set("state", JSON.stringify(state));
        }
    });
}

function getRecentShows() {
	j=0;
	bt.stash.set("context", "main");
	$("#show").empty();
	$("#gallery").empty();
	$.ajax({
		type: "GET",
		url: "http://ezrss.it/feed/",
		dataType: "xml",
		success: function(rss) {
			$(rss).find('item').each(function(){
				var title = $(this).find('title').text();
				var link = $(this).find('link').text();
				var category = $(this).find('category').text();
				var description = $(this).find('description').text();
				var pos = description.search(';');
				var showName = description.substring(11,pos);
				getTVInfo(showName,false);
			});
		}
	});
};

function getTVInfo(name,search) {
	displayBreadcrumbs();
	$("#show").empty();
	if(search == true) {
		bt.stash.set("context", "search");
		state.search.name = name;
		bt.stash.set("state", JSON.stringify(state));
		$("#gallery").empty();
	}	
	$.ajax({
		type: "GET",
		url: "http://www.thetvdb.com/api/GetSeries.php?seriesname="+name,
		dataType: "xml",
		success: function(xml) {
			$(xml).find('Series').each(function(){
				var SeriesName = $(this).find('SeriesName').text();
				var Overview = $(this).find('Overview').text();
				var id = $(this).find('id').text();
				var id = $(this).find('id').text();
				var imageURL = "http://www.thetvdb.com/banners/_cache/posters/"+id+"-1.jpg";
				var element = document.getElementById("item_"+id);
				if (!element) {
					$("<li class='items' id='item_"+id+"'></li>").html("<img id='poster_"+id+"' class='poster link' title='"+Overview+"' onerror='onImgError(this)' src='"+imageURL+"'/>").appendTo('#gallery');
					$("<div class='title link' id='title_"+id+"'><span id='link_"+id+"'>"+SeriesName+"</span></div>").appendTo("#item_"+id);
					$("<div class='rss link' id='rss_"+id+"'><img class='rssIcon' src='rss15px.gif'/>Subscribe</div>").appendTo("#item_"+id);
					$(".error").remove();
					$("#poster_"+id).click(function() {
						getShow(SeriesName,id,false);
					});
					$("#link_"+id).click(function() {
						getShow(SeriesName,id,false);
					});
					$("#rss_"+id).click(function() {
						var name2 = escape(SeriesName);
						btapp.add.rss_feed("http://www.ezrss.it/search/index.php?show_name="+name2+"&mode=rss&show_name_exact=true");
						btapp.add.rss_filter(SeriesName);
						var filter = btapp.rss_filter.get(SeriesName);
						filter.properties.set("filter", SeriesName);
						filter.properties.set("directory", "/"+escape(SeriesName));
						filter.properties.set("label", "Zulu Downloads");
					});
				}
				if(!search) {
					$(window).scrollTop(state.main.scroll);
					return false;
				}else {
					$(window).scrollTop(state.search.scroll);
				}
			});
		}
	});
}

function getShow(show,id,seas) {
	j=0;
	bt.stash.set("context", "series");
	state.series.series = show;
	state.series.id = id;
	state.series.seas = seas;
    bt.stash.set("state", JSON.stringify(state));
	$("#gallery").empty();
	$("#show").empty();
	$("#albums").mask("", 300);
	var showRating;
	var showRuntime;
	var fanhead;
	var currentSeason=0;
	seas = parseInt(seas);
	show2=escape(show);
	if (!isNaN(seas)) {
		bc_links[3] = ("getShow('"+show+"','"+id+"',"+seas+")");
		bc_names[3] = ("Season "+seas);
		torRSS = "http://www.ezrss.it/search/index.php?show_name="+show2+"&season="+seas+"&mode=rss&show_name_exact=true";
	}else {
		bc_links[2]=("getShow('"+show+"','"+id+"',false)");
		bc_names[2]=(show);
		torRSS = "http://www.ezrss.it/search/index.php?show_name="+show2+"&mode=rss&show_name_exact=true";
	}
	displayBreadcrumbs();
	$("<div id='fanartHeader'></div>").appendTo('#show');
	$("<div id='subscribeButton'></div>").appendTo('#show');
	$("#subscribeButton").append("<div class='rss left link'><img class='rssIcon' src='rss15px.gif'/>Subscribe</div>");
	$("#subscribeButton").click(function() {
		var name2 = escape(show);
		btapp.add.rss_feed("http://www.ezrss.it/search/index.php?show_name="+name2+"&mode=rss&show_name_exact=true");
		btapp.add.rss_filter(show);
		var filter = btapp.rss_filter.get(show);
		filter.properties.set("filter", show);
		filter.properties.set("directory", "/"+escape(show));
		filter.properties.set("label", "Zulu Downloads");
	});
	$("<div id='seasonSelector' class='right'></div>").appendTo('#show');
	setTimeout("getSeasonInfo('"+show+"',"+id+","+currentSeason+");",1500);	
	$("<div id='episodes'></div>").appendTo('#show');
	$.ajax({
		type: "GET",
		url: "http://www.thetvdb.com/api/F25D2C24A0361E28/series/"+id+"/banners.xml",
		dataType: "xml",
		success: function(episode) {
			$(episode).find('Banner').each(function(){
				var BannerPath = $(this).find('BannerPath').text();
				var BannerType = $(this).find('BannerType').text();
				var BannerType2 = $(this).find('BannerType2').text();
				var seasonNum = $(this).find('Season').text();
				/* if (BannerType == 'series' && fanhead == null) {
					fanhead = "<img src='http://www.thetvdb.com/banners/"+BannerPath+"' class='fanart'/>";
				} */
				if (!isNaN(seas)) {
					//$("#fanartHeader").append(seas);
					if ((BannerType =='season') && (BannerType2 == 'seasonwide') && (seasonNum == seas)) {
						$("#fanartHeader").append("<img src='http://www.thetvdb.com/banners/"+BannerPath+"' onerror='onImgError(this)' class='fanart'/>");
						return false;
					}
				}
				//$("#fanartHeader").append("Series");
				if (BannerType == 'series') {
					$("#fanartHeader").append("<img src='http://www.thetvdb.com/banners/"+BannerPath+"' onerror='onImgError(this)' class='fanart'/>");
					return false;
				}				
			});
		}
	});
	//$("<div class='title'>"+torRSS+"</div>").appendTo('#show');
	$.ajax({
		type: "GET",
		url: torRSS,
		dataType: "xml",
		success: function(episode) {
			$(episode).find('item').each(function(){
				var title = $(this).find('title').text();
				var url = $(this).find('link').text();
				var number = processFileName(title);
 				var season = parseInt(getSeason(number));
				var episode = parseInt(getEpisode(number));
				var quality = getQuality(title);
				var group = getGroup(title, quality);
				$(".error").remove();
				getEpisodeInfo(id,season,episode,quality,group,showRuntime,url);
				//$("<div class='title'>Season: "+season+" Episode: "+episode+" - "+title+"</div>").appendTo('#show');
			});
		}
	});
}

function getSeasonInfo(show,id,currentSeason) {
	$("#seasonSelector").append("<span id='season'>Season</span>");
	$.ajax({
		type: "GET",
		url: "http://www.thetvdb.com/api/F25D2C24A0361E28/series/"+id+"/all/en.xml",
		dataType: "xml",
		success: function(series) {
			$(series).find('Series').each(function(){
				showRating = $(this).find('Rating').text();
				showRuntime = $(this).find('Runtime').text();	
			});
			$(series).find('Episode').each(function(){
				var current = $(this).find('SeasonNumber').text();
				if (current != currentSeason) {
					currentSeason = current;
					$("#seasonSelector").append("<span class='seasonItems link' id='season"+current+"'>"+current+"</span>");
					$("#season"+current).click(function() {
						getShow(show,id,current);
					});
				}
			});
		}
	});
}

function getEpisodeInfo(id,season,episode,quality,group,runtime,url) {
	$.ajax({
		type: "GET",
		url: "http://www.thetvdb.com/api/F25D2C24A0361E28/series/"+id+"/default/"+season+"/"+episode+"/en.xml",
		dataType: "xml",
		success: function(series) {
			$(series).find('Episode').each(function(){
				var name = $(this).find('EpisodeName').text();
				var overview = $(this).find('Overview').text();
				var image = $(this).find('filename').text();
				var id = $(this).find('id').text();
				var rating =($(this).find('Rating').text())*10;
				var airDate = $(this).find('FirstAired').text();
				var imageURL = "http://www.thetvdb.com/banners/_cache/"+image;
				var element = document.getElementById("episode_"+id);
				if (!element) {				
					$("<div class='episode' id='episode_"+id+"'></div>").appendTo('#episodes');
					$("<div class='episodeTitle' id='title_"+id+"'></div>").appendTo("#episode_"+id);
					$("#title_"+id).append("<a>Season: "+season+" Episode: "+episode+"</a><a>"+name+"</a>");
					$("#episode_"+id).append("<div id='download_"+id+"' class='download right'><a id='downloadQuality_"+id+"' class='quality'>"+quality+"</a></div>");		
					
					$("#episode_"+id).append("<div id='dl_"+id+"' class='download right' torurl='"+url+"'></div>");
					var widget = new bt.Widget.Download({
						name      : "Dwnld_"+id,
						url       : $("#dl_"+id).attr("torurl"),
						elem      : $("#dl_"+id)[0],
						buttons   : {
						  download  : ['Download',  'Loading\u2026'],
						  play      : ['Play', 'Replay']
						},
						callbacks : {
						  addTorrent  : function(){
							  /* $("#episode_"+id+" img.mainDL").hide(); */
							  var that = this;
							  $(this.elem).progressbar('destroy').empty();
							  this.progressBar = bt.progressManager.createBar({
								id   : that.url,
								elem : that.elem
							  }, (function() {
								var callback = function() {
								  that.callbacks.dispatch('progressBar');
								};
								callback.persona = that;
								return callback;
							  })());
						  },
						  progressBar : function() {
							  /* $("#episode_"+id+" img.mainDL").hide(); */
							  var that = this;
							  $(this.elem).progressbar('destroy').empty();
							  var button = $('<button/>').appendTo(this.elem);
							  button
								.text(sprintf(this.buttons.play[0], this.name))
								.click(function() {
								  $(this).text(sprintf(that.buttons.play[1], that.name));
								  _.values(bt.torrent.get(that.url).file.all())[0].open();
								  // XXX The following callback should be triggered by above open().
								  if ('function' === typeof that.callbacks.openFile) {
									that.callbacks.dispatch('openFile');
								  }
								});
						  }
						}
					});
					
					
					$("#episode_"+id).append("<div id='description_"+id+"' class='optional'></div>");
					$("#description_"+id).append("<img class='thumbnail' src='"+imageURL+"' onerror='onImgError(this)'/>");
					$("#description_"+id).append("<div class='overview'>"+overview+"</div>");
					$("#description_"+id).append("<div id='extra_"+id+"' class='extraInfo right'></div>");
					$("#extra_"+id).append("<div class='rating_bar'><div style='width:"+rating+"%'></div></div>");
					$("#extra_"+id).append("<div class='releaseDate'>"+airDate+"</div>");
					if (quality != null) {
						$("#extra_"+id).append("<div id='quality_"+j+"' class='selectedQuality link'>"+quality+" : "+group+"</div>");
						$("#quality_"+j).click(function() {
							$("#downloadQuality_"+id).empty();
							$("#downloadQuality_"+id).append(""+quality+"");
							$("#extra_"+id).children(".selectedQuality").removeClass("selectedQuality").addClass("unselectedQuality");
							$(this).addClass("selectedQuality");
							$(this).removeClass("unselectedQuality");
							$("#download_"+id).attr("torurl",url);
						});
						j++;
					}
					$("#description_"+id).hide();
					$("#title_"+id).click(function() {
						$("#description_"+id).slideToggle("fast");
						return false;
					});
				}else {
					if (quality != null) {
						$("#extra_"+id).append("<div id='quality_"+j+"' class='unselectedQuality link'>"+quality+" : "+group+"</div>");
						$("#quality_"+j).click(function() {
							$("#downloadQuality_"+id).empty();
							$("#downloadQuality_"+id).append(""+quality+"");
							$("#extra_"+id).children(".selectedQuality").removeClass("selectedQuality").addClass("unselectedQuality");
							$(this).addClass("selectedQuality");
							$(this).removeClass("unselectedQuality");
							$("#dl_"+id).attr("torurl",url);
						});
						j++;
					}
				}
			});
		}
	});
}

function searchShow() {
	$("#gallery").empty();
	$("#show").empty();
	var series = document.srcForm.search.value
	bc_links[1] = "getTVInfo('"+series+"','true')";
	bc_names[1] = "Search - "+series;
	bc_names.length=2;
	bc_links.length=2;
	getTVInfo(series,true);
}

function displayBreadcrumbs() {
	$("#breadcrumb").empty();
	//var link;
	$("#breadcrumb").append("<div id='bcelement' class='link'><a id='bc_0' title='Home'><img src='logo.gif' alt='Zulu' class='home'/> ZULU TV</a></div>");
	$("#bc_0").click(function() {
		bc_names.length=1;
		bc_links.length=1;
		getRecentShows();
	});
	for (var i=1; i<bc_names.length; i++){
		if (typeof(bc_names[i]) != "undefined") {
			$("#breadcrumb").append("<div id='bcelement'><a id='bc_"+i+"'title='"+bc_names[i]+"' class='link'>"+bc_names[i]+"</a></div>");
		}
	}
	if (bc_names.length > 2) {	
		$("#bc_1").click(function() {
			var link1 = bc_links[1];
			bc_names.length=2;
			bc_links.length=2;
			eval(link1);
		});
	}
	if (bc_names.length > 3) {
		$("#bc_2").click(function() {
			var link2 = bc_links[2];
			bc_names.length=3;
			bc_links.length=3;
			eval(link2);
		});
	}
	$("<div id='search' class='right'></div>").appendTo('#breadcrumb');
	$("<form id='searchForm' name='srcForm'></form>").appendTo('#search');
	$("#searchForm").append("<input type='text' name='search' value='Search' id='searchInput'/>");
	$("#searchInput").focus(function() {
		if (this.value=='Search') {
			this.value = '';
		}
	}).blur(function() {
		if( !this.value.length ) {
			this.value = 'Search';
		}
	});
	$("#searchForm").submit(function() {
		searchShow();
		return false;
	});
}

function renderFooter () {
	$("#footer").append("<a id='subscriptions'>Subscriptions</a>");
	$("#subscriptions").append("<div id='subscriptionsList'></div>");
	$("#subscriptionsList").hide();
	$("#subscriptions").click(function() {
		populateSubscriptions();
		$('#subscriptionsList').slideToggle("fast");
	});
}

function populateSubscriptions() {
	$("#subscriptionsList").empty();
	$("#subscriptionsList").append("<span>Hello World</span>");
	var rssFeedKeys = btapp.rss_feed.keys();
	for (var i=0; i < rssFeedKeys.length; i++) {
		var key = rssFeedKeys[i];
		$("#subscriptionsList").append("<p>"+key+"</p>");
	}
}

function processFileName(name) {
	var pattern=/[0-9]+x[0-9]+/g;
	var info=pattern.exec(name);
	return info;
}

function getSeason (number){
	var num = String(number);
	var pos = num.search('x');
	var season = num.substring(0,pos);
	return season;
}

function getEpisode (number){
	var num = String(number);
	var pos = num.search('x');
	var episode = num.substring(pos+1);
	return episode;
}

function getQuality (title){
	var pattern=/WS - DSR |WS - DSRIP |720p - HDTV |HDTV |DSR |720p |PDTV |DSRIP |HRHD |DVDSCR |HRHD /gi;
	var quality=pattern.exec(title);
	return quality;
}

function getGroup(title, quality) {
	quality = String(quality);
	var pos = title.search(quality);
	var len = quality.length;
	var group = title.substring(pos+len+2);
	var len2 = group.length;
	group = group.substring(0,len2-1);
	return group;
}

function onImgError(source) {
  source.src = "/img/missing.jpg";
  // disable onerror to prevent endless loop
  source.onerror = "";
  return true;
}