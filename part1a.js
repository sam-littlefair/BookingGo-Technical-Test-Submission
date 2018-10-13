//Require slightly modified requests package that implements retries.
var request = require('requestretry');

//Define constants.
const args = process.argv;
const TIMEOUT = 2000;

//Take arguments from command line.
let pickup_coords = args[2];
let dropoff_coords = args[3];

//Check if all parameters are filled in.
if (typeof pickup_coords === "undefined" || typeof dropoff_coords === "undefined") {
    throwError("Usage: node part1a <pickup lat,long> <dropoff lat,long>.");

//Check if coordinates are valid.
} else if (!pickup_coords.includes(",") || !dropoff_coords.includes(",")) {
    throwError("Invalid coordinates, must be in the format lat,long.");

//Check if coordinates are within range and valid.
} else {
    let lat1 = pickup_coords.split(",")[0];
    let long1 = pickup_coords.split(",")[1];

    if (lat1.length === 0 || long1.length === 0 || isNaN(lat1) || isNaN(long1) || lat1 < -90 || lat1 > 90 || long1 < -180 || long1 > 180) {
        throwError("Coordinates must be a valid number, -90<=lat<=90, -180<=long<=180.");
    }

    let lat2 = dropoff_coords.split(",")[0];
    let long2 = dropoff_coords.split(",")[1];

    if (lat2.length === 0 || long2.length === 0 || isNaN(lat2) || isNaN(long2) || lat2 < -90 || lat2 > 90 || long2 < -180 || long2 > 180) {
        throwError("Coordinates must be a valid number, -90<=lat<=90, -180<=long<=180.");
    }
}

//GET request parameters.
let params = {
    pickup: pickup_coords,
    dropoff: dropoff_coords
};

//If 500 internal server error, retry the request once. If 200, dont retry.
function retryInternalServerError(err, response, body) {
    if (typeof response !== "undefined" && response.statusCode === 200) return false;
    else return typeof body !== "undefined" && body.status === 500;
}

//API request function
request({
    url: 'https://techtest.rideways.com/dave',
    qs: params,
    timeout: TIMEOUT,
    retryStrategy: retryInternalServerError,
    maxAttempts: 2
}, function (error, response, body) {
    if (!error) {
        if (response.statusCode === 200) {
            let results = JSON.parse(body).options;
            if (results.length === 0) {
                console.log("No results found");
            } else {
                for (let i = 0; i < results.length; i++) {
                    console.log(results[i].car_type + " - " + results[i].price);
                }
            }
        }
    }
});

//If problem with inputs, log the error and exit.
function throwError(err) {
    console.error(err);
    process.exit();
}