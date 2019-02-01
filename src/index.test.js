import {insertMany} from './ddb';
import {parallelScan} from './';

describe('parallelScan', () => {
  const files = [
    {id: 'some-file-id-1'},
    {id: 'some-file-id-2'},
    {id: 'some-file-id-3'},
    {id: 'some-file-id-4'},
    {id: 'some-file-id-5'},
    {id: 'some-file-id-6'},
    {id: 'some-file-id-7'},
    {id: 'some-file-id-8'},
    {id: 'some-file-id-9'},
    {id: 'some-file-id-10'}
  ];

  beforeAll(async () => {
    await insertMany({items: files, tableName: 'files'});
  });

  it('should return all items with concurrency 1', async () => {
    const items = await parallelScan(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#id)',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ProjectionExpression: 'id'
      },
      {concurrency: 1}
    );

    expect(items).toHaveLength(10);

    for (let item of items) {
      expect(files).toContainEqual(item);
    }
  });

  it('should return all items with concurrency 50', async () => {
    const items = await parallelScan(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#id)',
        ExpressionAttributeNames: {
          '#id': 'id'
        },
        ProjectionExpression: 'id'
      },
      {concurrency: 1}
    );

    expect(items).toHaveLength(10);

    for (let item of items) {
      expect(files).toContainEqual(item);
    }
  });
});
