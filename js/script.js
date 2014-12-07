var viewModel = new mapViewModel();

ko.applyBindings(viewModel);

// An object that contains data and functionality of a point on the map
function point(name, lat, long, address, icon, map) {
    this.name = name;
    this.lat = lat;
    this.long = long;
    this.address = address;
    this.map = map;
    this.icon = icon;
    this.display = ko.observable(true);
	this.marker = new google.maps.Marker({
        position: new google.maps.LatLng(this.lat, this.long),
        title: this.name,
        map: this.map,
        draggable: false,
        visible: this.display(),
        icon: this.icon
    });
    this.infowindow = new google.maps.InfoWindow({
		content: '<div class="infowindow">' + name + '</div>'
	});
	// Animates marker for two bounces
	this.animateMarker = function() {
		var marker = this.marker;
		marker.setAnimation(google.maps.Animation.BOUNCE);
		window.setTimeout(function() {
			marker.setAnimation(null);
			},1450);
	};
	// Handles point being selected
	this.pointSelected = function() {
		this.map.panTo(new google.maps.LatLng(this.lat, this.long));
		this.animateMarker();
		viewModel.closeInfoWindows();
		this.infowindow.open(this.map,this.marker);
		viewModel.selection(this);
		viewModel.wikiArticles([]);
		viewModel.wikiError(false);
 		var wikiUrl = "http://en.wikipedia.org/w/api.php?action=opensearch&search=" + this.name + "&format=json&callback=wikiCallback";
		var wikiRequestTimeout = setTimeout(function(){
			viewModel.wikiError(true);
		}, 8000);
		$.ajax({
			url: wikiUrl,
			dataType: "jsonp",
			success: function( response ) {
				var articleList = response[1];
				for (var i = 0; i < articleList.length; i++) {
					articleStr = articleList[i];
					viewModel.wikiArticles.push(new wikiArticle(articleStr));
				};
				clearTimeout(wikiRequestTimeout);
			}
		});
	}
	// Displays marker if point is displayed, otherwise hides it
	this.updateMarker = function() {
		if (this.display()) {
			this.marker.setVisible(true);
		} else {
			this.marker.setVisible(false);
		}
	};

}

// An object that contains data for a Wikipedia article
function wikiArticle(name) {
	this.name = name;
	this.url = 'http://en.wikipedia.org/wiki/' + name;
}

