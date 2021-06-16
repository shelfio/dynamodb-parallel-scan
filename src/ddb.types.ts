export type InsertManyParams = {
  items: DBItem[];
  tableName: string;
};

export type DBItem = Record<string, number | string | boolean>;
