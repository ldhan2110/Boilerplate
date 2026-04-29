import { interpolateParams } from './typeorm-logger';

describe('interpolateParams', () => {
  it('should replace positional $N with string values', () => {
    const sql = 'SELECT * FROM users WHERE company_id = $1 AND status = $2';
    const params = ['comp_001', 'ACTIVE'];
    expect(interpolateParams(sql, params)).toBe(
      "SELECT * FROM users WHERE company_id = 'comp_001' AND status = 'ACTIVE'",
    );
  });

  it('should handle numbers without quotes', () => {
    const sql = 'SELECT * FROM users WHERE id = $1';
    const params = [42];
    expect(interpolateParams(sql, params)).toBe(
      'SELECT * FROM users WHERE id = 42',
    );
  });

  it('should handle booleans without quotes', () => {
    const sql = 'SELECT * FROM users WHERE active = $1';
    const params = [true];
    expect(interpolateParams(sql, params)).toBe(
      'SELECT * FROM users WHERE active = true',
    );
  });

  it('should handle null as NULL', () => {
    const sql = 'SELECT * FROM users WHERE deleted_at = $1';
    const params = [null];
    expect(interpolateParams(sql, params)).toBe(
      'SELECT * FROM users WHERE deleted_at = NULL',
    );
  });

  it('should handle undefined as NULL', () => {
    const sql = 'SELECT * FROM users WHERE deleted_at = $1';
    const params = [undefined];
    expect(interpolateParams(sql, params)).toBe(
      'SELECT * FROM users WHERE deleted_at = NULL',
    );
  });

  it('should handle arrays for IN clauses', () => {
    const sql = 'SELECT * FROM users WHERE id IN ($1)';
    const params = [['a', 'b', 'c']];
    expect(interpolateParams(sql, params)).toBe(
      "SELECT * FROM users WHERE id IN ('a','b','c')",
    );
  });

  it('should escape single quotes in strings', () => {
    const sql = 'SELECT * FROM users WHERE name = $1';
    const params = ["O'Brien"];
    expect(interpolateParams(sql, params)).toBe(
      "SELECT * FROM users WHERE name = 'O''Brien'",
    );
  });

  it('should handle empty params', () => {
    const sql = 'SELECT 1';
    expect(interpolateParams(sql, undefined)).toBe('SELECT 1');
    expect(interpolateParams(sql, [])).toBe('SELECT 1');
  });

  it('should handle multiple params in correct order', () => {
    const sql = 'INSERT INTO t (a, b, c) VALUES ($1, $2, $3)';
    const params = ['x', 10, null];
    expect(interpolateParams(sql, params)).toBe(
      "INSERT INTO t (a, b, c) VALUES ('x', 10, NULL)",
    );
  });
});
