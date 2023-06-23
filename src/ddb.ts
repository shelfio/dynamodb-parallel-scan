import {DescribeTableCommand, DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {BatchWriteCommand, DynamoDBDocumentClient, ScanCommand} from '@aws-sdk/lib-dynamodb';
import type {
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
  ScanCommandInput,
  ScanCommandOutput,
} from '@aws-sdk/lib-dynamodb';

const isTest = process.env.JEST_WORKER_ID;
const endpoint = process.env.DYNAMODB_ENDPOINT;
const region = process.env.REGION;

export type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};
const ddbv3Client = (credentials?: Credentials) =>
  new DynamoDBClient({
    ...(isTest && {
      endpoint: endpoint ?? 'http://localhost:8000',
      tls: false,
      region: region ?? 'local-env',
    }),
    credentials: getCredentials(credentials),
  });

const getCredentials = (credentials?: Credentials) => {
  if (credentials && Object.keys(credentials).length) {
    return credentials;
  }

  return {
    accessKeyId: 'fakeMyKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
  };
};
const ddbv3DocClient = (credentials?: Credentials) =>
  DynamoDBDocumentClient.from(ddbv3Client(credentials));

export function scan(
  params: ScanCommandInput,
  credentials?: Credentials
): Promise<ScanCommandOutput> {
  const command = new ScanCommand(params);

  return ddbv3Client(credentials).send(command);
}

export async function getTableItemsCount(
  tableName: string,
  credentials?: Credentials
): Promise<number> {
  const command = new DescribeTableCommand({TableName: tableName});
  const resp = await ddbv3Client(credentials).send(command);

  return resp.Table!.ItemCount;
}

export function insertMany(
  {
    items,
    tableName,
  }: {
    items: any[];
    tableName: string;
  },
  credentials?: Credentials
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

  return batchWrite(params, credentials);
}

function batchWrite(
  items: BatchWriteCommandInput['RequestItems'],
  credentials?: Credentials
): Promise<BatchWriteCommandOutput> {
  const command = new BatchWriteCommand({
    RequestItems: items,
    ReturnConsumedCapacity: 'NONE',
    ReturnItemCollectionMetrics: 'NONE',
  });

  return ddbv3DocClient(credentials).send(command);
}
