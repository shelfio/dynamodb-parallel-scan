import cloneDeep from 'lodash.clonedeep';
import times from 'lodash.times';
import Debug from 'debug';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {scan} from './ddb';

const debug = Debug('ddb-parallel-scan');

export async function parallelScan(
  scanParams: DocumentClient.ScanInput,
  {concurrency}: {concurrency: number}
): Promise<DocumentClient.ItemList> {
  const segments: number[] = times(concurrency);
  const totalItems: DocumentClient.ItemList = [];

  debug(`Started parallel scan with ${concurrency} threads`);

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

    const {Items, LastEvaluatedKey} = await scan(params);
    ExclusiveStartKey = LastEvaluatedKey;

    segmentItems.push(...Items);

    debug(
      `[${segmentIndex}/${concurrency}][done][time:${Date.now() - now}ms]` +
        `[fetched:${Items.length}][total:${totalItemsLength}]`,
      {ExclusiveStartKey}
    );
  } while (ExclusiveStartKey);

  return segmentItems;
}
