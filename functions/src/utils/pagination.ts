export const toPage = (arr: any[], page = 1, pageSize = 20) => {
  const start = (page - 1) * pageSize;
  return { items: arr.slice(start, start + pageSize), page, pageSize, total: arr.length };
};
