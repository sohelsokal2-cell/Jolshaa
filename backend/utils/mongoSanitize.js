const mongoose = require('mongoose');

const isOperator = (value) => {
  if (typeof value !== 'object' || value === null) return false;
  return Object.keys(value).some(key => key.startsWith('$'));
};

const isPrototypePollutionAttempt = (key) => {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
};

const sanitizeValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (mongoose.Types.ObjectId.isValid(value) && typeof value === 'string') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (typeof value === 'object') {
    if (isOperator(value)) {
      throw new Error('Invalid query parameter: operators not allowed');
    }
    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      if (isPrototypePollutionAttempt(key)) {
        throw new Error(`Invalid key: ${key} is not allowed`);
      }
      sanitized[key] = sanitizeValue(val);
    }
    return sanitized;
  }
  return String(value);
};

const sanitizeQuery = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (isPrototypePollutionAttempt(key)) {
      throw new Error(`Invalid parameter: ${key} is not allowed`);
    }
    if (isOperator(value)) {
      throw new Error(`Invalid query parameter: ${key} contains operator`);
    }
    sanitized[key] = sanitizeValue(value);
  }
  return sanitized;
};

const sanitizeObjectId = (id) => {
  if (!id) return null;
  if (mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  throw new Error('Invalid ID format');
};

module.exports = { sanitizeQuery, sanitizeValue, sanitizeObjectId, isOperator };
