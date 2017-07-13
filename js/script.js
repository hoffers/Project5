var viewModel = new MapViewModel();
ko.applyBindings(viewModel);

/**
 * Success callback for Map API request
 */
function initMap() {
  viewModel.init();
};

/**
 * Error callback for GMap API request
 */
function mapError() {
  // Error handling
  alert('There was an error loading the Google Maps API. Please try again.')
};

// An object that contains data and functionality of a point on the map
function Point(name, lat, long, address, icon, map) {
  var self = this;
  self.name = name;
  self.lat = lat;
  self.long = long;
  self.address = address;
  self.icon = icon;
  self.display = ko.observable(true);
  self.isSelected = function() {
    return viewModel.selection().name === self.name;
  };
  // Handles point being selected in menu
  self.itemSelected = function() {
    if (self.pointSelected !== undefined) {
      self.pointSelected();
    } else {
      viewModel.selection(self);
      self.showWikiResults();
    }
  };
  // Get and show wikipedia results
  self.showWikiResults = function() {
    viewModel.wikiArticles([]);
    viewModel.wikiError(false);
    var wikiUrl = "http://en.wikipedia.org/w/api.php?action=opensearch&search=" +
      self.name + "&format=json&callback=wikiCallback";
    $.ajax({
      url: wikiUrl,
      dataType: "jsonp"
    }).done(function (response) {
      var articleList = response[1];
      for (var i = 0; i < articleList.length; i++) {
        articleStr = articleList[i];
        viewModel.wikiArticles.push(new WikiArticle(articleStr));
      }
      viewModel.wikiError(false);
    }).fail(function (jqXHR, textStatus) {
      viewModel.wikiError(true);
    });
  };
  self.init = function(map) {
    self.map = map;
    self.marker = new google.maps.Marker({
      position: new google.maps.LatLng(self.lat, self.long),
      title: self.name,
      map: self.map,
      draggable: false,
      visible: self.display(),
      icon: self.icon
    });

  	// Animates marker for two bounces
  	self.animateMarker = function() {
  		var marker = self.marker;
  		marker.setAnimation(google.maps.Animation.BOUNCE);
  		window.setTimeout(function() {
  			marker.setAnimation(null);
  		},1450);
  	};

  	// Handles point being selected in map
  	self.pointSelected = function() {
  		self.map.panTo(new google.maps.LatLng(self.lat, self.long));
  		self.animateMarker();
  		viewModel.infowindow.open(self.map,self.marker);
      viewModel.infowindow.setContent('<div class="infowindow">' + self.name + '</div>');
  		viewModel.selection(self);
      self.showWikiResults();
  	};

    google.maps.event.addListener(self.marker,'click',function() {
      self.pointSelected();
    });

  	// Displays marker if point is displayed, otherwise hides it
  	self.updateMarker = function() {
  		if (self.display()) {
  			self.marker.setVisible(true);
  		} else {
  			self.marker.setVisible(false);
  		}
  	};
  }

  // Initialize the Point if given the map
  if (map !== undefined) {
    self.init(map);
  }
}

// An object that contains data for a Wikipedia article
function WikiArticle(name) {
	this.name = name;
	this.url = 'http://en.wikipedia.org/wiki/' + name;
}

// The View Model object
function MapViewModel() {
	var self = this;

  self.init = function() {
    // The actual Map
  	self.map = new google.maps.Map(document.getElementById('map-canvas'), self.mapOptions);
    // Add the points
    $.each(self.points(), function(i, point) {
      point.init(self.map);
    });
    // The info window to display the name of the selected point
    this.infowindow = new google.maps.InfoWindow();
  };

	// Options for map
	self.mapOptions = {
		center: { lat: 33.8151359, lng: -84.3227593},
		zoom: 15,
		draggable: true,
		disableDefaultUI: true
	};

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
	};

  // The search query typed in by the user
  self.searchQuery = ko.observable("");

  // List of Points to be displayed on the map
  self.points = ko.observableArray();

  // Add the points
  $.each(points, function(i, point) {
    self.points.push(new Point(point.name, point.lat, point.long, point.address, self.icons[point.icon]));
  });

  // Sort points based on their names
  self.points().sort(function(left, right) {
    return left.name == right.name ? 0 : (left.name < right.name ? -1 : 1);
  });

  // The selected Point. Start with "dummy" Point.
  self.selection = ko.observable(new Point('Select a location for more information.', 0, 0, ''));

  // The streetView url for selected Point
  self.streetView = ko.computed(function() {
  	if (self.selection().address !== "") {
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

  self.showingMap = ko.observable(false);
  self.toggleBtnClicked = function() {
    var scrollTo = self.showingMap() ? 0 : $(document).height()-$(window).height();
    $('html, body').animate({
       scrollTop: scrollTo},
       1400,
       "easeOutQuint"
    );
    self.showingMap(!self.showingMap());
  };
}
