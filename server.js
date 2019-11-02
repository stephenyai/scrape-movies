var express = require("express");
var mongojs = require("mongojs");
var request = require("request");
var cheerio = require("cheerio");
var axios = require("axios");
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser());

var methodOverride = require('method-override')

app.use(methodOverride('_method'))

app.use(express.static("public"));

// Database configuration
var databaseUrl = "movie-scraper";
var collections = ["scrapedData", "savedArticles", "notes"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});


// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});


app.get("/scrape", function(req, res) {
	var results = [];

	axios.get("https://www.slashfilm.com/").then(function(response) {

		// Load the Response into cheerio and save it to a variable
		// '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
		var $ = cheerio.load(response.data);
		// // An empty array to save the data that we'll scrape

	  	$('div.post').each(function(i, element) {
	  		var title = $(element).children().children().children().eq(1).text();
	  		var summary = $(element).children().eq(2).text();
	  		var link = $(element).children().find('.more-link').attr('href')

	  		db.scrapedData.find({title: title}, function(err, item) {
	  			// if title isn't there, then it will be empty (length = 0) so it will insert with line 62
	  			if (item.length < 1) {
					db.scrapedData.insert({
						title: title,
						summary: summary,
						link: link
					}, 
					function(err, inserted) {
						if (err) {
							console.log(err);
						} else {
							console.log('inserted', inserted)
						}
					});  			
	  			} 	
	  		})

	  		results.push({
	  			title: title,
	  			summary: summary,
	  			link: link
	  		})
	  	})
	});
	res.redirect('/')
});

app.post("/saved", function(req, res) {
	console.log(req.body)
	db.savedArticles.insert({
		title: req.body.title,
		summary: req.body.summary,
		link: req.body.link
	})
	res.send("article saved")
});

app.get("/saved", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.savedArticles.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

app.post("/notes", function(req, res) {

	// db.notes.find({title: req.body.title}, function(err, item) {
	// if (item.length < 1) {
	db.notes.insert({
		title: req.body.title,
		note: req.body.savedNote
	}, 
	function(err, inserted) {
		if (err) {
			console.log(err);
		} else {
			console.log('inserted', inserted)
			res.json(inserted)
		}
	});  				
	// res.json(item)
// })
	// res.send("note saved")
});

app.get("/notes", function(req, res) {
  db.notes.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});


app.delete("/saved/:id", function(req, res) {
	var id = req.params.id;

    db.savedArticles.remove({
      "_id": mongojs.ObjectID(id)
    }, function(error, removed) {
      if (error) {
        res.send(error);
      }else {
        // res.json(id);
        res.redirect('/')
      }
    });
  });

app.delete("/notes/:id", function(req, res) {
	var id = req.params.id;

    db.notes.remove({
      "_id": mongojs.ObjectID(id)
    }, function(error, removed) {
      if (error) {
        res.send(error);
      }else {
        // res.json(id);
        res.json(removed)
      }
    });
  });




// Listen on port 3000
app.listen(3000, function() {
  console.log("App running on port 3000!");
});