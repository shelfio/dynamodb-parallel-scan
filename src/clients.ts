import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient} from '@aws-sdk/lib-dynamodb';

export type Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

const isTest = process.env.JEST_WORKER_ID;
const endpoint = process.env.DYNAMODB_ENDPOINT;
const region = process.env.REGION;

export const ddbv3Client = (credentials?: Credentials) =>
  new DynamoDBClient({
    ...(isTest && {
      endpoint: endpoint ?? 'http://localhost:8000',
      tls: false,
      region: region ?? 'local-env',
    }),
    credentials: getCredentials(credentials),
  });

export const ddbv3DocClient = (credentials?: Credentials) =>
  DynamoDBDocumentClient.from(ddbv3Client(credentials));

const getCredentials = (credentials?: Credentials) => {
  if (credentials && Object.keys(credentials).length) {
    return credentials;
  }

  if (isTest) {
    return {
      accessKeyId: 'fakeMyKeyId',
      secretAccessKey: 'fakeSecretAccessKey',
    };
  }

  return undefined;
};
