export function getDateKey(date = new Date()) {
  const local = new Date(
    date.getTime() -
      date.getTimezoneOffset() * 60000
  );

  return local
    .toISOString()
    .split("T")[0];
}