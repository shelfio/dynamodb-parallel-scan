import pMap from 'p-map';
import cloneDeep from 'lodash.clonedeep';
import times from 'lodash.times';
import Debug from 'debug';
import DynamoDB from 'aws-sdk/clients/dynamodb';
import {scan} from './ddb';

const debug = Debug('ddb-parallel-scan');

export async function parallelScan(
  scanParams: DynamoDB.ScanInput,
  {concurrency}
): Promise<DynamoDB.Types.ItemList> {
  const segments: number[] = times(concurrency);
  const docs: DynamoDB.ItemList = [];

  debug(`Started parallel scan with ${concurrency} threads`);

  await pMap(segments, async (_, segmentIndex) => {
    let ExclusiveStartKey: DynamoDB.Key;

    const params: DynamoDB.ScanInput = {
      ...cloneDeep(scanParams),
      Segment: segmentIndex,
      TotalSegments: concurrency
    };

    const now: number = Date.now();
    debug(`[${segmentIndex}/${concurrency}][start]`, {ExclusiveStartKey});

    do {
      if (ExclusiveStartKey) {
        params.ExclusiveStartKey = ExclusiveStartKey;
      }

      const {Items, LastEvaluatedKey} = await scan(params);
      ExclusiveStartKey = LastEvaluatedKey;

      docs.push(...Items);

      debug(
        `[${segmentIndex}/${concurrency}][done][time:${Date.now() - now}ms]` +
          `[fetched:${Items.length}][total:${docs.length}]`,
        {ExclusiveStartKey}
      );
    } while (ExclusiveStartKey);
  });

  debug(`Finished parallel scan with ${concurrency} threads. Fetched ${docs.length} items`);

  return docs;
}
