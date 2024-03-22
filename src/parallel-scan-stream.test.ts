jest.setTimeout(25000);

import {uniq} from 'lodash';
import * as ddbHelpers from './ddb';
import {parallelScanAsStream} from './parallel-scan-stream';
import {ddbv3DocClient} from './clients';

function delay(ms: number) {
  return new Promise(r => {
    setTimeout(r, ms);
  });
}

describe('parallelScanAsStream', () => {
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
    await ddbHelpers.insertMany({items: files, tableName: 'files'}, docClient);
  });

  it('should stream items with chunks of 2 with concurrency 1', async () => {
    const stream = await parallelScanAsStream(
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
        FilterExpression: 'attribute_exists(#id) and #isLarge = :false',
        ExpressionAttributeNames: {
          '#id': 'id',
          '#isLarge': 'isLarge',
        },
        ExpressionAttributeValues: {
          ':false': false,
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

  it('should pause calling dynamodb after highWaterMark reached', async () => {
    const scanSpy = jest.spyOn(ddbHelpers, 'scan');

    const megaByte = Buffer.alloc(1024 * 390); // Maximum allowed item size in ddb is 400KB
    const megaByteString = megaByte.toString();

    const docClient = ddbv3DocClient();
    await ddbHelpers.insertMany(
      {
        items: [
          {id: 'some-big-file-id-1', isLarge: true, payload: megaByteString},
          {id: 'some-big-file-id-2', isLarge: true, payload: megaByteString},
          {id: 'some-big-file-id-3', isLarge: true, payload: megaByteString},
          {id: 'some-big-file-id-4', isLarge: true, payload: megaByteString},
          {id: 'some-big-file-id-5', isLarge: true, payload: megaByteString},
        ],
        tableName: 'files',
      },
      docClient
    );

    const stream = await parallelScanAsStream(
      {
        TableName: 'files',
        FilterExpression: 'attribute_exists(#id) and #isLarge = :true',
        ExpressionAttributeNames: {
          '#id': 'id',
          '#isLarge': 'isLarge',
        },
        ExpressionAttributeValues: {
          ':true': true,
        },
      },
      {concurrency: 1, chunkSize: 1, highWaterMark: 1}
    );

    const scanCallsByIteration = [];
    for await (const _ of stream) {
      expect(_).not.toBeUndefined();

      await delay(1000);

      scanCallsByIteration.push(scanSpy.mock.calls.length);
    }

    const scanCallsByIterationUniq = uniq(scanCallsByIteration);

    expect(scanCallsByIterationUniq).toEqual([1, 2]);
  });
});
