/**
 * APEX FLOW FORM BUILDER: SAFE FORMULA & TOTALS CALCULATION ENGINE
 * Evaluates column totals, aggregates, and multi-column expressions without arbitrary code execution.
 */

import { DetailGridSummaryField, SummaryCalculationType } from '../types/forms.ts';

/**
 * Tokenize a mathematical expression safely.
 * Only allows column names, numbers, basic arithmetic operators, and parentheses.
 */
type Token =
  | { type: 'NUMBER'; value: number }
  | { type: 'IDENTIFIER'; name: string }
  | { type: 'OPERATOR'; op: '+' | '-' | '*' | '/' }
  | { type: 'LPAREN' }
  | { type: 'RPAREN' };

function tokenizeExpression(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const cleanExpr = expr.trim();

  while (i < cleanExpr.length) {
    const char = cleanExpr[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'OPERATOR', op: char });
      i++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN' });
      i++;
      continue;
    }

    // Number literal
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(cleanExpr[i + 1] || ''))) {
      let numStr = '';
      while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
        numStr += cleanExpr[i];
        i++;
      }
      tokens.push({ type: 'NUMBER', value: parseFloat(numStr) || 0 });
      continue;
    }

    // Identifier (column name or function name)
    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      while (i < cleanExpr.length && /[a-zA-Z0-9_]/.test(cleanExpr[i])) {
        ident += cleanExpr[i];
        i++;
      }
      tokens.push({ type: 'IDENTIFIER', name: ident });
      continue;
    }

    // Skip any unknown character safely
    i++;
  }

  return tokens;
}

/**
 * Safe Recursive Descent Parser to evaluate arithmetic expressions for a single record row.
 * Precedence: Parentheses > Multiplication/Division > Addition/Subtraction
 */
class ExpressionEvaluator {
  private tokens: Token[];
  private index = 0;
  private row: Record<string, any>;

