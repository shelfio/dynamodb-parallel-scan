const files = {
  TableName: `files`,
  KeySchema: [{AttributeName: 'id', KeyType: 'HASH'}],
  AttributeDefinitions: [{AttributeName: 'id', AttributeType: 'S'}],
  ProvisionedThroughput: {ReadCapacityUnits: 1, WriteCapacityUnits: 1}
};

module.exports = [files];
