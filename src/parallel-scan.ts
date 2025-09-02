import getDebugger from 'debug';
import type {ScanCommandInput, ScanCommandOutput} from '@aws-sdk/lib-dynamodb';
import type {Credentials} from './ddb.js';
import type {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import type {DynamoDBDocument} from '@aws-sdk/lib-dynamodb';
import {getTableItemsCount, scan} from './ddb.js';
import {ddbv3Client} from './clients.js';

const debug = getDebugger('ddb-parallel-scan');

let totalTableItemsCount = 0;
let totalScannedItemsCount = 0;
let totalFetchedItemsCount = 0;

export async function parallelScan(
  scanParams: ScanCommandInput,
  {
    concurrency,
    credentials,
    client,
  }: {concurrency: number; credentials?: Credentials; client?: DynamoDBClient | DynamoDBDocument}
): Promise<ScanCommandOutput['Items']> {
  const ddbClient = client ?? ddbv3Client(credentials);
  totalTableItemsCount = await getTableItemsCount(scanParams.TableName!, ddbClient);

  const segments: number[] = Array.from({length: concurrency}, (_, i) => i);
  const totalItems: ScanCommandOutput['Items'] = [];

  debug(
    `Started parallel scan with ${concurrency} threads. Total items count: ${totalTableItemsCount}`
  );

  await Promise.all(
    segments.map(async (_, segmentIndex) => {
      const segmentItems = await getItemsFromSegment(scanParams, {
        concurrency,
        segmentIndex,
        client: ddbClient,
      });

      for (const segmentItem of segmentItems!) {
        totalItems.push(segmentItem);
      }
      totalFetchedItemsCount += segmentItems!.length;
    })
  );

  debug(`Finished parallel scan with ${concurrency} threads. Fetched ${totalItems.length} items`);

  return totalItems;
}

async function getItemsFromSegment(
  scanParams: ScanCommandInput,
  {
    concurrency,
    segmentIndex,
    client,
  }: {concurrency: number; segmentIndex: number; client: DynamoDBClient | DynamoDBDocument}
): Promise<ScanCommandOutput['Items']> {
  const segmentItems: ScanCommandOutput['Items'] = [];
  let ExclusiveStartKey: ScanCommandInput['ExclusiveStartKey'];

  const params: ScanCommandInput = {
    ...structuredClone(scanParams),
    Segment: segmentIndex,
    TotalSegments: concurrency,
  };

  debug(`[${segmentIndex}/${concurrency}][start]`, {ExclusiveStartKey});

  do {
    const now: number = Date.now();

    if (ExclusiveStartKey) {
      params.ExclusiveStartKey = ExclusiveStartKey;
    }

    const {Items, LastEvaluatedKey, ScannedCount} = await scan(params, client);
    ExclusiveStartKey = LastEvaluatedKey;
    totalScannedItemsCount += ScannedCount!;

    for (const item of Items!) {
      segmentItems.push(item);
    }

    debug(
      `(${Math.round((totalScannedItemsCount / totalTableItemsCount) * 100)}%) ` +
        `[${segmentIndex}/${concurrency}] [time:${Date.now() - now}ms] ` +
        `[fetched:${Items!.length}] ` +
        `[total (fetched/scanned/table-size):${totalFetchedItemsCount}/${totalScannedItemsCount}/${totalTableItemsCount}]`
    );
  } while (ExclusiveStartKey);

  return segmentItems;
}
