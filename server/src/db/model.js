import { randomUUID } from 'node:crypto';
import { all, get, run } from './sqlite.js';

const nowIso = () => new Date().toISOString();

function clone(value) {
  if (value === null || value === undefined) return value;
  if (typeof value === 'object') return JSON.parse(JSON.stringify(value));
  return value;
}

function defaultFor(field) {
  if (typeof field.default === 'function') return field.default();
  if (field.type === 'bool') return Boolean(field.default);
  if (field.type === 'int') return Number(field.default ?? 0);
  if (field.type === 'json') return field.default !== undefined ? clone(field.default) : null;
  return field.default ?? null;
}

function encode(field, value) {
  if (value === undefined || value === null) return null;
  switch (field.type) {
    case 'bool':
      return value ? 1 : 0;
    case 'int':
      return Number(value) || 0;
    case 'json':
      return JSON.stringify(value);
    case 'date':
      return value instanceof Date ? value.toISOString() : String(value);
    default:
      return String(value);
  }
}

function decode(field, value) {
  if (value === null || value === undefined) {
    return defaultFor(field);
  }
  switch (field.type) {
    case 'bool':
      return Boolean(value);
    case 'int':
      return Number(value);
    case 'json':
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch {
        return defaultFor(field);
      }
    case 'date':
      return String(value);
    default:
      return value;
  }
}

function setPath(target, path, value) {
  const parts = path.split('.');
  let cursor = target;
  for (let index = 0; index < parts.length - 1; index += 1) {
    const key = parts[index];
    if (!cursor[key] || typeof cursor[key] !== 'object') cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[parts[parts.length - 1]] = value;
}

function getPath(target, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), target);
}

function applyUpdate(target, update) {
  if (!update) return target;
  const hasOperators =
    update.$set || update.$setOnInsert || update.$inc || update.$unset || update.$push;
  if (!hasOperators) {
    for (const [key, value] of Object.entries(update)) setPath(target, key, value);
    return target;
  }
  if (update.$set) {
    for (const [key, value] of Object.entries(update.$set)) setPath(target, key, value);
  }
  if (update.$inc) {
    for (const [key, value] of Object.entries(update.$inc)) {
      setPath(target, key, (Number(getPath(target, key)) || 0) + Number(value));
    }
  }
  if (update.$unset) {
    for (const key of Object.keys(update.$unset)) setPath(target, key, null);
  }
  return target;
}

