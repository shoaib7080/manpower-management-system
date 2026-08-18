const parseDate = (v) => {
  if (!v) return null;
  if (typeof v === "number")
    return new Date(Math.round((v - 25569) * 86400 * 1000));
  const str = String(v).trim();
  const dmyMatch = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{2,4})$/);
  if (dmyMatch) {
    let [, d, m, y] = dmyMatch;
    if (y.length === 2) y = "20" + y;
    return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`);
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
};

export default parseDate;
