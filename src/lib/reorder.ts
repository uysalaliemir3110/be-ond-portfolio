/** Bir listede öğeyi `from` konumundan `to` konumuna taşır (sürükle-bırak sıralaması). */
export function reorder<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list];
  const [moved] = copy.splice(from, 1);
  copy.splice(to, 0, moved);
  return copy;
}
