var express = require('express');
var request = require('requestretry');
var app = express();

const port = 8080;
const TIMEOUT = 2000;

//Define vehicle capacities.
let capacity = {
    "STANDARD": 4,
    "EXECUTIVE": 4,
    "LUXURY": 4,
    "PEOPLE_CARRIER": 6,
    "LUXURY_PEOPLE_CARRIER": 6,
    "MINIBUS": 16
};

//Disable etag to prevent caching.
app.set('etag', false);

app.get('/api', function (req, res) {
	//Set JSON and cache headers.
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

	let PRETTY = 0;
    let pickup_coords = req.query.pickup;
    let dropoff_coords = req.query.dropoff;
    let passengers = req.query.passengers;
	let problem = false;
	
    if (typeof req.query.pretty !== "undefined") PRETTY = 3;

    //Check if all parameters are filled in.
    if (typeof pickup_coords === "undefined" || typeof dropoff_coords === "undefined" || typeof passengers === "undefined") {
        problem = "One or more missing parameters: pickup=<lat,long> dropoff=<lat,long> passengers=<1-16>";

    //Check if passengers is within limit.
    } else if (!passengers.match(/^([1-9]|1[0-6])$/)) {
        problem = "Passenger number must be within 1 and 16.";

    //Check if coordinate parameters are valid.
    } else if (!pickup_coords.includes(",") || !dropoff_coords.includes(",")) {
        problem = "Invalid coordinates: must be in the format lat,long.";

    //Check if coordinates are within range and valid.
    } else {
        let lat1 = pickup_coords.split(",")[0];
        let long1 = pickup_coords.split(",")[1];
        if (lat1.length === 0 || long1.length === 0 || isNaN(lat1) || isNaN(long1) || lat1 < -90 || lat1 > 90 || long1 < -180 || long1 > 180) {
            problem = "Coordinates must be a valid number, -90<=lat<=90, -180<=long<=180.";
        }

        let lat2 = dropoff_coords.split(",")[0];
        let long2 = dropoff_coords.split(",")[1];
        if (lat2.length === 0 || long2.length === 0 || isNaN(lat2) || isNaN(long2) || lat2 < -90 || lat2 > 90 || long2 < -180 || long2 > 180) {
            problem = "Coordinates must be a valid number, -90<=lat<=90, -180<=long<=180.";
        }
    }
	
	//If there was a problem with the inputs
	if(problem){
		//Send 400 error with reason.
		res.status(400).send(JSON.stringify({
			"timestamp": "" + new Date().toISOString(),
			"status": 400,
			"error": "Bad Request",
			"message": problem,
			"path": "/api"
		}, null, PRETTY));
		res.end();
	}else{
		//GET request parameters.
		let params = {
			pickup: pickup_coords,
			dropoff: dropoff_coords
		};

		let results_json = [];

		//Call API's for all suppliers asynchronously using callbacks to ensure order.
		requestApi("Dave", params, passengers, results_json, function () {
			requestApi("Eric", params, passengers, results_json, function () {
				requestApi("Jeff", params, passengers, results_json, function () {
					res.status(200).send(JSON.stringify(print(results_json), null, PRETTY));
					res.end();
				});
			});
		});
	}
});

//If 500 internal server error, retry the request once. If 200, dont retry.
const serverError = function retryInternalServerError(err, response, body) {
    if (typeof response !== "undefined" && response.statusCode === 200) return false;
    else return typeof body !== "undefined" && body.status === 500;
}

//API request function
function requestApi(supplier, params, passengers, results_json, callback) {
    request({
        url: 'https://techtest.rideways.com/' + supplier,
        qs: params,
        timeout: TIMEOUT,
        retryStrategy: serverError,
        maxAttempts: 2
    }, function (error, response, body) {
        if (!error) {
            if (response.statusCode === 200) {
                results_json = parse(JSON.parse(body), supplier + "'s Taxis", passengers, results_json);
            }
        }
        callback();
    });
}

//Parse the response, altering our JSON array accordingly.
const parse = function parseResult(json, supplier, passengers, results_json) {
    for (let i = 0; i < json.options.length; i++) {
        let option = json.options[i];
        if (passengers <= capacity[option.car_type]) {
            let carTypeExists = false;
            for (let j = 0; j < results_json.length; j++) {
                let result = results_json[j];
                if (result.car_type === option.car_type) {
                    carTypeExists = true;

                    //If the car type already exists, and our
                    //new result is cheaper - swap them.
                    if (result.price > option.price) {
                        result.price = option.price;
                        result.supplier = supplier;
                        break;
                    }
                }
            }

            //If the car doesn't exist in our results, add the result.
            if (!carTypeExists)
                results_json.push({"car_type": option.car_type, "supplier": supplier, "price": option.price});
        }
    }
	return results_json;
}

//Finally, sort the JSON array using custom comparison method for price and print.
const print = function print(results_json) {
    let options_json = JSON.parse('{"options":[]}');
    if (results_json.length !== 0)
		options_json.options = results_json.sort(comparePrice);
    return options_json;
};

//Custom comparison method for price, in descending order.
const comparePrice = function comparePrice(a, b) {
    if (a.price > b.price)
        return -1;
    if (a.price < b.price)
        return 1;
    return 0;
};

var server = app.listen(port, () => console.log(`App listening on port ${port}!`));
module.exports = {server, comparePrice, serverError, print, parse};