  constructor(tokens: Token[], row: Record<string, any>) {
    this.tokens = tokens;
    this.row = row;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private consume(): Token {
    return this.tokens[this.index++];
  }

  // expr = term (( '+' | '-' ) term)*
  public parseExpression(): number {
    let result = this.parseTerm();

    while (this.peek()?.type === 'OPERATOR' && (this.peek() as any).op === '+' || this.peek()?.type === 'OPERATOR' && (this.peek() as any).op === '-') {
      const op = (this.consume() as any).op;
      const right = this.parseTerm();
      if (op === '+') {
        result += right;
      } else {
        result -= right;
      }
    }

    return result;
  }

  // term = factor (( '*' | '/' ) factor)*
  private parseTerm(): number {
    let result = this.parseFactor();

    while (this.peek()?.type === 'OPERATOR' && (this.peek() as any).op === '*' || this.peek()?.type === 'OPERATOR' && (this.peek() as any).op === '/') {
      const op = (this.consume() as any).op;
      const right = this.parseFactor();
      if (op === '*') {
        result *= right;
      } else {
        result = right === 0 ? 0 : result / right;
      }
    }

    return result;
  }

  // factor = NUMBER | IDENTIFIER | '(' expr ')' | '-' factor
  private parseFactor(): number {
    const token = this.consume();
    if (!token) return 0;

    if (token.type === 'NUMBER') {
      return token.value;
    }

    if (token.type === 'IDENTIFIER') {
      const colVal = this.row[token.name];
      if (colVal === null || colVal === undefined || colVal === '') return 0;
      const parsed = Number(colVal);
      return isNaN(parsed) ? 0 : parsed;
    }

    if (token.type === 'OPERATOR' && token.op === '-') {
      return -this.parseFactor();
    }

    if (token.type === 'LPAREN') {
      const val = this.parseExpression();
      if (this.peek()?.type === 'RPAREN') {
        this.consume();
      }
      return val;
    }

    return 0;
  }
}

/**
 * Safely parse a numeric value from any row column
 */
export function getNumericColumnValue(row: Record<string, any>, colName?: string): number {
  if (!colName || !row) return 0;
  const raw = row[colName];
  if (raw === null || raw === undefined || raw === '') return 0;
  const num = Number(raw);
  return isNaN(num) || !isFinite(num) ? 0 : num;
}

/**
 * Safely evaluates a row formula (e.g., `quantity * unit_price` or `(unit_price - discount) * quantity`)
 */
export function evaluateRowFormula(formula: string, row: Record<string, any>): number {
  if (!formula || !formula.trim()) return 0;
  try {
    // If the formula starts with SUM(...), extract the inner expression
    let inner = formula.trim();
    const sumMatch = inner.match(/^SUM\s*\((.*)\)$/i);
    if (sumMatch) {
      inner = sumMatch[1];
    }

    const tokens = tokenizeExpression(inner);
    if (tokens.length === 0) return 0;

    const evaluator = new ExpressionEvaluator(tokens, row);
    const result = evaluator.parseExpression();
    return isNaN(result) || !isFinite(result) ? 0 : result;
  } catch {
    return 0;
  }
}

/**
 * Format a numeric result into currency, number, or percentage with prefix/suffix
 */
export function formatSummaryValue(
  value: number,
  field: Pick<DetailGridSummaryField, 'format' | 'decimalPlaces' | 'prefix' | 'suffix'>
): string {
  const safeNum = isNaN(value) || !isFinite(value) ? 0 : value;
  const decimals = field.decimalPlaces !== undefined ? field.decimalPlaces : (field.format === 'currency' ? 2 : 0);
  const prefix = field.prefix || (field.format === 'currency' ? '$' : '');
  const suffix = field.suffix || (field.format === 'percentage' ? '%' : '');

  // Format with thousand separators
  const parts = safeNum.toFixed(decimals).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formattedNumber = parts.join('.');

  return `${prefix}${formattedNumber}${suffix}`;
}

/**
 * Calculate the summary total for a given summary field across all rows of the detail grid.
 */
export function calculateSummaryFieldValue(
  rows: Record<string, any>[],
  field: DetailGridSummaryField
): { rawValue: number; formattedValue: string } {
  if (!rows || rows.length === 0) {
    const def = 0;
    return {
      rawValue: def,
      formattedValue: formatSummaryValue(def, field),
    };
  }

  const { calculationType, sourceColumn, formula } = field;
  let rawValue = 0;

  switch (calculationType) {
    case 'SUM': {
      if (sourceColumn) {
        rawValue = rows.reduce((acc, row) => acc + getNumericColumnValue(row, sourceColumn), 0);
      } else if (formula) {
        rawValue = rows.reduce((acc, row) => acc + evaluateRowFormula(formula, row), 0);
      }
      break;
    }

    case 'COUNT': {
      if (sourceColumn) {
        // Count non-empty values
        rawValue = rows.filter((r) => r[sourceColumn] !== undefined && r[sourceColumn] !== null && String(r[sourceColumn]).trim() !== '').length;
      } else {
        rawValue = rows.length;
      }
      break;
    }

    case 'AVG': {
      if (sourceColumn) {
        const validRows = rows.filter((r) => {
          const val = r[sourceColumn];
          return val !== null && val !== undefined && String(val).trim() !== '' && !isNaN(Number(val));
        });
        const sum = validRows.reduce((acc, row) => acc + getNumericColumnValue(row, sourceColumn), 0);
        rawValue = validRows.length > 0 ? sum / validRows.length : 0;
      }
      break;
    }

    case 'MIN': {
      if (sourceColumn) {
        const validValues = rows
          .filter((r) => {
            const val = r[sourceColumn];
            return val !== null && val !== undefined && String(val).trim() !== '' && !isNaN(Number(val));
          })
          .map((r) => getNumericColumnValue(r, sourceColumn));
        rawValue = validValues.length > 0 ? Math.min(...validValues) : 0;
      }
      break;
    }

    case 'MAX': {
      if (sourceColumn) {
        const validValues = rows
          .filter((r) => {
            const val = r[sourceColumn];
            return val !== null && val !== undefined && String(val).trim() !== '' && !isNaN(Number(val));
          })
          .map((r) => getNumericColumnValue(r, sourceColumn));
        rawValue = validValues.length > 0 ? Math.max(...validValues) : 0;
      }
      break;
    }

    case 'FORMULA': {
      if (formula && formula.trim()) {
        // Evaluate expression across all rows
        rawValue = rows.reduce((acc, row) => acc + evaluateRowFormula(formula, row), 0);
      }
      break;
    }

    default:
      rawValue = 0;
  }

  // Ensure safe numeric result
  if (isNaN(rawValue) || !isFinite(rawValue)) {
    rawValue = 0;
  }

  return {
    rawValue,
    formattedValue: formatSummaryValue(rawValue, field),
  };
}

/**
 * Compute all configured summary totals for a detail grid
 */
export function computeGridTotals(
  rows: Record<string, any>[],
  summaryFields?: DetailGridSummaryField[]
): Record<string, { rawValue: number; formattedValue: string }> {
  const results: Record<string, { rawValue: number; formattedValue: string }> = {};

  if (!summaryFields || summaryFields.length === 0) {
    return results;
  }

  summaryFields.forEach((field) => {
    results[field.id] = calculateSummaryFieldValue(rows, field);
  });

  return results;
}
