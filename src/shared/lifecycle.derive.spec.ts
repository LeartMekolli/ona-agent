import { deriveStage, pickDominantStage } from './lifecycle.derive';
import { LifecycleStage } from './lifecycle.enum';

const NOW = new Date('2026-03-01T12:00:00Z');
const base = { now: NOW, returnWindowDays: 30 };

describe('deriveStage', () => {
  it('returns PRE_PURCHASE when there are no orders', () => {
    expect(
      deriveStage({ ...base, orders: [], shipments: [], returns: [] }),
    ).toBe(LifecycleStage.PRE_PURCHASE);
  });

  it('returns ORDER_PLACED for a paid, unshipped order', () => {
    expect(
      deriveStage({
        ...base,
        orders: [
          {
            id: 'o1',
            placedAt: new Date('2026-02-28T00:00:00Z'),
            totalMinor: 5000,
            currency: 'GBP',
          },
        ],
        shipments: [],
        returns: [],
      }),
    ).toBe(LifecycleStage.ORDER_PLACED);
  });

  it('returns IN_TRANSIT once shipped but not delivered', () => {
    expect(
      deriveStage({
        ...base,
        orders: [
          {
            id: 'o1',
            placedAt: new Date('2026-02-20T00:00:00Z'),
            totalMinor: 5000,
            currency: 'GBP',
          },
        ],
        shipments: [
          {
            id: 's1',
            orderId: 'o1',
            shippedAt: new Date('2026-02-22T00:00:00Z'),
          },
        ],
        returns: [],
      }),
    ).toBe(LifecycleStage.IN_TRANSIT);
  });

  it('returns DELIVERED inside the return window', () => {
    expect(
      deriveStage({
        ...base,
        orders: [
          {
            id: 'o1',
            placedAt: new Date('2026-02-10T00:00:00Z'),
            totalMinor: 5000,
            currency: 'GBP',
          },
        ],
        shipments: [
          {
            id: 's1',
            orderId: 'o1',
            shippedAt: new Date('2026-02-12T00:00:00Z'),
            deliveredAt: new Date('2026-02-15T00:00:00Z'),
          },
        ],
        returns: [],
      }),
    ).toBe(LifecycleStage.DELIVERED);
  });

  it('returns CLOSED once the return window has expired', () => {
    expect(
      deriveStage({
        ...base,
        orders: [
          {
            id: 'o1',
            placedAt: new Date('2025-12-01T00:00:00Z'),
            totalMinor: 5000,
            currency: 'GBP',
          },
        ],
        shipments: [
          {
            id: 's1',
            orderId: 'o1',
            shippedAt: new Date('2025-12-02T00:00:00Z'),
            deliveredAt: new Date('2025-12-05T00:00:00Z'),
          },
        ],
        returns: [],
      }),
    ).toBe(LifecycleStage.CLOSED);
  });

  it('returns CLOSED for a cancelled order', () => {
    expect(
      deriveStage({
        ...base,
        orders: [
          {
            id: 'o1',
            placedAt: new Date('2026-02-20T00:00:00Z'),
            cancelledAt: new Date('2026-02-21T00:00:00Z'),
            totalMinor: 5000,
            currency: 'GBP',
          },
        ],
        shipments: [],
        returns: [],
      }),
    ).toBe(LifecycleStage.CLOSED);
  });

  it('returns RETURN_OPEN when a return is in flight', () => {
    expect(
      deriveStage({
        ...base,
        orders: [
          {
            id: 'o1',
            placedAt: new Date('2026-02-10T00:00:00Z'),
            totalMinor: 5000,
            currency: 'GBP',
          },
        ],
        shipments: [
          {
            id: 's1',
            orderId: 'o1',
            shippedAt: new Date('2026-02-12T00:00:00Z'),
            deliveredAt: new Date('2026-02-15T00:00:00Z'),
          },
        ],
        returns: [
          {
            id: 'r1',
            orderId: 'o1',
            status: 'REQUESTED',
            openedAt: new Date('2026-02-20T00:00:00Z'),
          },
        ],
      }),
    ).toBe(LifecycleStage.RETURN_OPEN);
  });

  it('treats a settled return as not open', () => {
    expect(
      deriveStage({
        ...base,
        orders: [
          {
            id: 'o1',
            placedAt: new Date('2026-02-10T00:00:00Z'),
            totalMinor: 5000,
            currency: 'GBP',
          },
        ],
        shipments: [
          {
            id: 's1',
            orderId: 'o1',
            shippedAt: new Date('2026-02-12T00:00:00Z'),
            deliveredAt: new Date('2026-02-15T00:00:00Z'),
          },
        ],
        returns: [
          {
            id: 'r1',
            orderId: 'o1',
            status: 'REFUNDED',
            openedAt: new Date('2026-02-20T00:00:00Z'),
          },
        ],
      }),
    ).toBe(LifecycleStage.DELIVERED);
  });
});

describe('pickDominantStage', () => {
  it('returns PRE_PURCHASE for an empty list', () => {
    expect(pickDominantStage([])).toBe(LifecycleStage.PRE_PURCHASE);
  });

  it.each([
    [
      [LifecycleStage.CLOSED, LifecycleStage.RETURN_OPEN],
      LifecycleStage.RETURN_OPEN,
    ],
    [
      [LifecycleStage.DELIVERED, LifecycleStage.IN_TRANSIT],
      LifecycleStage.IN_TRANSIT,
    ],
    [
      [LifecycleStage.CLOSED, LifecycleStage.DELIVERED],
      LifecycleStage.DELIVERED,
    ],
    [
      [LifecycleStage.ORDER_PLACED, LifecycleStage.DELIVERED],
      LifecycleStage.ORDER_PLACED,
    ],
    [[LifecycleStage.CLOSED, LifecycleStage.CLOSED], LifecycleStage.CLOSED],
  ])('picks the dominant stage from %p', (input, expected) => {
    expect(pickDominantStage(input)).toBe(expected);
  });

  it('is order-independent', () => {
    const a = [
      LifecycleStage.CLOSED,
      LifecycleStage.IN_TRANSIT,
      LifecycleStage.DELIVERED,
    ];
    const b = [
      LifecycleStage.DELIVERED,
      LifecycleStage.CLOSED,
      LifecycleStage.IN_TRANSIT,
    ];
    expect(pickDominantStage(a)).toBe(pickDominantStage(b));
  });
});
