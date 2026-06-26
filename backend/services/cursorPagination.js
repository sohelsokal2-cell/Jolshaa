function encodeCursor(id, date) {
  return Buffer.from(`${date.getTime()}:${id}`).toString('base64');
}

function decodeCursor(cursor) {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [timestamp, id] = decoded.split(':');
    return { timestamp: new Date(parseInt(timestamp)), id };
  } catch {
    return null;
  }
}

async function cursorPaginate(Model, options = {}) {
  const {
    query = {},
    sort = { createdAt: -1 },
    limit = 20,
    cursor,
    populate = '',
    lean = true,
  } = options;

  const fullQuery = { ...query };

  if (cursor) {
    const cursorData = decodeCursor(cursor);
    if (cursorData) {
      if (sort.createdAt === -1) {
        fullQuery.$or = [
          { createdAt: { $lt: cursorData.timestamp } },
          {
            createdAt: cursorData.timestamp,
            _id: { $lt: cursorData.id },
          },
        ];
      } else {
        fullQuery.$or = [
          { createdAt: { $gt: cursorData.timestamp } },
          {
            createdAt: cursorData.timestamp,
            _id: { $gt: cursorData.id },
          },
        ];
      }
    }
  }

  let queryBuilder = Model.find(fullQuery).sort(sort).limit(limit + 1);

  if (populate) {
    if (typeof populate === 'string') {
      queryBuilder = queryBuilder.populate(populate);
    } else if (Array.isArray(populate)) {
      populate.forEach(p => { queryBuilder = queryBuilder.populate(p); });
    }
  }

  if (lean) queryBuilder = queryBuilder.lean();

  const results = await queryBuilder;
  const hasMore = results.length > limit;
  const items = hasMore ? results.slice(0, limit) : results;

  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = encodeCursor(lastItem._id.toString(), lastItem.createdAt);
  }

  return {
    items,
    nextCursor,
    hasMore,
    count: items.length,
  };
}

module.exports = { cursorPaginate, encodeCursor, decodeCursor };