function quote(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function fieldFor(model, name) {
  const field = model.fields[name];
  if (!field) throw new Error(`Unknown field "${name}" on ${model.table}.`);
  return field;
}

function buildWhere(model, filter = {}) {
  const clauses = [];
  const args = [];

  for (const [key, value] of Object.entries(filter || {})) {
    if (key === '$and' || key === '$or') {
      const parts = (value || []).map((entry) => buildWhere(model, entry));
      if (!parts.length) {
        clauses.push(key === '$and' ? '1=1' : '0');
        continue;
      }
      const joiner = key === '$and' ? ' AND ' : ' OR ';
      clauses.push(`(${parts.map((part) => part.sql).join(joiner)})`);
      for (const part of parts) args.push(...part.args);
      continue;
    }

    if (key.startsWith('$')) throw new Error(`Unsupported filter operator "${key}".`);

    const field = fieldFor(model, key);
    const column = quote(field.column);

    if (value === null || value === undefined) {
      clauses.push(`${column} IS NULL`);
      continue;
    }

    if (value instanceof Date) {
      clauses.push(`${column} = ?`);
      args.push(value.toISOString());
      continue;
    }

    if (typeof value === 'object' && !Array.isArray(value)) {
      for (const [operator, operand] of Object.entries(value)) {
        switch (operator) {
          case '$eq':
            clauses.push(`${column} = ?`);
            args.push(encode(field, operand));
            break;
          case '$ne':
            clauses.push(`${column} <> ?`);
            args.push(encode(field, operand));
            break;
          case '$gt':
            clauses.push(`${column} > ?`);
            args.push(encode(field, operand));
            break;
          case '$gte':
            clauses.push(`${column} >= ?`);
            args.push(encode(field, operand));
            break;
          case '$lt':
            clauses.push(`${column} < ?`);
            args.push(encode(field, operand));
            break;
          case '$lte':
            clauses.push(`${column} <= ?`);
            args.push(encode(field, operand));
            break;
          case '$in': {
            const list = Array.isArray(operand) ? operand : [];
            if (!list.length) {
              clauses.push('0');
            } else {
              clauses.push(`${column} IN (${list.map(() => '?').join(', ')})`);
              for (const entry of list) args.push(encode(field, entry));
            }
            break;
          }
          case '$nin': {
            const list = Array.isArray(operand) ? operand : [];
            if (!list.length) {
              clauses.push('1=1');
            } else {
              clauses.push(`${column} NOT IN (${list.map(() => '?').join(', ')})`);
              for (const entry of list) args.push(encode(field, entry));
            }
            break;
          }
          default:
            throw new Error(`Unsupported filter operator "${operator}".`);
        }
      }
      continue;
    }

    clauses.push(`${column} = ?`);
    args.push(encode(field, value));
  }

  return { sql: clauses.length ? clauses.join(' AND ') : '1=1', args };
}

function mapSort(model, spec) {
  if (!spec) return '';
  const parts = [];
  for (const [key, direction] of Object.entries(spec)) {
    const field = fieldFor(model, key);
    parts.push(`${quote(field.column)} ${Number(direction) < 0 ? 'DESC' : 'ASC'}`);
  }
  return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
}

class Query {
  constructor(model, filter = {}, { one = false } = {}) {
    this.model = model;
    this.filter = filter;
    this.one = one;
    this.sortSpec = null;
    this.limitValue = null;
  }

  sort(spec) {
    this.sortSpec = spec;
    return this;
  }

  select() {
    return this;
  }

  limit(value) {
    this.limitValue = value;
    return this;
  }

  lean() {
    return this;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  async exec() {
    const { sql, args } = buildWhere(this.model, this.filter);
    let statement = `SELECT * FROM ${quote(this.model.table)} WHERE ${sql}`;
    statement += mapSort(this.model, this.sortSpec);
    if (this.limitValue !== null && this.limitValue !== undefined) {
      statement += ' LIMIT ?';
      args.push(Number(this.limitValue));
    }

    const rows = await all(statement, args);
    const docs = rows.map((row) => this.model.fromRow(row));
    if (this.one) return docs[0] || null;
    return docs;
  }
}

function buildGroupAggregate(model, pipeline) {
  const match = pipeline.find((stage) => stage.$match)?.$match || {};
  const group = pipeline.find((stage) => stage.$group)?.$group;
  const where = buildWhere(model, match);

  if (!group) {
    return {
      sql: `SELECT * FROM ${quote(model.table)} WHERE ${where.sql}`,
      args: where.args,
    };
  }

  const selectParts = [];
  const groupExpression =
    group._id === null || group._id === undefined
      ? 'NULL'
      : quote(fieldFor(model, String(group._id).replace(/^\$/, '')).column);
  selectParts.push(`${groupExpression} AS "_id"`);

  for (const [alias, expression] of Object.entries(group)) {
    if (alias === '_id') continue;
    if (expression && typeof expression === 'object' && '$sum' in expression) {
      if (expression.$sum === 1) {
        selectParts.push(`COUNT(*) AS ${quote(alias)}`);
      } else {
        const fieldName = String(expression.$sum).replace(/^\$/, '');
        selectParts.push(`SUM(${quote(fieldFor(model, fieldName).column)}) AS ${quote(alias)}`);
      }
    } else {
      throw new Error(`Unsupported aggregate expression for "${alias}".`);
    }
  }

  let sql = `SELECT ${selectParts.join(', ')} FROM ${quote(model.table)} WHERE ${where.sql}`;
  if (group._id !== null && group._id !== undefined) {
    sql += ` GROUP BY ${groupExpression}`;
  }
  return { sql, args: where.args };
}

export function defineModel(definition) {
  const fields = definition.fields;
  const fieldList = Object.entries(fields).map(([name, field]) => ({ name, ...field }));

  class Model {
    constructor(data = {}, { isNew = false } = {}) {
      const idValue = data._id ?? data.id ?? randomUUID();
      this._id = String(idValue);
      for (const field of fieldList) {
        if (field.name === '_id') continue;
        if (data[field.name] !== undefined) {
          if (
            field.type === 'json' &&
            field.default &&
            typeof field.default === 'object' &&
            !Array.isArray(field.default) &&
            data[field.name] &&
            typeof data[field.name] === 'object' &&
            !Array.isArray(data[field.name])
          ) {
            this[field.name] = { ...clone(field.default), ...data[field.name] };
          } else {
            this[field.name] = data[field.name];
          }
        } else {
          this[field.name] = defaultFor(field);
        }
      }
      if (!this.createdAt) this.createdAt = nowIso();
      if (!this.updatedAt) this.updatedAt = nowIso();
      Object.defineProperty(this, 'isNew', {
        value: isNew,
        writable: true,
        enumerable: false,
        configurable: true,
      });
      if (definition.normalize) definition.normalize(this);
    }

    async save() {
      const values = {};
      for (const field of fieldList) {
        if (field.name === '_id') continue;
        values[field.column] = encode(field, this[field.name]);
      }
      this.updatedAt = nowIso();
      values.updated_at = this.updatedAt;

      if (this.isNew) {
        if (!this.createdAt) this.createdAt = nowIso();
        values.created_at = this.createdAt;
        const columns = Object.keys(values);
        await run(
          `INSERT INTO ${quote(this.constructor.table)} (${quote(fields._id ? fields._id.column : 'id')}, ${columns
            .map(quote)
            .join(', ')}) VALUES (?, ${columns.map(() => '?').join(', ')})`,
          [this._id, ...columns.map((column) => values[column])],
        );
        this.isNew = false;
      } else {
        const columns = Object.keys(values);
        await run(
          `UPDATE ${quote(this.constructor.table)} SET ${columns
            .map((column) => `${quote(column)} = ?`)
            .join(', ')} WHERE ${quote(fields._id ? fields._id.column : 'id')} = ?`,
          [...columns.map((column) => values[column]), this._id],
        );
      }
      return this;
    }

    toJSON() {
      const object = { _id: this._id };
      for (const field of fieldList) {
        if (field.name === '_id') continue;
        object[field.name] = this[field.name];
      }
      return object;
    }
  }

  Model.definition = definition;
  Model.table = definition.table;
  Model.fields = fields;
  Model.fieldList = fieldList;

  if (definition.toPublic) {
    Model.prototype.toPublic = function toPublic() {
      return definition.toPublic(this);
    };
  }

  Model.fromRow = (row) => {
    const data = { _id: row[fields._id ? fields._id.column : 'id'] };
    for (const field of fieldList) {
      if (field.name === '_id') continue;
      data[field.name] = decode(field, row[field.column]);
    }
    return new Model(data, { isNew: false });
  };

  Model.find = (filter = {}) => new Query(Model, filter);
  Model.findOne = (filter = {}) => new Query(Model, filter, { one: true });
  Model.findById = (id) => new Query(Model, { _id: id }, { one: true });

  Model.countDocuments = async (filter = {}) => {
    const where = buildWhere(Model, filter);
    const row = await get(
      `SELECT COUNT(*) AS "count" FROM ${quote(definition.table)} WHERE ${where.sql}`,
      where.args,
    );
    return Number(row?.count || 0);
  };

  Model.create = async (data) => {
    const document = new Model(data, { isNew: true });
    await document.save();
    return document;
  };

  Model.insertMany = async (items) => {
    const documents = [];
    for (const item of items) {
      const document = new Model(item, { isNew: true });
      await document.save();
      documents.push(document);
    }
    return documents;
  };

  Model.findOneAndUpdate = async (filter, update, options = {}) => {
    const existing = await Model.findOne(filter);
    if (existing) {
      applyUpdate(existing, update);
      await existing.save();
      return existing;
    }
    if (!options.upsert) return null;

    const seed = {};
    for (const [key, value] of Object.entries(filter || {})) {
      if (key.startsWith('$')) continue;
      if (value !== null && typeof value === 'object') continue;
      seed[key] = value;
    }
    if (update?.$setOnInsert) applyUpdate(seed, update.$setOnInsert);
    if (update?.$set) applyUpdate(seed, update.$set);
    if (!update?.$set && !update?.$setOnInsert) applyUpdate(seed, update);
    return Model.create(seed);
  };

  Model.findOneAndDelete = async (filter) => {
    const document = await Model.findOne(filter);
    if (!document) return null;
    await run(
      `DELETE FROM ${quote(definition.table)} WHERE ${quote(fields._id ? fields._id.column : 'id')} = ?`,
      [document._id],
    );
    return document;
  };

  Model.updateOne = async (filter, update, options = {}) => {
    const existing = await Model.findOne(filter);
    if (existing) {
      applyUpdate(existing, update);
      await existing.save();
      return { modifiedCount: 1, upsertedCount: 0 };
    }
    if (options.upsert) {
      await Model.findOneAndUpdate(filter, update, options);
      return { modifiedCount: 0, upsertedCount: 1 };
    }
    return { modifiedCount: 0, upsertedCount: 0 };
  };

  Model.updateMany = async (filter, update) => {
    const documents = await Model.find(filter);
    let modifiedCount = 0;
    for (const document of documents) {
      applyUpdate(document, update);
      await document.save();
      modifiedCount += 1;
    }
    return { modifiedCount };
  };

  Model.aggregate = async (pipeline) => {
    const { sql, args } = buildGroupAggregate(Model, pipeline);
    return all(sql, args);
  };

  return Model;
}
