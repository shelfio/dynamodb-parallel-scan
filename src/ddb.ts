import DynamoDB from 'aws-sdk/clients/dynamodb';

const isTest = process.env.JEST_WORKER_ID;
const config = {
  convertEmptyValues: true,
  ...(isTest && {endpoint: 'localhost:8000', sslEnabled: false, region: 'local-env'})
};

const documentClient: DynamoDB.DocumentClient = new DynamoDB.DocumentClient(config);

export async function scan(
  params: DynamoDB.ScanInput
): Promise<DynamoDB.DocumentClient.ScanOutput> {
  return documentClient.scan(params).promise();
}

export function insertMany({
  items,
  tableName
}): Promise<DynamoDB.DocumentClient.BatchWriteItemOutput> {
  const params: DynamoDB.BatchWriteItemInput = {
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

async function batchWrite(items): Promise<DynamoDB.DocumentClient.BatchWriteItemOutput> {
  return documentClient.batchWrite(items).promise();
}
