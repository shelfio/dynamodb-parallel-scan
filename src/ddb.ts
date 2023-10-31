import {DescribeTableCommand, DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {BatchWriteCommand, DynamoDBDocumentClient, ScanCommand} from '@aws-sdk/lib-dynamodb';
import type {
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';

export type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

export function scan(
  params: ScanCommandInput,
  client: DynamoDBClient
): Promise<ScanCommandOutput> {
  const command = new ScanCommand(params);

  // @ts-ignore
  return client.send(command);
}

export async function getTableItemsCount(
  tableName: string,
  client: DynamoDBClient
): Promise<number> {
  const command = new DescribeTableCommand({TableName: tableName});
  const resp = await client.send(command);

  return resp.Table!.ItemCount!;
}

export function insertMany(
  {
    items,
    tableName,
  }: {
    items: any[];
    tableName: string;
  },
  docClient: DynamoDBDocumentClient
): Promise<BatchWriteCommandOutput> {
  const params: BatchWriteCommandInput['RequestItems'] = {
    [tableName]: items.map(item => {
      return {
        PutRequest: {
          Item: item,
        },
      };
    }),
  };

  return batchWrite(params, docClient);
}

function batchWrite(
  items: BatchWriteCommandInput['RequestItems'],
  docClient: DynamoDBDocumentClient
): Promise<BatchWriteCommandOutput> {
  const command = new BatchWriteCommand({
    RequestItems: items,
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
  });

  // @ts-ignore
  return docClient.send(command);
}
