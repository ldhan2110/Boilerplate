import { DataSource } from 'typeorm';

export const generateIdExpression = (prefix: string, sequenceName: string): string => {
  return `CONCAT('${prefix}', to_char(CURRENT_DATE, 'YYYYMMDD'), nextval('${sequenceName}'::regclass))`;
};

export const generateNoExpression = (prefix: string, sequenceName: string): string => {
  return `CONCAT(to_char(date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Ho_Chi_Minh'), 'YYYYMMDD'), '_${prefix}', to_char(nextval('${sequenceName}'::regclass), 'FM0000'))`;
};

export async function generateId(
  dataSource: DataSource,
  prefix: string,
  sequenceName: string,
): Promise<string> {
  const [result] = await dataSource.query(
    `SELECT ${generateIdExpression(prefix, sequenceName)} as id`,
  );
  return result.id;
}

export async function generateNo(
  dataSource: DataSource,
  prefix: string,
  sequenceName: string,
): Promise<string> {
  const [result] = await dataSource.query(
    `SELECT ${generateNoExpression(prefix, sequenceName)} as no`,
  );
  return result.no;
}
