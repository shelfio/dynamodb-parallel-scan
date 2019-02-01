const {DynamoDB} = require('aws-sdk');

const isTest = process.env.JEST_WORKER_ID;
const config = {
  convertEmptyValues: true,
  ...(isTest && {endpoint: 'localhost:8000', sslEnabled: false, region: 'local-env'})
};

const documentClient = new DynamoDB.DocumentClient(config);

async function scan() {
  return documentClient.scan(...arguments).promise();
}

function insertMany({items, tableName}) {
  const params = {
    RequestItems: {
      [tableName]: items.map(item => ({
        PutRequest: {
          Item: item
        }
      }))
    }
  };

  return batchWrite(params);
}

async function batchWrite() {
  return documentClient.batchWrite(...arguments).promise();
}

module.exports = {
  scan,
  insertMany
};
