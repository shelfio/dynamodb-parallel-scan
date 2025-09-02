# dynamodb-parallel-scan [![CircleCI](https://circleci.com/gh/shelfio/dynamodb-parallel-scan/tree/master.svg?style=svg)](https://circleci.com/gh/shelfio/dynamodb-parallel-scan/tree/master) ![](https://img.shields.io/badge/code_style-prettier-ff69b4.svg) [![npm (scoped)](https://img.shields.io/npm/v/@shelf/dynamodb-parallel-scan.svg)](https://www.npmjs.com/package/@shelf/dynamodb-parallel-scan)

> Scan DynamoDB table concurrently (up to 1,000,000 segments), recursively read all items from every segment

[A blog post going into details about this library.](https://vladholubiev.medium.com/how-to-scan-a-23-gb-dynamodb-table-in-1-minute-110730879e2b)

## Install

```
$ pnpm add @shelf/dynamodb-parallel-scan
```

This library targets ESM and AWS SDK v3. Install alongside peer deps:

```
pnpm add @shelf/dynamodb-parallel-scan @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb
```

Requires Node.js 22+.

## Why this is better than a regular scan

**Easily parallelize** scan requests to fetch all items from a table at once.
This is useful when you need to scan a large table to find a small number of items that will fit the node.js memory.

**Scan huge tables using async generator** or stream.
And yes, it supports streams backpressure!
Useful when you need to process a large number of items while you scan them.
It allows receiving chunks of scanned items, wait until you process them, and then resume scanning when you're ready.

## Usage

### Fetch everything at once

```ts
import {parallelScan} from '@shelf/dynamodb-parallel-scan';

const items = await parallelScan(
  {
    TableName: 'files',
    FilterExpression: 'attribute_exists(#fileSize)',
    ExpressionAttributeNames: {
      '#fileSize': 'fileSize',
    },
    ProjectionExpression: 'fileSize',
  },
  {concurrency: 1000}
);

console.log(items);
```

### Use as async generator (or streams)

Note: `highWaterMark` determines items count threshold, so Parallel Scan can fetch `concurrency` \* 1MB more data even after highWaterMark was reached.

```ts
import {parallelScanAsStream} from '@shelf/dynamodb-parallel-scan';

const stream = await parallelScanAsStream(
  {
    TableName: 'files',
    FilterExpression: 'attribute_exists(#fileSize)',
    ExpressionAttributeNames: {
      '#fileSize': 'fileSize',
    },
    ProjectionExpression: 'fileSize',
  },
  {concurrency: 1000, chunkSize: 10000, highWaterMark: 10000}
);

for await (const items of stream) {
  console.log(items); // 10k items here
}
```

### CommonJS Consumers

This package is ESM-only. In CommonJS, use dynamic import:

```js
const {parallelScan, parallelScanAsStream} = await import('@shelf/dynamodb-parallel-scan');
```

## Read

- [Taking Advantage of Parallel Scans](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html)
- [Working with Scans](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html)

![](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/images/ParallelScan.png)

## Publish

```sh
$ pnpm dlx np
```

## License

MIT © [Shelf](https://shelf.io)
