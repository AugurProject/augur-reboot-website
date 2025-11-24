import React, { useMemo, useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import cexData from '../data/cex-support.json';
import { ClippedCardGradient as ClippedCard } from './card-clipped';
import { BookIcon, TokenIcon, ExternalLinkIcon } from './ui/icons';
import { $cexFilterStore, cexFilterActions, type CEXFilterType } from '../stores/cexFilterStore';
import { CEXDataSchema } from '../schemas/cexData';

export type Status = 'confirmed' | 'announced' | 'acknowledged' | 'closed';

interface TradingPair {
  pair: string;
  url?: string;
}

interface Link {
  text: string;
  url: string;
}

interface BaseExchange {
  id: string;
  name: string;
  domain?: string;
  notes?: string;
  delistingDate?: string;
  closureDate?: string;
}

interface ConfirmedExchange extends BaseExchange {
  status: 'confirmed';
  tradingPairs: TradingPair[];
}

interface AnnouncedExchange extends BaseExchange {
  status: 'announced';
  tradingPairs: TradingPair[];
  links: Link[];
}

interface AcknowledgedExchange extends BaseExchange {
  status: 'acknowledged';
  tradingPairs: never[];
}

interface ClosedExchange extends BaseExchange {
  status: 'closed';
  tradingPairs: never[];
}

type Exchange = ConfirmedExchange | AnnouncedExchange | AcknowledgedExchange | ClosedExchange;

const statusConfig: Record<Status, { label: string; color: string; badge: string }> = {
  confirmed: { label: 'Active', color: 'var(--color-foreground)', badge: 'bg-green-900/30' },
  announced: { label: 'Announced', color: '#FFA500', badge: 'bg-amber-900/30' },
  acknowledged: { label: 'Acknowledged', color: '#808080', badge: 'bg-gray-700/30' },
  closed: { label: 'Closed', color: '#404040', badge: 'bg-gray-900/30' },
};

type FilterType = Status | 'all';

interface ExchangeCardProps {
  exchange: Exchange;
}

function ExchangeCard({ exchange }: ExchangeCardProps) {
  return (
    <ClippedCard>
      <div className="flex items-start gap-3 py-4 border-b border-primary/20 px-6">
        <div className="flex-1 flex justify-between items-start gap-2">
          <div>
            <h3 className="text-loud-foreground font-bold uppercase text-base">{exchange.name}</h3>
            {exchange.domain && <p className="text-muted-foreground text-xs">{exchange.domain}</p>}
          </div>
          <div className="flex items-center gap-2 text-xs uppercase whitespace-nowrap flex-shrink-0">
            <span className="text-muted-foreground">{statusConfig[exchange.status].label.split(' ')[0]}</span>
            <div
              className="w-2 h-2 flex-shrink-0 animate-pulse"
              style={{ backgroundColor: statusConfig[exchange.status].color }}
            />
          </div>
        </div>
      </div>

      {(() => {
        switch (exchange.status) {
          case 'confirmed':
            return (
              <div className="text-muted-foreground text-xs py-3 px-6">
                <div className="grid grid-cols-[auto_1fr] gap-2 items-center">
                  <TokenIcon className="size-4" title="Token Pairs" />
                  <div className="flex gap-x-2">
                    {exchange.tradingPairs.map((pair, pIdx) => (
                      <div key={pIdx}>
                        {pair.url ? (
                          <a
                            href={pair.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none underline underline-offset-4 inline-block"
                          >
                            {pair.pair}
                          </a>
                        ) : (
                            <span className="text-foreground inline-block">{pair.pair}</span>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );

          case 'acknowledged':
            return (
              <div className="text-muted-foreground text-xs italic py-3 px-6">Coming soon</div>
            );

          case 'announced':
            return (
              <div className={`text-muted-foreground text-xs space-y-1 py-3 px-6 ${exchange.tradingPairs.length > 0 ? 'border-t border-primary/20' : ''}`}>
                <div className="flex gap-x-2">
                  <BookIcon className="size-4" title="Announcement" />
                  {exchange.links.map((link, lIdx) => (
                    <a
                      key={lIdx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-loud-foreground hover:fx-glow focus:fx-glow focus:outline-none underline underline-offset-4 flex items-center gap-1"
                    >
                      {link.text}
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  ))}
                </div>
              </div>
            );
        }
      })()}
    </ClippedCard>
  );
}

export default function CEXExchangeList() {
  const filterState = useStore($cexFilterStore);
  const [inputValue, setInputValue] = React.useState('');
  const prevFilteredRef = useRef<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      cexFilterActions.setSearchQuery(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Validate and parse the CEX data with Zod at runtime
  let validatedExchanges: typeof cexData.exchanges = [];
  try {
    const validatedData = CEXDataSchema.parse(cexData);
    validatedExchanges = validatedData.exchanges as typeof cexData.exchanges;
  } catch (error) {
    console.error('Invalid CEX data format:', error);
  }

  const exchanges: Exchange[] = validatedExchanges.map((ex): Exchange => {
    if (ex.status === 'closed') {
      return {
        id: ex.id,
        name: ex.name,
        domain: ex.domain,
        status: 'closed',
        tradingPairs: [],
        notes: ex.notes,
        closureDate: ex.closureDate,
      };
    } else if (ex.status === 'acknowledged') {
      return {
        id: ex.id,
        name: ex.name,
        domain: ex.domain,
        status: 'acknowledged',
        tradingPairs: [],
        notes: ex.notes,
        delistingDate: ex.delistingDate,
      };
    } else if (ex.status === 'announced') {
      return {
        id: ex.id,
        name: ex.name,
        domain: ex.domain,
        status: 'announced',
        tradingPairs: ex.tradingPairs || [],
        links: ex.links || [],
        notes: ex.notes,
      };
    }
    // confirmed
    return {
      id: ex.id,
      name: ex.name,
      domain: ex.domain,
      status: 'confirmed',
      tradingPairs: ex.tradingPairs,
      notes: ex.notes,
    };
  });

  const statusOrder: Record<Exclude<Status, 'closed'>, number> = { confirmed: 0, announced: 1, acknowledged: 2 };

  const filtered = useMemo(() => {
    const results: Exclude<Exchange, ClosedExchange>[] = exchanges.filter((exchange) => {
      // Always hide closed exchanges from UI display
      if (exchange.status === 'closed') return false;
      const matchesSearch = exchange.name.toLowerCase().includes(filterState.searchQuery.toLowerCase());
      const matchesFilter = filterState.activeFilter === 'all' || exchange.status === filterState.activeFilter;
      return matchesSearch && matchesFilter;
    }) as Exclude<Exchange, ClosedExchange>[];

    // Sort by status order (confirmed first, then announced, then acknowledged)
    return results.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [filterState.searchQuery, filterState.activeFilter]);

  // Track exiting cards and clear after animation
  useEffect(() => {
    const currentIds = filtered.map(e => e.id);
    const previousIds = prevFilteredRef.current;

    const leaving = previousIds.filter(id => !currentIds.includes(id));

    if (leaving.length > 0) {
      cexFilterActions.setExitingCards(new Set(leaving));
      const timer = setTimeout(() => {
        cexFilterActions.setExitingCards(new Set());
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }

    prevFilteredRef.current = currentIds;
  }, [filtered]);

  const visibleExchanges = exchanges.filter((e) => e.status !== 'closed');
  const countByStatus: Record<Exclude<Status, 'closed'>, number> = {
    confirmed: visibleExchanges.filter((e) => e.status === 'confirmed').length,
    announced: visibleExchanges.filter((e) => e.status === 'announced').length,
    acknowledged: visibleExchanges.filter((e) => e.status === 'acknowledged').length,
  };

  return (
    <div className="w-full">
      {/* Search Input */}
      <div className="mb-8">
        <input
          ref={searchInputRef}
          autoFocus
          type="text"
          placeholder="Search exchanges..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-primary/50 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase text-center"
        />
      </div>

      {/* Filter Pills */}
      <fieldset className="mb-8">
        <legend className="sr-only">Filter exchanges by status</legend>
        <div className="flex flex-wrap gap-3 justify-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="status-filter"
              value="all"
              checked={filterState.activeFilter === 'all'}
              onChange={() => cexFilterActions.setActiveFilter('all')}
              className="sr-only"
            />
            <span
              className={`px-4 py-2 border uppercase text-sm transition-all flex items-center gap-1 ${
                filterState.activeFilter === 'all'
                  ? 'border-primary text-foreground'
                  : 'border-muted-foreground/50 text-muted-foreground hover:border-muted-foreground'
              }`}
            >
              <div className={`w-2 h-2 bg-muted-foreground flex-shrink-0 transition-opacity ${filterState.activeFilter === 'all' ? 'opacity-100' : 'opacity-50'}`} />
              All ({visibleExchanges.length})
            </span>
            <style>{`
              label:has(input[value="all"]:checked):focus-within span {
                filter: drop-shadow(0 0 var(--glow-size) var(--color-primary));
              }
            `}</style>
          </label>
          {Object.entries(statusConfig)
            .filter(([status]) => status !== 'closed')
            .map(([status, config]) => (
            <label key={status} className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="status-filter"
                value={status}
                checked={filterState.activeFilter === status}
                onChange={() => cexFilterActions.setActiveFilter(status as CEXFilterType)}
                className="sr-only"
              />
              <span
                className={`px-4 py-2 border uppercase text-sm transition-all flex items-center gap-1 ${
                  filterState.activeFilter === status
                    ? 'border-primary text-foreground'
                    : 'border-muted-foreground/50 text-muted-foreground hover:border-muted-foreground'
                }`}
              >
                <div
                  className={`w-2 h-2 flex-shrink-0 transition-opacity ${filterState.activeFilter === status ? 'opacity-100' : 'opacity-50'}`}
                  style={{ backgroundColor: filterState.activeFilter === status && status === 'confirmed' ? 'var(--color-loud-foreground)' : config.color }}
                />
                {config.label} ({countByStatus[status as Exclude<Status, 'closed'>]})
              </span>
              <style>{`
                label:has(input[value="${status}"]:checked):focus-within span {
                  filter: drop-shadow(0 0 var(--glow-size) var(--color-primary));
                }
              `}</style>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Results Count */}
      <div className="mb-6 text-muted-foreground text-sm">
        Showing {filtered.length} of {exchanges.length} exchanges
      </div>

      {/* Exchange Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length > 0 || filterState.exitingCards.size > 0 ? (
          <>
            {filtered.map((exchange, idx) => (
              <div
                key={`enter-${exchange.id}`}
                className="animate-in fade-in zoom-in-95 animation-duration-300"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'both' }}
              >
                <ExchangeCard
                  exchange={exchange}
                />
              </div>
            ))}
            {Array.from(filterState.exitingCards).map((cardId) => {
              const exchange = exchanges.find(e => e.id === cardId);
              return exchange ? (
                <div
                  key={`exit-${cardId}`}
                  className="animate-out fade-out zoom-out-95 animation-duration-300"
                  onAnimationEnd={() => {
                    const prev = filterState.exitingCards;
                    const next = new Set(prev);
                    next.delete(cardId);
                    cexFilterActions.setExitingCards(next);
                  }}
                >
                  <ExchangeCard
                    exchange={exchange}
                  />
                </div>
              ) : null;
            })}
          </>
        ) : (
          <div className="col-span-full">
            <div className="flex justify-center">
              <div className="max-w-md w-full border border-primary/50 p-6 text-center space-y-4">
                <div className="text-muted-foreground">
                  <p className="mb-2">No exchanges found matching your criteria</p>
                  <p className="text-xs">Try adjusting your search or filters</p>
                </div>
                <button
                  onClick={() => {
                    setInputValue('');
                    cexFilterActions.setActiveFilter('all');
                    cexFilterActions.setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="px-4 py-2 border border-primary/50 text-foreground hover:border-primary hover:fx-glow focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 uppercase text-sm transition-all"
                >
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
