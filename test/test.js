var request = require('supertest');
var expect = require('chai').expect;

describe('UNIT TESTS', function () {
    let compare, serverError, parse;
    beforeEach(function () {
        compare = require('../part2').comparePrice;
        serverError = require('../part2').serverError;
        print = require('../part2').print;
        parse = require('../part2').parse;
    });

    it('Compare function working properly', function testCompareFunction(done) {
        expect(compare({"price": 400}, {"price": 200})).to.equal(-1);
        expect(compare({"price": 100}, {"price": 500})).to.equal(1);
        expect(compare({"price": 400}, {"price": 400})).to.equal(0);
        done();
    });

    it('Check server error', function testServerError(done) {
        expect(serverError("", {"statusCode": 200}, "")).to.equal(false);
        expect(serverError("", "", {"status": 500})).to.equal(true);
        expect(serverError("", "", "")).to.equal(false);
        done();
    });

    it('Check print function', function testPrintFunction(done) {
        expect(JSON.stringify(print(""))).to.equal('{"options":[]}');
        done();
    });

    it('Parse function: New supplier cheaper', function testNewSupplierCheaper(done) {
        let existing_results = [{
            "car_type": "PEOPLE_CARRIER",
            "supplier": "Eric's Taxis",
            "price": 200
        }, {"car_type": "LUXURY_PEOPLE_CARRIER", "supplier": "Dave's Taxis", "price": 300}];
        let new_results = {"options": [{"car_type": "PEOPLE_CARRIER", "supplier": "Jeff's Taxis", "price": 100}]};
        expect(JSON.stringify(parse(new_results, "Jeff's Taxis", 2, existing_results))).to.equal('[{"car_type":"PEOPLE_CARRIER","supplier":"Jeff\'s Taxis","price":100},{"car_type":"LUXURY_PEOPLE_CARRIER","supplier":"Dave\'s Taxis","price":300}]');
        done();
    });

    it('Parse function: New supplier more expensive', function testNewSupplierExpensive(done) {
        let existing_results = [{
            "car_type": "PEOPLE_CARRIER",
            "supplier": "Eric's Taxis",
            "price": 200
        }, {"car_type": "LUXURY_PEOPLE_CARRIER", "supplier": "Dave's Taxis", "price": 300}];
        let new_results = {"options": [{"car_type": "PEOPLE_CARRIER", "supplier": "Jeff's Taxis", "price": 5000}]};
        expect(JSON.stringify(parse(new_results, "Jeff's Taxis", 2, existing_results))).to.equal('[{"car_type":"PEOPLE_CARRIER","supplier":"Eric\'s Taxis","price":200},{"car_type":"LUXURY_PEOPLE_CARRIER","supplier":"Dave\'s Taxis","price":300}]');
        done();
    });

    it('Parse function: New car type to add', function testNewCarType(done) {
        let existing_results = [{
            "car_type": "PEOPLE_CARRIER",
            "supplier": "Eric's Taxis",
            "price": 200
        }, {"car_type": "LUXURY_PEOPLE_CARRIER", "supplier": "Dave's Taxis", "price": 300}];
        let new_results = {"options": [{"car_type": "MINIBUS", "supplier": "Jeff's Taxis", "price": 1250}]};
        expect(JSON.stringify(parse(new_results, "Jeff's Taxis", 2, existing_results))).to.equal('[{"car_type":"PEOPLE_CARRIER","supplier":"Eric\'s Taxis","price":200},{"car_type":"LUXURY_PEOPLE_CARRIER","supplier":"Dave\'s Taxis","price":300},{"car_type":"MINIBUS","supplier":"Jeff\'s Taxis","price":1250}]');
        done();
    });

    it('Parse function: Empty results list', function testEmptyResults(done) {
        let existing_results = [];
        let new_results = {"options": [{"car_type": "MINIBUS", "supplier": "Jeff's Taxis", "price": 1250}]};
        expect(JSON.stringify(parse(new_results, "Jeff's Taxis", 2, existing_results))).to.equal('[{"car_type":"MINIBUS","supplier":"Jeff\'s Taxis","price":1250}]');
        done();
    });

    it('Parse function: Not enough seats for passengers', function testNotEnoughSeats(done) {
        let existing_results = [{"car_type": "PEOPLE_CARRIER", "supplier": "Eric's Taxis", "price": 200}];
        let new_results = {"options": [{"car_type": "LUXURY", "supplier": "Jeff's Taxis", "price": 1000}]};
        expect(JSON.stringify(parse(new_results, "Jeff's Taxis", 10, existing_results))).to.equal('[{"car_type":"PEOPLE_CARRIER","supplier":"Eric\'s Taxis","price":200}]');
        done();
    });
});

