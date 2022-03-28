import DynamoDB from 'aws-sdk/clients/dynamodb';
import type {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import type {InsertManyParams} from './ddb.types';

const isTest = process.env.JEST_WORKER_ID;
const config = {
  convertEmptyValues: true,
  ...(isTest && {endpoint: 'localhost:8000', sslEnabled: false, region: 'local-env'}),
};

const documentClient: DocumentClient = new DynamoDB.DocumentClient(config);
const ddbClient = new DynamoDB(config);

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
}: InsertManyParams): Promise<DocumentClient.BatchWriteItemOutput> {
  const params: DocumentClient.BatchWriteItemInput = {
    RequestItems: {
      [tableName]: items.map(item => {
        return {
          PutRequest: {
            Item: item,
          },
        };
      }),
    },
  };

  return batchWrite(params);
}

async function batchWrite(
  items: DocumentClient.BatchWriteItemInput
): Promise<DocumentClient.BatchWriteItemOutput> {
  return documentClient.batchWrite(items).promise();
}
