export const PAGE_SIZE = 50;
export function pageNumber(value: string | string[] | undefined) {
  const page = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : 1;
  return Number.isSafeInteger(page) && page > 0 && page <= 100000 ? page : 1;
}
