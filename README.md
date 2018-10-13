# BookingGo Technical Test Submission

## Setup  
1. [Install node with npm](https://nodejs.org/en/download/) (LTS or Current)

2. Clone repository:  
`git clone https://github.com/sam-littlefair/BookingGo-Technical-Test-Submission.git`

3. In the working directory run command:
`npm install`   


## Part 1

### Console application to print the search results for Dave's Taxis

Usage:  
`node part1a <pickup coordinates> <dropoff coordinates>`  

Example:  
`node part1a 3.410632,-2.157533 3.410632,-2.157533`

### Console application to filter by number of passengers
Usage:  
`node part1b <pickup coordinates> <dropoff coordinates> <no. of passengers>`  

Example:  
`node part1b 3.410632,-2.157533 3.410632,-2.157533 2`  


## Part 2

Usage:  
```bash
node part2
```

When the server has started, visit for example:  
`http://localhost:8080/api?pickup=51.470020,-0.454295&dropoff=51.470020,-0.454295&passengers=2`  

Optionally you can add a `pretty` parameter to pretty print the JSON:  
`http://localhost:8080/api?pickup=51.470020,-0.454295&dropoff=51.470020,-0.454295&passengers=2&pretty=1` 

Sample output:
```json
{
   "options": [
      {
         "car_type": "EXECUTIVE",
         "supplier": "Eric's Taxis",
         "price": 440847
      },
      {
         "car_type": "LUXURY_PEOPLE_CARRIER",
         "supplier": "Dave's Taxis",
         "price": 326889
      },
      {
         "car_type": "PEOPLE_CARRIER",
         "supplier": "Dave's Taxis",
         "price": 72133
      }
   ]
}
```

## Testing
You can run the included Mocha test suite using:  
`npm test`  

It contains 20 tests that should all pass.
