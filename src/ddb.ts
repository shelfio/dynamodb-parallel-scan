import DynamoDB from 'aws-sdk/clients/dynamodb';
import type {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import type {BatchWriteCommandInput, BatchWriteCommandOutput} from '@aws-sdk/lib-dynamodb';
import {BatchWriteCommand, DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';

const isTest = process.env.JEST_WORKER_ID;
const config = {
  ...(isTest && {endpoint: 'localhost:8000', sslEnabled: false, region: 'local-env'}),
};

const documentClient: DocumentClient = new DynamoDB.DocumentClient(config);
const ddbClient = new DynamoDB(config);
const ddbv3Client = new DynamoDBClient({
  ...(isTest && {endpoint: 'http://localhost:8000', tls: false, region: 'local-env'}),
});
const ddbv3DocClient = DynamoDBDocumentClient.from(ddbv3Client);

export async function scan(params: DocumentClient.ScanInput): Promise<DocumentClient.ScanOutput> {
  return documentClient.scan(params).promise();
}

export async function getTableItemsCount(tableName: string): Promise<number> {
  const tableInfo = await ddbClient.describeTable({TableName: tableName}).promise();

  return tableInfo.Table.ItemCount;
}

export function insertMany({
  items,
  tableName,
}: {
  items: any[];
  tableName: string;
}): Promise<BatchWriteCommandOutput> {
  const params: BatchWriteCommandInput['RequestItems'] = {
    [tableName]: items.map(item => {
      return {
        PutRequest: {
          Item: item,
        },
      };
    }),
  };

  return batchWrite(params);
}

async function batchWrite(
  items: BatchWriteCommandInput['RequestItems']
): Promise<BatchWriteCommandOutput> {
  const command = new BatchWriteCommand({
    RequestItems: items,
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
  });

  return ddbv3DocClient.send(command);
}
