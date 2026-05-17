export function shortAddress(address: string, edge = 4) {
  if (address.length <= edge * 2 + 3) {
    return address;
  }

  return `${address.slice(0, edge)}...${address.slice(-edge)}`;
}
