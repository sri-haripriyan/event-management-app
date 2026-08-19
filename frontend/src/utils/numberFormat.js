export function formatCount(counts) {
  if (counts >= 1e9) {
    return (counts / 1e9).toFixed(1) + "B";
  } else if (counts >= 1e6) {
    return (counts / 1e6).toFixed(1) + "M";
  } else if (counts >= 1e3) {
    return (counts / 1e3).toFixed(1) + "K";
  } else {
    return counts;
  }
}
