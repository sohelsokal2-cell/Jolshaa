const sameId = (a, b) => {
  if (a === undefined || a === null || b === undefined || b === null) {
    return false;
  }

  return a.toString() === b.toString();
};

const hasId = (items, target) => Array.isArray(items) && items.some((item) => sameId(item, target));

module.exports = { sameId, hasId };
