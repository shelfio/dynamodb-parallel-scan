# dynamodb-parallel-scan [![CircleCI](https://circleci.com/gh/shelfio/dynamodb-parallel-scan/tree/master.svg?style=svg)](https://circleci.com/gh/shelfio/dynamodb-parallel-scan/tree/master) ![](https://img.shields.io/badge/code_style-prettier-ff69b4.svg) [![npm (scoped)](https://img.shields.io/npm/v/@shelf/dynamodb-parallel-scan.svg)](https://www.npmjs.com/package/@shelf/dynamodb-parallel-scan)

> Scan DynamoDB table concurrently (up to 1,000,000 segments), recursively read all items from every segment

## Install

```
$ yarn add @shelf/dynamodb-parallel-scan
```

This library has 2 peer dependencies:

- `@aws-sdk/client-dynamodb`
- `@aws-sdk/lib-dynamodb`

Make sure to install them alongside this library.

## Usage

### Fetch everything at once

```js
const {parallelScan} = require('@shelf/dynamodb-parallel-scan');

(async () => {
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
})();
```

### Use as async generator (or streams)

Note: `highWaterMark` determines items count threshold, so Parallel Scan can fetch `concurrency` \* 1MB more data even after highWaterMark was reached.

```js
const {parallelScanAsStream} = require('@shelf/dynamodb-parallel-scan');

(async () => {
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
})();
```

## Read

- [Taking Advantage of Parallel Scans](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-query-scan.html)
- [Working with Scans](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Scan.html)

![](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/images/ParallelScan.png)

## Publish

```sh
$ git checkout master
$ yarn version
$ yarn publish
$ git push origin master --tags
```

## License

MIT © [Shelf](https://shelf.io)
