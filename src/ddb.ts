import DynamoDB from 'aws-sdk/clients/dynamodb';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';

const isTest = process.env.JEST_WORKER_ID;
const config = {
  convertEmptyValues: true,
  ...(isTest && {endpoint: 'localhost:8000', sslEnabled: false, region: 'local-env'}),
};

const documentClient: DocumentClient = new DynamoDB.DocumentClient(config);

export async function scan(params: DocumentClient.ScanInput): Promise<DocumentClient.ScanOutput> {
  return documentClient.scan(params).promise();
}

export function insertMany({items, tableName}): Promise<DocumentClient.BatchWriteItemOutput> {
  const params: DocumentClient.BatchWriteItemInput = {
    RequestItems: {
      [tableName]: items.map(item => ({
        PutRequest: {
          Item: item,
        },
      })),
    },
  };

  return batchWrite(params);
}

async function batchWrite(items): Promise<DocumentClient.BatchWriteItemOutput> {
  return documentClient.batchWrite(items).promise();
}
