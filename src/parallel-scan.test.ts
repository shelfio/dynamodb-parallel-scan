import {insertMany} from './ddb';
import {parallelScan} from './parallel-scan';
import {ddbv3DocClient, ddbv3Client} from './clients';

describe('parallelScan', () => {
  const files = [
    {id: 'some-file-id-1', isLarge: false},
    {id: 'some-file-id-2', isLarge: false},
    {id: 'some-file-id-3', fileSize: 100, isLarge: false},
    {id: 'some-file-id-4', isLarge: false},
    {id: 'some-file-id-5', isLarge: false},
    {id: 'some-file-id-6', fileSize: 200, isLarge: false},
    {id: 'some-file-id-7', isLarge: false},
    {id: 'some-file-id-8', isLarge: false},
    {id: 'some-file-id-9', fileSize: 300, isLarge: false},
    {id: 'some-file-id-10', isLarge: false},
  ];

  beforeAll(async () => {
    const docClient = ddbv3DocClient();
    await insertMany({items: files, tableName: 'files'}, docClient);
  });

  it('should return all items with concurrency 1', async () => {
    const items = await parallelScan(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#id) and #isLarge = :false',
        ExpressionAttributeNames: {
          '#id': 'id',
          '#isLarge': 'isLarge',
        },
        ExpressionAttributeValues: {
          ':false': false,
        },
      },
      {concurrency: 1}
    );

    expect(items).toHaveLength(10);

    for (const item of items!) {
      expect(files).toContainEqual(item);
    }
  });

  it('should return all items with concurrency 50', async () => {
    const items = await parallelScan(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#id) and #isLarge = :false',
        ExpressionAttributeNames: {
          '#id': 'id',
          '#isLarge': 'isLarge',
        },
        ExpressionAttributeValues: {
          ':false': false,
        },
      },
      {concurrency: 1}
    );

    expect(items).toHaveLength(10);

    for (const item of items!) {
      expect(files).toContainEqual(item);
    }
  });

  it('should return 3 items with concurrency 50', async () => {
    const items = await parallelScan(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#fileSize) and #isLarge = :false',
        ExpressionAttributeNames: {
          '#fileSize': 'fileSize',
          '#isLarge': 'isLarge',
        },
        ExpressionAttributeValues: {
          ':false': false,
        },
      },
      {concurrency: 1}
    );

    expect(items).toHaveLength(3);

    for (const item of items!) {
      expect(files).toContainEqual(item);
    }
  });
});