describe('Loading server', function () {
    let server;

    beforeEach(function () {
        server = require('../part2').server;
    });

    afterEach(function () {
        server.close();
    });

    it('Responds to /api GET', function testSlash(done) {
        request(server)
            .get('/api')
            .expect(400, done);
    });

    it('Everything but /api should be 404', function testPath(done) {
        request(server)
            .get('/invalid/page')
            .expect(404, done);
    });
});

describe('Testing missing query params', function () {
    let server;

    beforeEach(function () {
        server = require('../part2').server;
    });

    afterEach(function () {
        server.close();
    });

    it('No parameters', function testNoParams(done) {
        request(server)
            .get('/api')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("One or more missing parameters: pickup=<lat,long> dropoff=<lat,long> passengers=<1-16>");
                done();
            });
    });

    it('One parameters', function testOneParam(done) {
        request(server)
            .get('/api?pickup=51.470020,-0.454295')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("One or more missing parameters: pickup=<lat,long> dropoff=<lat,long> passengers=<1-16>");
                done();
            });
    });

    it('Two parameters', function testTwoParam(done) {
        request(server)
            .get('/api?pickup=51.470020,-0.454295&dropoff=51.470020,-0.454295')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("One or more missing parameters: pickup=<lat,long> dropoff=<lat,long> passengers=<1-16>");
                done();
            });
    });

    it('All parameters', function testAllParam(done) {
        this.timeout(15000);
        request(server)
            .get('/api?pickup=51.470020,-0.454295&dropoff=51.470020,-0.454295&passengers=2')
            .expect(200, done)
    });
});

describe('Testing invalid query params', function () {
    let server;

    beforeEach(function () {
        server = require('../part2').server;
    });

    afterEach(function () {
        server.close();
    });

    it('Coordinates not a number', function testCoordsNotNumber(done) {
        request(server)
            .get('/api?pickup=NaN,-0.454295&dropoff=51.470020,-0.454295&passengers=2')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("Coordinates must be a valid number, -90<=lat<=90, -180<=long<=180.");
                done();
            });
    });

    it('Coordinates out of range', function testCoordsOutOfRange(done) {
        request(server)
            .get('/api?pickup=100000,-0.454295&dropoff=51.470020,-0.454295&passengers=2')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("Coordinates must be a valid number, -90<=lat<=90, -180<=long<=180.");
                done();
            });
    });

    it('Invalid coordinates (no comma)', function testInvalidCoords(done) {
        request(server)
            .get('/api?pickup=51.470020-0.454295&dropoff=51.470020-0.454295&passengers=2')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("Invalid coordinates: must be in the format lat,long.");
                done();
            });
    });

    it('Passengers out of range', function testPassengerOutOfRange(done) {
        request(server)
            .get('/api?pickup=100000,-0.454295&dropoff=51.470020,-0.454295&passengers=200')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("Passenger number must be within 1 and 16.");
                done();
            });
    });

    it('Passengers not a number', function testPassengersNaN(done) {
        request(server)
            .get('/api?pickup=100000,-0.454295&dropoff=51.470020,-0.454295&passengers=NaN')
            .expect(400)
            .end(function (err, res) {
                expect(res.body.message).to.equal("Passenger number must be within 1 and 16.");
                done();
            });
    });
});

describe('Testing response validity', function () {
    let server;
    beforeEach(function () {
        server = require('../part2').server;
    });
    afterEach(function () {
        server.close();
    });

    it('Check if result is sorted by descending', function testSortByDesc(done) {
        this.timeout(15000);
        request(server)
            .get('/api?pickup=51.470020,-0.454295&dropoff=51.470020,-0.454295&passengers=2')
            .expect(200)
            .end(function (err, res) {
                let result = res.body.options;
                let sorted = true;

                for (let i = 0; i < result.length - 1; i++) {
                    if (result[i].price < result[i + 1].price) {
                        sorted = false;
                        break;
                    }
                }
                expect(sorted).to.equal(true);
                done();
            });
    });
});