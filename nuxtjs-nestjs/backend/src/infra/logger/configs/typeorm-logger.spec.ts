import { interpolateParams, formatSql } from './typeorm-logger';

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

describe('formatSql', () => {
  it('should break SELECT/FROM/WHERE onto separate lines', () => {
    const sql = "SELECT u.id, u.name FROM users u WHERE u.status = 'ACTIVE'";
    const result = formatSql(sql);
    expect(result).toBe(
      "SELECT u.id, u.name\n  FROM users u\n  WHERE u.status = 'ACTIVE'",
    );
  });

  it('should indent AND/OR as sub-clauses', () => {
    const sql = "SELECT * FROM users WHERE status = 'ACTIVE' AND role = 'ADMIN' OR deleted = false";
    const result = formatSql(sql);
    expect(result).toContain("\n    AND role = 'ADMIN'");
    expect(result).toContain("\n    OR deleted = false");
  });

  it('should handle JOIN clauses', () => {
    const sql = "SELECT u.*, r.name FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.active = true";
    const result = formatSql(sql);
    expect(result).toContain('\n  LEFT JOIN roles r');
    expect(result).toContain('\n    ON r.id = u.role_id');
  });

  it('should handle ORDER BY, GROUP BY, LIMIT, OFFSET', () => {
    const sql = 'SELECT * FROM users GROUP BY dept ORDER BY name LIMIT 10 OFFSET 20';
    const result = formatSql(sql);
    expect(result).toContain('\n  GROUP BY dept');
    expect(result).toContain('\n  ORDER BY name');
    expect(result).toContain('\n  LIMIT 10');
    expect(result).toContain('\n  OFFSET 20');
  });

  it('should collapse multiple whitespace', () => {
    const sql = 'SELECT  *   FROM    users    WHERE   id = 1';
    const result = formatSql(sql);
    expect(result).not.toContain('  *');
    expect(result).toContain('SELECT *');
  });

  it('should handle INSERT INTO / VALUES', () => {
    const sql = "INSERT INTO users (name, email) VALUES ('foo', 'foo@bar.com')";
    const result = formatSql(sql);
    expect(result).toContain('INSERT INTO users (name, email)');
    expect(result).toContain("\n  VALUES ('foo', 'foo@bar.com')");
  });
});
