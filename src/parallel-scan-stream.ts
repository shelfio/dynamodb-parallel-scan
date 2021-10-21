import cloneDeep from 'lodash.clonedeep';
import times from 'lodash.times';
import Debug from 'debug';
import {DocumentClient} from 'aws-sdk/lib/dynamodb/document_client';
import {Readable} from 'stream';
import {scan} from './ddb';

const debug = Debug('ddb-parallel-scan');

export async function parallelScanAsStream(
  scanParams: DocumentClient.ScanInput,
  {concurrency, chunkSize}: {concurrency: number; chunkSize: number}
): Promise<Readable> {
  const segments: number[] = times(concurrency);
  const totalItemsLength = 0;

  const stream = new Readable({
    objectMode: true,
    highWaterMark: 1000, // TODO implement backpressure
    read() {
      return;
    },
  });

  debug(`Started parallel scan with ${concurrency} threads`);

  Promise.all(
    segments.map(async (_, segmentIndex) => {
      return getItemsFromSegment({
        scanParams,
        stream,
        concurrency,
        segmentIndex,
        chunkSize,
        totalItemsLength,
      });
    })
  ).then(() => {
    // mark that there will be nothing else pushed into a stream
    stream.push(null);
  });

  return stream;
}

async function getItemsFromSegment({
  scanParams,
  stream,
  concurrency,
  segmentIndex,
  chunkSize,
  totalItemsLength,
}: {
  scanParams: DocumentClient.ScanInput;
  stream: Readable;
  concurrency: number;
  segmentIndex: number;
  chunkSize: number;
  totalItemsLength: number;
}): Promise<void> {
  let segmentItems: DocumentClient.ItemList = [];
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

    totalItemsLength += Items.length;

    debug(
      `[${segmentIndex}/${concurrency}][done][time:${Date.now() - now}ms]` +
        `[fetched:${Items.length}][total:${totalItemsLength}]`,
      {ExclusiveStartKey}
    );

    segmentItems.push(...Items);

    if (segmentItems.length < chunkSize) {
      continue;
    }

    for (let i = 0; i < segmentItems.length; i += chunkSize) {
      stream.push(segmentItems.slice(i, i + chunkSize));
    }

    segmentItems = [];
  } while (ExclusiveStartKey);

  if (segmentItems.length) {
    stream.push(segmentItems);
  }
}
