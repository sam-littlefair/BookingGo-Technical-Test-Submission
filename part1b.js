//Require slightly modified requests package that implements retries.
var request = require('requestretry');

//Define vehicle capacities.
let capacity = {
    "STANDARD": 4,
    "EXECUTIVE": 4,
    "LUXURY": 4,
    "PEOPLE_CARRIER": 6,
    "LUXURY_PEOPLE_CARRIER": 6,
    "MINIBUS": 16
};

//Define constants.
const args = process.argv;
const TIMEOUT = 2000;

//Take arguments from command line.
let pickup_coords = args[2];
let dropoff_coords = args[3];
let passengers = args[4];

//Check if all parameters are filled in.
if (typeof pickup_coords === "undefined" || typeof dropoff_coords === "undefined" || typeof passengers === "undefined") {
    throwError("Usage: node part1 <pickup lat,long> <dropoff lat,long> <no of passengers>.");

//Check if passengers is within limit.
} else if (passengers > 16 || passengers < 1) {
    throwError("Passenger number must be within 1 and 16.");

//Check if coordinate parameters are valid.
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

let results_json = [];

//Call API's for all suppliers asynchronously using callbacks to ensure order.
requestApi("Dave", results_json, function () {
    requestApi("Eric", results_json, function () {
        requestApi("Jeff", results_json, function () {
            print(results_json);
        });
    });
});

//If 500 internal server error, retry the request once. If 200, dont retry.
function retryInternalServerError(err, response, body) {
    if (typeof response !== "undefined" && response.statusCode === 200) return false;
    else return typeof body !== "undefined" && body.status === 500;
}

//API request function
function requestApi(supplier, results_json, callback) {
    request({
        url: 'https://techtest.rideways.com/' + supplier,
        qs: params,
        timeout: TIMEOUT,
        retryStrategy: retryInternalServerError,
        maxAttempts: 2
    }, function (error, response, body) {
        if (!error) {
            if (response.statusCode === 200) {
                parseResult(JSON.parse(body), supplier + "'s Taxis", results_json);
            }
        }
        callback()
    });
}

//Parse the response, altering our JSON array accordingly.
function parseResult(json, supplier, results_json) {
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
                results_json.push({"car_type": option.car_type, "supplier": supplier, "price": option.price})
        }
    }
    return results_json;
}

//Finally, sort the JSON array using custom comparison method for price and print.
function print(results_json) {
    if (results_json.length === 0) {
        console.log("No results found.");
        process.exit();
    } else {
        results_json.sort(comparePrice);

        for (let i = 0; i < results_json.length; i++) {
            console.log(results_json[i].car_type + " - " + results_json[i].supplier + " - " + results_json[i].price);
        }
    }
}

//Custom comparison method for price, in descending order.
function comparePrice(a, b) {
    if (a.price > b.price)
        return -1;
    if (a.price < b.price)
        return 1;
    return 0;
}

//If problem with inputs, log the error and exit.
function throwError(err) {
    console.error(err);
    process.exit();
}