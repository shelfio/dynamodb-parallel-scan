import {DescribeTableCommand, DynamoDBClient} from '@aws-sdk/client-dynamodb';
import type {
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import {BatchWriteCommand, DynamoDBDocumentClient, ScanCommand} from '@aws-sdk/lib-dynamodb';

const isTest = process.env.JEST_WORKER_ID;
const endpoint = process.env.DYNAMODB_ENDPOINT;
const region = process.env.REGION;
const ddbv3Client = new DynamoDBClient({
  ...(isTest && {
    endpoint: endpoint ?? 'http://localhost:8000',
    tls: false,
    region: region ?? 'local-env',
    credentials: {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey',
    },
  }),
});
const ddbv3DocClient = DynamoDBDocumentClient.from(ddbv3Client);

export function scan(params: ScanCommandInput): Promise<ScanCommandOutput> {
  const command = new ScanCommand(params);

  return ddbv3Client.send(command);
}

export async function getTableItemsCount(tableName: string): Promise<number> {
  const command = new DescribeTableCommand({TableName: tableName});
  const resp = await ddbv3Client.send(command);

  return resp.Table.ItemCount;
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

function batchWrite(
  items: BatchWriteCommandInput['RequestItems']
): Promise<BatchWriteCommandOutput> {
  const command = new BatchWriteCommand({
    RequestItems: items,
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
  });

  return ddbv3DocClient.send(command);
}
