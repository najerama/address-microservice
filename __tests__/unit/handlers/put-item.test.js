// Import dynamodb from aws-sdk
const dynamodb = require('aws-sdk/clients/dynamodb');

// Import all functions from put-item.js
const lambda = require('../../../src/handlers/put-item.js');

// This includes all tests for putItemHandler
describe('Test putItemHandler', () => {
    let putSpy;

    // One-time setup and teardown, see more in https://jestjs.io/docs/en/setup-teardown
    beforeAll(() => {
        // Mock DynamoDB put method
        // https://jestjs.io/docs/en/jest-object.html#jestspyonobject-methodname
        putSpy = jest.spyOn(dynamodb.DocumentClient.prototype, 'put');
    });

    // Clean up mocks
    afterAll(() => {
        putSpy.mockRestore();
    });

    // This test invokes putItemHandler and compares the result
    it('should add id to the table', async () => {
        // Return the specified value whenever the spied put function is called
        putSpy.mockReturnValue({
            promise: () => Promise.resolve('data'),
        });

        const event = {
            httpMethod: 'POST',
            body: '{"address":"500 W 120th St, New York, NY 10027"}'
        };

        // Invoke putItemHandler()
        const result = await lambda.putItemHandler(event);
        const expectedResult = {
            statusCode: 200,
            body: event.body,
        };

        // Compare the result with the expected result
        expect(result.statusCode).toEqual(expectedResult.statusCode);
    });
});