// The View Model object
function mapViewModel() {
	var self = this;
	
	// Options for map
	self.mapOptions = {
		center: { lat: 33.8151359, lng: -84.3227593},
		zoom: 15,
		draggable: true,
		disableDefaultUI: true
	};
	
	// The actual Map
	self.map = new google.maps.Map(document.getElementById('map-canvas'), self.mapOptions);
	
	// List of icons
	self.icons = {
		restaurant : "images/restaurant.png",
		synagogue : "images/synagogue.png",
		coffeehouse : "images/coffee_house.png",
		bar : "images/bar.png",
		snackBar : "images/snack_bar.png",
		snowflake : "images/snowflake_simple.png",
		school : "images/school.png",
		tree : "images/tree.png",
		shopping : "images/shopping.png",
		groceryStore : "images/grocery_store.png",
		convenienceStore : "images/convenience_store.png",
		salon : "images/salon.png",
		mechanic : "images/mechanic.png",
		gas : "images/gas.png",
		lodging : "images/lodging.png",
		mail : "images/mail.png"
	}
    
    // The search query typed in by the user
    self.searchQuery = ko.observable("");
	
	// List of Points to be displayed on the map
    self.points = ko.observableArray([
        new point('Congregation Beth Jacob', 33.8159738, -84.3259048, '1855 Lavista Rd NE', self.icons.synagogue, self.map),
        new point('Post Briarcliff', 33.816047, -84.3300573, '500 Briarvista Way NE', self.icons.lodging, self.map),
        new point('Kroger Super Market', 33.8158, -84.3139, '2205 Lavista Rd NE', self.icons.groceryStore, self.map),
        new point('Broadway Cafe', 33.8167968, -84.3343103, '2157 Briarcliff Rd NE', self.icons.restaurant, self.map),
        new point('Chai Peking', 33.815667, -84.313819, '2205 Lavista Rd NE', self.icons.snackBar, self.map),
        new point('Judaica Corner', 33.8172078, -84.3346001, '2185 Briarcliff Rd NE', self.icons.shopping, self.map),
        new point('Pita Palace', 33.8163302, -84.3340061, '1658 Lavista Rd NE', self.icons.snackBar, self.map),
        new point('Publix Super Market', 33.8135395, -84.3113408, '2969 North Druid Hills Rd NE', self.icons.groceryStore, self.map),
        new point('The Spicy Peach', 33.8163248, -84.3125722, '2887 N Druid Hills Rd', self.icons.convenienceStore, self.map),
        new point('Young Israel', 33.8160485, -84.317458, '2056 Lavista Rd', self.icons.synagogue, self.map),
        new point('Calibre Woods', 33.815267, -84.3169105, '2075 Lavista Rd', self.icons.lodging, self.map),
        new point('Bruster\'s Real Ice Cream', 33.815696, -84.3162918, '2095 Lavista Rd NE', self.icons.snowflake, self.map),
        new point('The UPS Store', 33.8165384, -84.3125984, '2897 North Druid Hills Rd NE', self.icons.mail, self.map),
        new point('Famous Pub & Sports Palace', 33.8140403, -84.3114457, '2947 North Druid Hills Rd NE', self.icons.bar, self.map),
        new point('Dunkin\' Donuts', 33.817850, -84.312763, '2827 North Druid Hills Rd NE', self.icons.coffeehouse, self.map),
        new point('Starbucks', 33.818492, -84.312334, '2826 N Druid Hills Rd', self.icons.coffeehouse, self.map),
        new point('QuikTrip', 33.8069798, -84.3361773, '1836 Briarcliff Rd NE', self.icons.gas, self.map),
        new point('Supercuts', 33.8156212, -84.3131197, '2205 Lavista Rd NE', self.icons.salon, self.map),
        new point('Torah Day School', 33.8143105, -84.3221496, '1985 Lavista Rd NE', self.icons.school, self.map),
        new point('Elwyn John Wildlife Sanctuary', 33.8231168, -84.3259722, 'Elwyn John Wildlife Sanctuary', self.icons.tree, self.map),
        new point('Jiffy Lube', 33.8158747, -84.3352847, '2138 Briarcliff Rd NE', self.icons.mechanic, self.map),
        new point('Whole Foods Market', 33.815834, -84.3332098, '2111 Briarcliff Rd', self.icons.groceryStore, self.map)]);
    
    // Sort points based on their names
    self.points().sort(function(left, right) { return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1) });
    
    // The selected Point. Start with "dummy" Point. 
    self.selection = ko.observable(new point('Select a location for more information.', 0, 0, ''));
    
    // The streetView url for selected Point	
    self.streetView = ko.computed(function() {
    		if (self.selection().address != "") {
    			return "https://maps.googleapis.com/maps/api/streetview?size=250x150&location=" + self.selection().name + " " + self.selection().address + " Atlanta, GA 30329";
    		} else {
    			return "";
    		}
    	});
    
    // Stores related Wikipedia articles
    self.wikiArticles = ko.observableArray([]);
    
    // Boolean if there is an error calling Wikipedia API or not
    self.wikiError = ko.observable(false);
    
    // Updates all Points' display property based on user's search query
    self.updatePoints = function() {
    	$.each(self.points(), function(i, point) {
            	if (point.name.toLowerCase().indexOf(self.searchQuery().toLowerCase()) > -1) {
					point.display(true);
				} else {
					point.display(false);
				}
				point.updateMarker();
    		});
		return true;
    };
    
    // Whenever search query changes, update all points
    self.searchQuery.subscribe(function (newValue) {
		self.updatePoints();
	});
	
	// Close all info windows
	self.closeInfoWindows = function() {
		$.each(self.points(), function(i, point) {
			point.infowindow.close();
		});
	}
	
	// Add event listener on click to each point
	$.each(self.points(), function(i, point) {
		google.maps.event.addListener(point.marker,'click',function() {
			point.pointSelected();
		});
	});
}