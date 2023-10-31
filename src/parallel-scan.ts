import cloneDeep from 'lodash.clonedeep';
import times from 'lodash.times';
import getDebugger from 'debug';
import type {ScanCommandInput, ScanCommandOutput} from '@aws-sdk/lib-dynamodb';
import type {Credentials} from './ddb';
import type {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {getTableItemsCount, scan} from './ddb';
import {ddbv3Client} from './clients';

const debug = getDebugger('ddb-parallel-scan');

let totalTableItemsCount = 0;
let totalScannedItemsCount = 0;
let totalFetchedItemsCount = 0;

export async function parallelScan(
  scanParams: ScanCommandInput,
  {concurrency, credentials}: {concurrency: number; credentials?: Credentials}
): Promise<ScanCommandOutput['Items']> {
  const client = ddbv3Client(credentials);
  totalTableItemsCount = await getTableItemsCount(scanParams.TableName!, client);

  const segments: number[] = times(concurrency);
  const totalItems: ScanCommandOutput['Items'] = [];

  debug(
    `Started parallel scan with ${concurrency} threads. Total items count: ${totalTableItemsCount}`
  );

  await Promise.all(
    segments.map(async (_, segmentIndex) => {
      const segmentItems = await getItemsFromSegment(scanParams, {
        concurrency,
        segmentIndex,
        client,
      });

      totalItems.push(...segmentItems!);
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
  }: {concurrency: number; segmentIndex: number; client: DynamoDBClient}
): Promise<ScanCommandOutput['Items']> {
  const segmentItems: ScanCommandOutput['Items'] = [];
  let ExclusiveStartKey: ScanCommandInput['ExclusiveStartKey'];

  const params: ScanCommandInput = {
    ...cloneDeep(scanParams),
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

    segmentItems.push(...Items!);

    debug(
      `(${Math.round((totalScannedItemsCount / totalTableItemsCount) * 100)}%) ` +
        `[${segmentIndex}/${concurrency}] [time:${Date.now() - now}ms] ` +
        `[fetched:${Items!.length}] ` +
        `[total (fetched/scanned/table-size):${totalFetchedItemsCount}/${totalScannedItemsCount}/${totalTableItemsCount}]`
    );
  } while (ExclusiveStartKey);

  return segmentItems;
}
