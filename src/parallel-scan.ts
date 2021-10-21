import cloneDeep from 'lodash.clonedeep';
import times from 'lodash.times';
import Debug from 'debug';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {getTableItemsCount, scan} from './ddb';

const debug = Debug('ddb-parallel-scan');

let totalTableItemsCount = 0;
let totalScannedItemsCount = 0;

export async function parallelScan(
  scanParams: DocumentClient.ScanInput,
  {concurrency}: {concurrency: number}
): Promise<DocumentClient.ItemList> {
  totalTableItemsCount = await getTableItemsCount(scanParams.TableName);

  const segments: number[] = times(concurrency);
  const totalItems: DocumentClient.ItemList = [];

  debug(
    `Started parallel scan with ${concurrency} threads. Total items count: ${totalTableItemsCount}`
  );

  await Promise.all(
    segments.map(async (_, segmentIndex) => {
      const segmentItems = await getItemsFromSegment(scanParams, {
        concurrency,
        segmentIndex,
        totalItemsLength: totalItems.length,
      });

      totalItems.push(...segmentItems);
    })
  );

  debug(`Finished parallel scan with ${concurrency} threads. Fetched ${totalItems.length} items`);

  return totalItems;
}

async function getItemsFromSegment(
  scanParams: DocumentClient.ScanInput,
  {
    concurrency,
    segmentIndex,
    totalItemsLength,
  }: {concurrency: number; segmentIndex: number; totalItemsLength: number}
): Promise<DocumentClient.ItemList> {
  const segmentItems: DocumentClient.ItemList = [];
  let ExclusiveStartKey: DocumentClient.Key;

  const params: DocumentClient.ScanInput = {
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

    const {Items, LastEvaluatedKey, ScannedCount} = await scan(params);
    ExclusiveStartKey = LastEvaluatedKey;
    totalScannedItemsCount += ScannedCount;

    segmentItems.push(...Items);

    debug(
      `(${Math.round((totalScannedItemsCount / totalTableItemsCount) * 100)}%) ` +
        `[${segmentIndex}/${concurrency}] [time:${Date.now() - now}ms] ` +
        `[fetched:${Items.length}] ` +
        `[total (fetched/scanned/table-size):${totalItemsLength}/${totalScannedItemsCount}/${totalTableItemsCount}]`
    );
  } while (ExclusiveStartKey);

  return segmentItems;
}
