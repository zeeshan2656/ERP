import { databaseService } from '../database/database.service.js';
// Allowlisted SQL functions for calculated columns
const ALLOWED_SQL_FUNCTIONS = new Set([
    'CONCAT',
    'UPPER',
    'LOWER',
    'TRIM',
    'LENGTH',
    'SUBSTRING',
    'COALESCE',
    'NULLIF',
    'IFNULL',
    'ROUND',
    'ABS',
    'CEIL',
    'FLOOR',
    'NOW',
    'CURDATE',
    'DATEDIFF',
    'DATE_ADD',
    'DATE_SUB',
    'YEAR',
    'MONTH',
    'DAY',
    'CASE',
    'WHEN',
    'THEN',
    'ELSE',
    'END',
    'SUM',
    'AVG',
    'MIN',
    'MAX',
    'COUNT',
]);
export class SqlGeneratorService {
    /**
     * Safe identifier quoting helper
     */
    quote(identifier) {
        return databaseService.quoteIdentifier(identifier);
    }
    /**
     * Quotes a table.column or alias.column reference
     */
    quoteQualified(tableAlias, columnName) {
        return `${this.quote(tableAlias)}.${this.quote(columnName)}`;
    }
    /**
     * Validates a calculated column formula against an allowlisted grammar.
     * Disallows dangerous statements, subqueries, semicolons, comments, or arbitrary code.
     */
    /**
     * Validates a calculated column formula against an allowlisted grammar.
     * Disallows dangerous statements, subqueries, semicolons, comments, or arbitrary code.
     * Supports Microsoft Access bracket notation like [tableName].[columnName] or [columnName].
     */
    validateAndSanitizeFormula(formula, tableAliases) {
        let trimmed = formula.trim();
        if (!trimmed) {
            throw new Error('Formula expression cannot be empty.');
        }
        // Convert Access bracket syntax [table].[column] or [column] to standard identifier syntax
        trimmed = trimmed.replace(/\[([a-zA-Z0-9_]+)\]\.\[([a-zA-Z0-9_]+)\]/g, '$1.$2');
        trimmed = trimmed.replace(/\[([a-zA-Z0-9_]+)\]/g, '$1');
        // Prohibit semicolons, comments, drop, delete, insert, update
        if (/;|--|\/\*|\*\/|@@|xp_|benchmark|sleep|into\s+outfile|into\s+dumpfile/i.test(trimmed)) {
            throw new Error(`Formula contains prohibited tokens: '${trimmed}'`);
        }
        // Tokenize words to verify functions and column references
        const words = trimmed.match(/[a-zA-Z_][a-zA-Z0-9_.]*/g) || [];
        for (const word of words) {
            if (word.includes('.')) {
                // Qualified column: tableAlias.column
                const [alias, col] = word.split('.');
                if (!tableAliases.has(alias)) {
                    throw new Error(`Formula references unknown table alias: '${alias}' in '${word}'`);
                }
                databaseService.quoteIdentifier(alias);
                databaseService.quoteIdentifier(col);
            }
            else {
                const upper = word.toUpperCase();
                // Check if keyword / function is allowed
                const isAllowedFunc = ALLOWED_SQL_FUNCTIONS.has(upper);
                const isAlias = tableAliases.has(word);
                const isOperator = ['AND', 'OR', 'NOT', 'IS', 'NULL', 'LIKE', 'IN', 'BETWEEN', 'AS', 'TRUE', 'FALSE'].includes(upper);
                if (!isAllowedFunc && !isAlias && !isOperator) {
                    // If word is a single column name and only one table exists, that's valid
                    if (tableAliases.size === 1) {
                        databaseService.quoteIdentifier(word);
                    }
                    else {
                        // Check if it's an operator or function
                        throw new Error(`Disallowed function or unmapped identifier in formula: '${word}'`);
                    }
                }
            }
        }
        return trimmed;
    }
    /**
     * Helper to parse Access-style criteria string into QueryFilterCondition
     */
    parseCriteriaString(criteriaStr, tableAlias, columnName) {
        const trimmed = criteriaStr.trim();
        if (!trimmed)
            return null;
        const cleanVal = (val) => {
            let s = val.trim();
            if (s.startsWith('#') && s.endsWith('#') && s.length > 2) {
                s = s.slice(1, -1).trim();
            }
            if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
                return s.slice(1, -1);
            }
            if (!isNaN(Number(s)) && s !== '') {
                return Number(s);
            }
            return s;
        };
        if (/^is\s+null$/i.test(trimmed)) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'isNull' };
        }
        if (/^is\s+not\s+null$/i.test(trimmed)) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'isNotNull' };
        }
        const betweenMatch = trimmed.match(/^between\s+(.+?)\s+and\s+(.+)$/i);
        if (betweenMatch) {
            return {
                id: `c_${Date.now()}_${Math.random()}`,
                tableAlias,
                columnName,
                operator: 'between',
                value: cleanVal(betweenMatch[1]),
                value2: cleanVal(betweenMatch[2]),
            };
        }
        const notInMatch = trimmed.match(/^not\s+in\s*\((.+)\)$/i);
        if (notInMatch) {
            const items = notInMatch[1].split(',').map((v) => cleanVal(v.trim()));
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'notIn', value: items };
        }
        const inMatch = trimmed.match(/^in\s*\((.+)\)$/i);
        if (inMatch) {
            const items = inMatch[1].split(',').map((v) => cleanVal(v.trim()));
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'in', value: items };
        }
        const likeMatch = trimmed.match(/^like\s+["']?([^"']+)["']?$/i);
        if (likeMatch) {
            const pattern = likeMatch[1];
            if (pattern.startsWith('*') && pattern.endsWith('*')) {
                return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'contains', value: pattern.slice(1, -1) };
            }
            else if (pattern.startsWith('*')) {
                return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'endsWith', value: pattern.slice(1) };
            }
            else if (pattern.endsWith('*')) {
                return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'startsWith', value: pattern.slice(0, -1) };
            }
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'contains', value: pattern.replace(/\*/g, '') };
        }
        if (trimmed.startsWith('>=')) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'greaterThanOrEqual', value: cleanVal(trimmed.substring(2)) };
        }
        if (trimmed.startsWith('<=')) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'lessThanOrEqual', value: cleanVal(trimmed.substring(2)) };
        }
        if (trimmed.startsWith('<>') || trimmed.startsWith('!=')) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'doesNotEqual', value: cleanVal(trimmed.substring(2)) };
        }
        if (trimmed.startsWith('>')) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'greaterThan', value: cleanVal(trimmed.substring(1)) };
        }
        if (trimmed.startsWith('<')) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'lessThan', value: cleanVal(trimmed.substring(1)) };
        }
        if (trimmed.startsWith('=')) {
            return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'equals', value: cleanVal(trimmed.substring(1)) };
        }
        return { id: `c_${Date.now()}_${Math.random()}`, tableAlias, columnName, operator: 'equals', value: cleanVal(trimmed) };
    }
    /**
     * Generates safe parameterized MySQL SQL from a Visual Query Definition.
     */
    generate(def, parameterValues = {}) {
        const params = [];
        const warnings = [];
        if (!def.tables || def.tables.length === 0) {
            throw new Error('Query must include at least one database table.');
        }
        // Map table aliases for validation
        const tableAliasMap = new Map();
        def.tables.forEach((t) => {
            if (tableAliasMap.has(t.alias)) {
                throw new Error(`Duplicate table alias detected: '${t.alias}'`);
            }
            tableAliasMap.set(t.alias, t);
        });
        const knownAliases = new Set(tableAliasMap.keys());
        // 1. SELECT CLAUSE
        const selectItems = [];
        const orderItems = [];
        // Check if Access-style gridColumns are provided
        if (def.gridColumns && def.gridColumns.length > 0) {
            const visibleGridCols = def.gridColumns.filter((c) => c.isVisible !== false);
            visibleGridCols.forEach((col, idx) => {
                const aliasPart = col.alias ? ` AS ${this.quote(col.alias)}` : ` AS ${this.quote(col.columnName || `col_${idx + 1}`)}`;
                if (col.isCalculated && col.calculatedFormula) {
                    const sanitizedFormula = this.validateAndSanitizeFormula(col.calculatedFormula, knownAliases);
                    if (col.aggregate && col.aggregate !== 'NONE') {
                        selectItems.push(`${col.aggregate}(${sanitizedFormula})${aliasPart}`);
                    }
                    else {
                        selectItems.push(`(${sanitizedFormula})${aliasPart}`);
                    }
                }
                else if (col.tableAlias && col.columnName) {
                    if (!knownAliases.has(col.tableAlias)) {
                        throw new Error(`Column references invalid table alias: '${col.tableAlias}'`);
                    }
                    const qualified = this.quoteQualified(col.tableAlias, col.columnName);
                    if (col.aggregate && col.aggregate !== 'NONE') {
                        if (col.aggregate === 'COUNT_DISTINCT') {
                            selectItems.push(`COUNT(DISTINCT ${qualified})${aliasPart}`);
                        }
                        else {
                            selectItems.push(`${col.aggregate}(${qualified})${aliasPart}`);
                        }
                    }
                    else {
                        selectItems.push(`${qualified}${aliasPart}`);
                    }
                }
                // Sorting
                if (col.sortOrder === 'ASC' || col.sortOrder === 'DESC') {
                    const target = col.isCalculated ? this.quote(col.alias || `col_${idx + 1}`) : this.quoteQualified(col.tableAlias, col.columnName);
                    orderItems.push({
                        sql: `${target} ${col.sortOrder}`,
                        priority: col.sortPriority || (idx + 1) * 10,
                    });
                }
            });
        }
        else {
            // Legacy columns definition
            const visibleCols = (def.columns || []).filter((c) => c.isVisible !== false);
            const visibleCalculated = (def.calculatedColumns || []).filter((c) => c.isVisible !== false);
            visibleCols.forEach((c) => {
                if (!knownAliases.has(c.tableAlias)) {
                    throw new Error(`Column references invalid table alias: '${c.tableAlias}'`);
                }
                const qualified = this.quoteQualified(c.tableAlias, c.columnName);
                const aliasPart = c.alias ? ` AS ${this.quote(c.alias)}` : ` AS ${this.quote(`${c.tableAlias}_${c.columnName}`)}`;
                if (c.aggregate && c.aggregate !== 'NONE') {
                    if (c.aggregate === 'COUNT_DISTINCT') {
                        selectItems.push(`COUNT(DISTINCT ${qualified})${aliasPart}`);
                    }
                    else {
                        selectItems.push(`${c.aggregate}(${qualified})${aliasPart}`);
                    }
                }
                else {
                    selectItems.push(`${qualified}${aliasPart}`);
                }
                if (c.sortOrder) {
                    orderItems.push({
                        sql: `${this.quoteQualified(c.tableAlias, c.columnName)} ${c.sortOrder.toUpperCase()}`,
                        priority: c.sortPriority || 10,
                    });
                }
            });
            visibleCalculated.forEach((calc) => {
                const sanitizedFormula = this.validateAndSanitizeFormula(calc.formula, knownAliases);
                const aliasPart = ` AS ${this.quote(calc.alias)}`;
                if (calc.aggregate && calc.aggregate !== 'NONE') {
                    selectItems.push(`${calc.aggregate}(${sanitizedFormula})${aliasPart}`);
                }
                else {
                    selectItems.push(`(${sanitizedFormula})${aliasPart}`);
                }
                if (calc.sortOrder) {
                    orderItems.push({
                        sql: `${this.quote(calc.alias)} ${calc.sortOrder.toUpperCase()}`,
                        priority: calc.sortPriority || 10,
                    });
                }
            });
        }
        if (selectItems.length === 0) {
            // Default to all columns from primary table if none selected
            const primaryAlias = def.tables[0].alias;
            selectItems.push(`${this.quote(primaryAlias)}.*`);
        }
        const distinctPart = def.isDistinct ? 'DISTINCT ' : '';
        const selectSql = `SELECT ${distinctPart}${selectItems.join(', ')}`;
        // 2. FROM & JOIN CLAUSE
        // Identify primary table: pick the first table that participates in a join, or def.tables[0]
        const ALLOWED_JOIN_OPERATORS = new Set(['=', '<>', '!=', '>', '<', '>=', '<=']);
        let primaryTable = def.tables[0];
        if (def.joins && def.joins.length > 0) {
            const joinedTableAlias = def.tables.find((t) => def.joins.some((j) => (j.leftTableAlias || j.sourceTableAlias) === t.alias ||
                (j.rightTableAlias || j.targetTableAlias) === t.alias));
            if (joinedTableAlias) {
                primaryTable = joinedTableAlias;
            }
        }
        let fromSql = `FROM ${this.quote(primaryTable.tableName)} AS ${this.quote(primaryTable.alias)}`;
        const joinedAliases = new Set([primaryTable.alias]);
        const remainingJoins = [...(def.joins || [])];
        let progress = true;
        while (remainingJoins.length > 0 && progress) {
            progress = false;
            for (let i = 0; i < remainingJoins.length; i++) {
                const join = remainingJoins[i];
                const leftAlias = join.leftTableAlias || join.sourceTableAlias;
                const rightAlias = join.rightTableAlias || join.targetTableAlias;
                const leftColName = join.leftColumn || join.sourceColumn;
                const rightColName = join.rightColumn || join.targetColumn;
                const rawOp = (join.operator || '=').trim();
                const op = ALLOWED_JOIN_OPERATORS.has(rawOp) ? (rawOp === '!=' ? '<>' : rawOp) : '=';
                let joinType = (join.joinType || 'INNER').toUpperCase();
                if (joinType === 'FULL' || joinType === 'FULL OUTER') {
                    joinType = 'FULL OUTER';
                    warnings.push('FULL OUTER JOIN is not natively supported by MySQL; consider using LEFT or RIGHT JOIN instead.');
                }
                if (joinedAliases.has(leftAlias) && !joinedAliases.has(rightAlias)) {
                    const targetTable = tableAliasMap.get(rightAlias);
                    if (!targetTable) {
                        remainingJoins.splice(i, 1);
                        progress = true;
                        break;
                    }
                    const leftCol = this.quoteQualified(leftAlias, leftColName);
                    const rightCol = this.quoteQualified(rightAlias, rightColName);
                    if (joinType === 'CROSS') {
                        fromSql += `\nCROSS JOIN ${this.quote(targetTable.tableName)} AS ${this.quote(rightAlias)}`;
                        warnings.push(`CROSS JOIN between ${leftAlias} and ${rightAlias} may produce a large Cartesian product.`);
                    }
                    else {
                        fromSql += `\n${joinType} JOIN ${this.quote(targetTable.tableName)} AS ${this.quote(rightAlias)} ON ${leftCol} ${op} ${rightCol}`;
                    }
                    joinedAliases.add(rightAlias);
                    remainingJoins.splice(i, 1);
                    progress = true;
                    break;
                }
                else if (joinedAliases.has(rightAlias) && !joinedAliases.has(leftAlias)) {
                    const targetTable = tableAliasMap.get(leftAlias);
                    if (!targetTable) {
                        remainingJoins.splice(i, 1);
                        progress = true;
                        break;
                    }
                    const leftCol = this.quoteQualified(leftAlias, leftColName);
                    const rightCol = this.quoteQualified(rightAlias, rightColName);
                    const invertedJoinType = joinType === 'LEFT' ? 'RIGHT' :
                        joinType === 'RIGHT' ? 'LEFT' :
                            joinType === 'LEFT OUTER' ? 'RIGHT OUTER' :
                                joinType === 'RIGHT OUTER' ? 'LEFT OUTER' :
                                    joinType;
                    if (invertedJoinType === 'CROSS') {
                        fromSql += `\nCROSS JOIN ${this.quote(targetTable.tableName)} AS ${this.quote(leftAlias)}`;
                        warnings.push(`CROSS JOIN between ${leftAlias} and ${rightAlias} may produce a large Cartesian product.`);
                    }
                    else {
                        fromSql += `\n${invertedJoinType} JOIN ${this.quote(targetTable.tableName)} AS ${this.quote(leftAlias)} ON ${leftCol} ${op} ${rightCol}`;
                    }
                    joinedAliases.add(leftAlias);
                    remainingJoins.splice(i, 1);
                    progress = true;
                    break;
                }
                else if (joinedAliases.has(leftAlias) && joinedAliases.has(rightAlias)) {
                    // Additional join condition between already joined tables
                    const leftCol = this.quoteQualified(leftAlias, leftColName);
                    const rightCol = this.quoteQualified(rightAlias, rightColName);
                    fromSql += ` AND ${leftCol} ${op} ${rightCol}`;
                    remainingJoins.splice(i, 1);
                    progress = true;
                    break;
                }
            }
        }
        // Check for unjoined tables
        if (def.tables.length > 1 && joinedAliases.size < def.tables.length) {
            const unjoined = def.tables.filter((t) => !joinedAliases.has(t.alias)).map((t) => t.alias);
            warnings.push(`Tables [${unjoined.join(', ')}] are not connected via JOIN conditions. This will perform a Cartesian CROSS JOIN.`);
            unjoined.forEach((uAlias) => {
                const uTable = tableAliasMap.get(uAlias);
                fromSql += `\nCROSS JOIN ${this.quote(uTable.tableName)} AS ${this.quote(uAlias)}`;
            });
        }
        // 3. WHERE CLAUSE (Both from gridColumns criteria matrix and whereFilters)
        const whereClauses = [];
        // Parse gridColumns criteria matrix
        if (def.gridColumns && def.gridColumns.length > 0) {
            // Row 0: primary criteria (AND)
            const row0Conditions = [];
            // Row 1..N: orCriteria
            const orRowConditions = [];
            def.gridColumns.forEach((gc) => {
                if (!gc.tableAlias || !gc.columnName)
                    return;
                if (gc.criteria && gc.criteria.trim()) {
                    const parsed = this.parseCriteriaString(gc.criteria, gc.tableAlias, gc.columnName);
                    if (parsed)
                        row0Conditions.push(parsed);
                }
                if (gc.orCriteria && Array.isArray(gc.orCriteria)) {
                    gc.orCriteria.forEach((orCrit, orIdx) => {
                        if (orCrit && orCrit.trim()) {
                            if (!orRowConditions[orIdx])
                                orRowConditions[orIdx] = [];
                            const parsed = this.parseCriteriaString(orCrit, gc.tableAlias, gc.columnName);
                            if (parsed)
                                orRowConditions[orIdx].push(parsed);
                        }
                    });
                }
            });
            const orBranches = [];
            if (row0Conditions.length > 0) {
                const row0Sql = row0Conditions
                    .map((cond) => this.buildConditionClause(cond, knownAliases, parameterValues, params))
                    .filter(Boolean)
                    .join(' AND ');
                if (row0Sql)
                    orBranches.push(row0Sql);
            }
            orRowConditions.forEach((orRow) => {
                if (orRow.length > 0) {
                    const orRowSql = orRow
                        .map((cond) => this.buildConditionClause(cond, knownAliases, parameterValues, params))
                        .filter(Boolean)
                        .join(' AND ');
                    if (orRowSql)
                        orBranches.push(orRowSql);
                }
            });
            if (orBranches.length === 1) {
                whereClauses.push(orBranches[0]);
            }
            else if (orBranches.length > 1) {
                whereClauses.push(`(${orBranches.map((b) => `(${b})`).join(' OR ')})`);
            }
        }
        // Traditional whereFilters
        const activeFilters = def.whereFilters || def.filters;
        if (activeFilters && activeFilters.conditions && activeFilters.conditions.length > 0) {
            const whereCondition = this.buildFilterGroup(activeFilters, knownAliases, parameterValues, params);
            if (whereCondition) {
                whereClauses.push(whereCondition);
            }
        }
        let whereSql = '';
        if (whereClauses.length > 0) {
            whereSql = `\nWHERE ${whereClauses.join(' AND ')}`;
        }
        // 4. GROUP BY & HAVING
        let groupBySql = '';
        const groupByItems = [];
        const colsForGroup = def.gridColumns && def.gridColumns.length > 0
            ? def.gridColumns.filter((c) => c.isVisible !== false)
            : (def.columns || []).filter((c) => c.isVisible !== false);
        colsForGroup.forEach((c) => {
            if (c.isGroupBy && c.tableAlias && c.columnName) {
                groupByItems.push(this.quoteQualified(c.tableAlias, c.columnName));
            }
        });
        if (def.groupByColumns && def.groupByColumns.length > 0) {
            def.groupByColumns.forEach((colId) => {
                const matched = (def.columns || []).find((c) => c.id === colId);
                if (matched) {
                    const item = this.quoteQualified(matched.tableAlias, matched.columnName);
                    if (!groupByItems.includes(item)) {
                        groupByItems.push(item);
                    }
                }
            });
        }
        if (groupByItems.length > 0) {
            groupBySql = `\nGROUP BY ${groupByItems.join(', ')}`;
        }
        let havingSql = '';
        const activeHaving = def.havingFilters || def.having;
        if (activeHaving && activeHaving.conditions && activeHaving.conditions.length > 0) {
            const havingCondition = this.buildFilterGroup(activeHaving, knownAliases, parameterValues, params);
            if (havingCondition) {
                havingSql = `\nHAVING ${havingCondition}`;
            }
        }
        // 5. ORDER BY CLAUSE
        if (orderItems.length === 0) {
            const visibleCols = (def.columns || []).filter((c) => c.isVisible !== false);
            const visibleCalculated = (def.calculatedColumns || []).filter((c) => c.isVisible !== false);
            visibleCols.forEach((c) => {
                if (c.sortOrder) {
                    orderItems.push({
                        sql: `${this.quoteQualified(c.tableAlias, c.columnName)} ${c.sortOrder.toUpperCase()}`,
                        priority: c.sortPriority || 10,
                    });
                }
            });
            visibleCalculated.forEach((calc) => {
                if (calc.sortOrder) {
                    orderItems.push({
                        sql: `${this.quote(calc.alias)} ${calc.sortOrder.toUpperCase()}`,
                        priority: calc.sortPriority || 10,
                    });
                }
            });
        }
        let orderBySql = '';
        if (orderItems.length > 0) {
            orderItems.sort((a, b) => a.priority - b.priority);
            orderBySql = `\nORDER BY ${orderItems.map((o) => o.sql).join(', ')}`;
        }
        // 6. LIMIT & OFFSET
        let limitSql = '';
        if (def.limit !== undefined) {
            const safeLimit = Math.min(Math.max(1, def.limit), 5000);
            limitSql = `\nLIMIT ?`;
            params.push(safeLimit);
            if (def.offset !== undefined && def.offset > 0) {
                limitSql += ` OFFSET ?`;
                params.push(def.offset);
            }
        }
        const fullSql = `${selectSql}\n${fromSql}${whereSql}${groupBySql}${havingSql}${orderBySql}${limitSql};`;
        return {
            sql: fullSql,
            params,
            warnings,
        };
    }
    /**
     * Recursively compiles a QueryFilterGroup (AND/OR tree) with parameter bindings
     */
    buildFilterGroup(group, knownAliases, parameterValues, params) {
        const parts = [];
        for (const cond of group.conditions) {
            if ('logicalOperator' in cond && 'conditions' in cond) {
                // Nested sub-group
                const nested = this.buildFilterGroup(cond, knownAliases, parameterValues, params);
                if (nested) {
                    parts.push(`(${nested})`);
                }
            }
            else {
                const item = cond;
                const conditionPart = this.buildConditionClause(item, knownAliases, parameterValues, params);
                if (conditionPart) {
                    parts.push(conditionPart);
                }
            }
        }
        if (parts.length === 0)
            return '';
        return parts.join(` ${group.logicalOperator || 'AND'} `);
    }
    /**
     * Compiles an individual filter condition into parameterized SQL
     */
    buildConditionClause(cond, knownAliases, parameterValues, params) {
        let targetExpr = '';
        if (cond.tableAlias && cond.columnName) {
            if (!knownAliases.has(cond.tableAlias)) {
                throw new Error(`Filter condition references unknown alias: '${cond.tableAlias}'`);
            }
            targetExpr = this.quoteQualified(cond.tableAlias, cond.columnName);
        }
        else if (cond.isCalculated && cond.calculatedId) {
            targetExpr = this.quote(cond.calculatedId);
        }
        else {
            return '';
        }
        // Determine value: from parameter or literal value
        let val = cond.value;
        let val2 = cond.value2;
        if (cond.isParameter && cond.parameterName) {
            val = parameterValues[cond.parameterName] !== undefined ? parameterValues[cond.parameterName] : cond.value;
        }
        const rawOp = String(cond.operator || 'equals').toLowerCase().replace(/_/g, '');
        switch (rawOp) {
            case 'equals':
            case 'equal':
            case '=':
                params.push(val);
                return `${targetExpr} = ?`;
            case 'doesnotequal':
            case 'notequals':
            case 'notequal':
            case '<>':
            case '!=':
                params.push(val);
                return `${targetExpr} <> ?`;
            case 'greaterthan':
            case '>':
                params.push(val);
                return `${targetExpr} > ?`;
            case 'greaterthanorequal':
            case 'greaterequal':
            case '>=':
                params.push(val);
                return `${targetExpr} >= ?`;
            case 'lessthan':
            case '<':
                params.push(val);
                return `${targetExpr} < ?`;
            case 'lessthanorequal':
            case 'lessequal':
            case '<=':
                params.push(val);
                return `${targetExpr} <= ?`;
            case 'contains':
            case 'like':
                params.push(`%${val}%`);
                return `${targetExpr} LIKE ?`;
            case 'doesnotcontain':
            case 'notlike':
                params.push(`%${val}%`);
                return `${targetExpr} NOT LIKE ?`;
            case 'startswith':
                params.push(`${val}%`);
                return `${targetExpr} LIKE ?`;
            case 'endswith':
                params.push(`%${val}`);
                return `${targetExpr} LIKE ?`;
            case 'in':
                if (Array.isArray(val) && val.length > 0) {
                    const placeholders = val.map(() => '?').join(', ');
                    params.push(...val);
                    return `${targetExpr} IN (${placeholders})`;
                }
                else if (typeof val === 'string' && val.trim()) {
                    const list = val.split(',').map((s) => s.trim()).filter(Boolean);
                    const placeholders = list.map(() => '?').join(', ');
                    params.push(...list);
                    return `${targetExpr} IN (${placeholders})`;
                }
                return '1 = 1';
            case 'notin':
                if (Array.isArray(val) && val.length > 0) {
                    const placeholders = val.map(() => '?').join(', ');
                    params.push(...val);
                    return `${targetExpr} NOT IN (${placeholders})`;
                }
                else if (typeof val === 'string' && val.trim()) {
                    const list = val.split(',').map((s) => s.trim()).filter(Boolean);
                    const placeholders = list.map(() => '?').join(', ');
                    params.push(...list);
                    return `${targetExpr} NOT IN (${placeholders})`;
                }
                return '1 = 1';
            case 'between':
                const secondVal = val2 !== undefined ? val2 : cond.valueTo;
                params.push(val, secondVal);
                return `${targetExpr} BETWEEN ? AND ?`;
            case 'isnull':
                return `${targetExpr} IS NULL`;
            case 'isnotnull':
                return `${targetExpr} IS NOT NULL`;
            default:
                params.push(val);
                return `${targetExpr} = ?`;
        }
    }
}
export const sqlGeneratorService = new SqlGeneratorService();
//# sourceMappingURL=sql-generator.service.js.map