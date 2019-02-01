const AWS = require('aws-sdk');
const DynamoDbLocal = require('dynamodb-local');
const tables = require('./dynamodb-tables');

// aws-sdk requires access and secret key to be able to call DDB
process.env.AWS_ACCESS_KEY_ID = 'access-key';
process.env.AWS_SECRET_ACCESS_KEY = 'secret-key';

const dynamoDB = new AWS.DynamoDB({
  endpoint: 'localhost:8000',
  sslEnabled: false,
  region: 'local-env'
});

module.exports = async function() {
  global.__DYNAMODB__ = await DynamoDbLocal.launch(8000, null, ['-sharedDb']);

  await createTables();
};

async function createTables() {
  for (let table of tables) {
    await dynamoDB.createTable(table).promise();
  }
}
