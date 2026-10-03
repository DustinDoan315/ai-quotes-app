type Snapshot = { revision: number; pendingIds: Set<string> };
/** Overrides only protect reads that started before or during the write. */
export class HomeFavoriteCache {
  private revision = 0;
  private entries = new Map<string, { value: boolean; revision: number; pending: boolean }>();
  snapshot(): Snapshot { return { revision: this.revision, pendingIds: new Set([...this.entries].filter(([, entry]) => entry.pending).map(([id]) => id)) }; }
  pending(id: string, value: boolean | null) {
    const entry = this.entries.get(id);
    if (value === null) { if (entry) entry.pending = false; }
    else this.entries.set(id, { value, revision: ++this.revision, pending: true });
  }
  patch(id: string, value: boolean) {
    this.entries.set(id, { value, revision: ++this.revision, pending: this.entries.get(id)?.pending ?? false });
  }
  merge<T extends { id: string; isFavorite: boolean }>(cards: T[], snapshot: Snapshot): T[] {
    return cards.map(card => {
      const entry = this.entries.get(card.id);
      if (!entry) return card;
      if (entry.pending || entry.revision > snapshot.revision || snapshot.pendingIds.has(card.id)) return { ...card, isFavorite: entry.value };
      this.entries.delete(card.id);
      return card;
    });
  }
  clear() { this.entries.clear(); this.revision += 1; }
}
