import { ConditionOperator, QueryCondition } from '../types/index.ts';

/**
 * Parses a Microsoft Access criteria string expression into a structured QueryCondition object.
 * Examples supported:
 * - > 1000
 * - <= 50
 * - <> "Inactive" or != 'Inactive'
 * - Between 10 And 50
 * - Like "John*" or Like "*John*"
 * - In ("Active", "Pending") or In (1, 2, 3)
 * - Is Null or Is Not Null
 * - "Active" or 'Active'
 * - #2026-01-01#
 */
export function parseAccessCriteria(
  criteriaStr: string,
  tableAlias: string,
  columnName: string,
  conditionId: string
): QueryCondition | null {
  const trimmed = criteriaStr.trim();
  if (!trimmed) return null;

  // Clean date hashes: #2026-01-01# -> 2026-01-01
  const cleanVal = (val: string): any => {
    let s = val.trim();
    if (s.startsWith('#') && s.endsWith('#') && s.length > 2) {
      s = s.slice(1, -1).trim();
    }
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1);
    }
    // Number check
    if (!isNaN(Number(s)) && s !== '') {
      return Number(s);
    }
    return s;
  };

  // 1. IS NULL / IS NOT NULL
  if (/^is\s+null$/i.test(trimmed)) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'IS_NULL',
    };
  }
  if (/^is\s+not\s+null$/i.test(trimmed)) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'IS_NOT_NULL',
    };
  }

  // 2. BETWEEN val1 AND val2
  const betweenMatch = trimmed.match(/^between\s+(.+?)\s+and\s+(.+)$/i);
  if (betweenMatch) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'BETWEEN',
      value: cleanVal(betweenMatch[1]),
      valueTo: cleanVal(betweenMatch[2]),
    };
  }

  // 3. IN (...) / NOT IN (...)
  const notInMatch = trimmed.match(/^not\s+in\s*\((.+)\)$/i);
  if (notInMatch) {
    const items = notInMatch[1].split(',').map((v) => cleanVal(v.trim()));
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'NOT_IN',
      value: items,
    };
  }

  const inMatch = trimmed.match(/^in\s*\((.+)\)$/i);
  if (inMatch) {
    const items = inMatch[1].split(',').map((v) => cleanVal(v.trim()));
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'IN',
      value: items,
    };
  }

  // 4. LIKE "pattern"
  const likeMatch = trimmed.match(/^like\s+["']?([^"']+)["']?$/i);
  if (likeMatch) {
    let pattern = likeMatch[1];
    // Convert Access * wildcards to %
    if (pattern.startsWith('*') && pattern.endsWith('*')) {
      return {
        id: conditionId,
        tableAlias,
        columnName,
        operator: 'LIKE',
        value: pattern.slice(1, -1),
      };
    } else if (pattern.startsWith('*')) {
      return {
        id: conditionId,
        tableAlias,
        columnName,
        operator: 'ENDS_WITH',
        value: pattern.slice(1),
      };
    } else if (pattern.endsWith('*')) {
      return {
        id: conditionId,
        tableAlias,
        columnName,
        operator: 'STARTS_WITH',
        value: pattern.slice(0, -1),
      };
    } else {
      return {
        id: conditionId,
        tableAlias,
        columnName,
        operator: 'LIKE',
        value: pattern.replace(/\*/g, '%'),
      };
    }
  }

  // 5. Comparison operators (>=, <=, <>, !=, >, <, =)
  if (trimmed.startsWith('>=')) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'GREATER_EQUAL',
      value: cleanVal(trimmed.substring(2)),
    };
  }
  if (trimmed.startsWith('<=')) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'LESS_EQUAL',
      value: cleanVal(trimmed.substring(2)),
    };
  }
  if (trimmed.startsWith('<>') || trimmed.startsWith('!=')) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'NOT_EQUALS',
      value: cleanVal(trimmed.substring(2)),
    };
  }
  if (trimmed.startsWith('>')) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'GREATER_THAN',
      value: cleanVal(trimmed.substring(1)),
    };
  }
  if (trimmed.startsWith('<')) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'LESS_THAN',
      value: cleanVal(trimmed.substring(1)),
    };
  }
  if (trimmed.startsWith('=')) {
    return {
      id: conditionId,
      tableAlias,
      columnName,
      operator: 'EQUALS',
      value: cleanVal(trimmed.substring(1)),
    };
  }

  // 6. Default fallback: exact match / equals
  return {
    id: conditionId,
    tableAlias,
    columnName,
    operator: 'EQUALS',
    value: cleanVal(trimmed),
  };
}

/**
 * Formats a condition object back to an Access-style string
 */
export function formatConditionToAccessString(cond: QueryCondition): string {
  if (!cond) return '';

  switch (cond.operator) {
    case 'IS_NULL':
      return 'Is Null';
    case 'IS_NOT_NULL':
      return 'Is Not Null';
    case 'BETWEEN':
      return `Between ${cond.value} And ${cond.valueTo}`;
    case 'IN':
      return Array.isArray(cond.value)
        ? `In (${cond.value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(', ')})`
        : `In (${cond.value})`;
    case 'NOT_IN':
      return Array.isArray(cond.value)
        ? `Not In (${cond.value.map((v) => (typeof v === 'string' ? `"${v}"` : v)).join(', ')})`
        : `Not In (${cond.value})`;
    case 'GREATER_THAN':
      return `> ${cond.value}`;
    case 'GREATER_EQUAL':
      return `>= ${cond.value}`;
    case 'LESS_THAN':
      return `< ${cond.value}`;
    case 'LESS_EQUAL':
      return `<= ${cond.value}`;
    case 'NOT_EQUALS':
      return `<> ${typeof cond.value === 'string' ? `"${cond.value}"` : cond.value}`;
    case 'LIKE':
      return `Like "*${cond.value}*"`;
    case 'STARTS_WITH':
      return `Like "${cond.value}*"`;
    case 'ENDS_WITH':
      return `Like "*${cond.value}"`;
    case 'EQUALS':
    default:
      if (typeof cond.value === 'string') {
        return `"${cond.value}"`;
      }
      return `${cond.value ?? ''}`;
  }
}
