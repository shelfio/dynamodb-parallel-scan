import {insertMany} from './ddb';
import {parallelScanAsStream} from './parallel-scan-stream';

describe('parallelScanAsStream', () => {
  const files = [
    {id: 'some-file-id-1'},
    {id: 'some-file-id-2'},
    {id: 'some-file-id-3', fileSize: 100},
    {id: 'some-file-id-4'},
    {id: 'some-file-id-5'},
    {id: 'some-file-id-6', fileSize: 200},
    {id: 'some-file-id-7'},
    {id: 'some-file-id-8'},
    {id: 'some-file-id-9', fileSize: 300},
    {id: 'some-file-id-10'},
  ];

  beforeAll(async () => {
    await insertMany({items: files, tableName: 'files'});
  });

  it('should stream items with chunks of 2 with concurrency 1', async () => {
    const stream = await parallelScanAsStream(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#id)',
        ExpressionAttributeNames: {
          '#id': 'id',
        },
      },
      {concurrency: 1, chunkSize: 2}
    );

    for await (const chunk of stream) {
      expect(chunk).toHaveLength(2);
    }
  });

  it('should stream items with chunks of 2 with concurrency 5', async () => {
    const stream = await parallelScanAsStream(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#id)',
        ExpressionAttributeNames: {
          '#id': 'id',
        },
      },
      {concurrency: 5, chunkSize: 2}
    );

    const allItems = [];

    for await (const chunk of stream) {
      allItems.push(...chunk);

      expect(chunk.length >= 1).toBeTruthy();
    }

    expect(allItems).toHaveLength(10);
  });
});
