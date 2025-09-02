/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');

module.exports = async () => {
  const cwd = process.cwd();
  const mjsPath = path.resolve(cwd, 'jest-dynamodb-config.mjs');

  if (fs.existsSync(mjsPath)) {
    const mod = await import(pathToFileURL(mjsPath).href);

    return mod.default || mod;
  }

  // Fallback to built-in default if .mjs is absent
  return {
    tables: [
      {
        TableName: `files`,
        KeySchema: [{AttributeName: 'id', KeyType: 'HASH'}],
        AttributeDefinitions: [{AttributeName: 'id', AttributeType: 'S'}],
        ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1},
      },
    ],
  };
};
