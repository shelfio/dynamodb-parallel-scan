import assignIn from 'lodash.assignin';
import {DynamoDB} from 'aws-sdk';

const config = {convertEmptyValues: true};

if (process.env.ENVIRONMENT === 'local') {
  assignIn(config, {endpoint: 'localhost:8000', sslEnabled: false, region: 'local-env'});
}

export const documentClient = new DynamoDB.DocumentClient(config);

export async function scan() {
  return documentClient.scan(...arguments).promise();
}

export function insertMany({items, tableName}) {
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
