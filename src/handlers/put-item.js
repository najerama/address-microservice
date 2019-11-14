// Create clients and set shared const values outside of the handler

// Create a DocumentClient that represents the query to add an item
const dynamodb = require('aws-sdk/clients/dynamodb');

const docClient = new dynamodb.DocumentClient();

// Get the DynamoDB table name from environment variables
const tableName = process.env.TABLE;

const SmartyStreetsSDK = require("smartystreets-javascript-sdk");
const SmartyStreetsCore = SmartyStreetsSDK.core;
const Lookup = SmartyStreetsSDK.usStreet.Lookup;
// let authId = process.env.SMARTY_AUTH_ID;
// let authToken = process.env.SMARTY_AUTH_TOKEN;
let authId = "ad352f05-9093-c969-a17b-592b20b71985";
let authToken = "8Qum5X8X6Kdxsspygt4M";
const credentials = new SmartyStreetsCore.StaticCredentials(authId, authToken);
let client = SmartyStreetsCore.buildClient.usStreet(credentials);

/**
 * A simple example includes a HTTP post method to add one item to a DynamoDB table.
 */
exports.putItemHandler = async (event) => {
    const { body, httpMethod, path } = event;
    if (httpMethod !== 'POST') {
        throw new Error(`postMethod only accepts POST method, you tried: ${httpMethod} method.`);
    }
    // All log statements are written to CloudWatch by default. For more information, see
    // https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html
    console.log('received:', JSON.stringify(event));

    // Get address from the body of the request
    const { address } = JSON.parse(body);

    //Query SmartyStreets
    let lookup = new Lookup();
    lookup.street = address;
    var results;

    try {
        results = await client.send(lookup);
    } catch(err) {
        console.log(err); // TypeError: failed to fetch
        const response = {
            statusCode: 200,
            body: err,
        };
        return response;
    }

    if (lookup.result.length == 0) {
        const response = {
            statusCode: 404,
            body: "Address was not found by SmartyStreets.",
        };
        console.log(`response from: ${path} statusCode: ${response.statusCode} body: ${response.body}`);
        return response;
    } else if (lookup.result.length > 1) {
        const response = {
            statusCode: 406,
            body: "Multiple addresses match, must match only one. Be more specific.",
        };
        console.log(`response from: ${path} statusCode: ${response.statusCode} body: ${response.body}`);
        return response;
    }

    let myResult = lookup.result[0];
    let id = myResult.deliveryPointBarcode
    let number = myResult.components.primaryNumber
    let street_name = myResult.components.streetName
    let street_suffix = myResult.components.streetSuffix
    let city = myResult.components.cityName
    let state = myResult.components.state
    let zipcode = myResult.components.zipCode

    // Creates a new item, or replaces an old item with a new item
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#put-property
    const params = {
        TableName: tableName,
        Item: { id, number, street_name, street_suffix, city, state, zipcode},
    };
    await docClient.put(params).promise();

    const response = {
        statusCode: 200,
        body: id,
    };

    console.log(`response from: ${path} statusCode: ${response.statusCode} body: ${response.body}`);
    return response;
};

function handleSuccess(response) {
	response.lookups.map(lookup => console.log(lookup.result));
}
