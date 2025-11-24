import { atom } from 'nanostores';

export type CEXFilterType = 'confirmed' | 'announced' | 'acknowledged' | 'all';

export interface CEXFilterState {
  searchQuery: string;
  activeFilter: CEXFilterType;
  exitingCards: Set<string>;
}

const initialState: CEXFilterState = {
  searchQuery: '',
  activeFilter: 'all',
  exitingCards: new Set(),
};

export const $cexFilterStore = atom<CEXFilterState>(initialState);

export const cexFilterActions = {
  setSearchQuery(query: string): void {
    const current = $cexFilterStore.get();
    $cexFilterStore.set({
      ...current,
      searchQuery: query,
    });
  },

  setActiveFilter(filter: CEXFilterType): void {
    const current = $cexFilterStore.get();
    $cexFilterStore.set({
      ...current,
      activeFilter: filter,
    });
  },

  setExitingCards(cards: Set<string>): void {
    const current = $cexFilterStore.get();
    $cexFilterStore.set({
      ...current,
      exitingCards: cards,
    });
  },

  reset(): void {
    $cexFilterStore.set(initialState);
  },
};
