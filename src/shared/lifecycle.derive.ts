import { LifecycleStage, STAGE_PRIORITY } from './lifecycle.enum';
import type {
  DeriveStageInput,
  OrderRecord,
  ReturnRecord,
  ShipmentRecord,
} from './domain.types';

const OPEN_RETURN_STATUSES: ReadonlySet<ReturnRecord['status']> = new Set([
  'REQUESTED',
  'LABEL_SENT',
  'IN_TRANSIT',
  'RECEIVED',
  'INSPECTED',
]);

const DAY_MS = 24 * 60 * 60 * 1000;

export function deriveOrderStage(
  order: OrderRecord,
  shipments: readonly ShipmentRecord[],
  returns: readonly ReturnRecord[],
  now: Date,
  returnWindowDays: number,
): LifecycleStage {
  if (
    returns.some(
      (r) => r.orderId === order.id && OPEN_RETURN_STATUSES.has(r.status),
    )
  ) {
    return LifecycleStage.RETURN_OPEN;
  }
  if (order.cancelledAt) return LifecycleStage.CLOSED;

  const forOrder = shipments.filter((s) => s.orderId === order.id);
  const delivered = forOrder.filter((s) => s.deliveredAt !== undefined);

  if (delivered.length > 0 && delivered.length === forOrder.length) {
    const latest = delivered.reduce<Date>(
      (acc, s) => (s.deliveredAt && s.deliveredAt > acc ? s.deliveredAt : acc),
      new Date(0),
    );
    const windowEnds = new Date(latest.getTime() + returnWindowDays * DAY_MS);
    return now <= windowEnds ? LifecycleStage.DELIVERED : LifecycleStage.CLOSED;
  }

  if (forOrder.some((s) => s.shippedAt !== undefined))
    return LifecycleStage.IN_TRANSIT;
  return LifecycleStage.ORDER_PLACED;
}

export function pickDominantStage(
  stages: readonly LifecycleStage[],
): LifecycleStage {
  if (stages.length === 0) return LifecycleStage.PRE_PURCHASE;
  let dominant: LifecycleStage = stages[0] as LifecycleStage;
  for (const stage of stages) {
    if (STAGE_PRIORITY[stage] > STAGE_PRIORITY[dominant]) dominant = stage;
  }
  return dominant;
}

export function deriveStage(input: DeriveStageInput): LifecycleStage {
  if (input.orders.length === 0) return LifecycleStage.PRE_PURCHASE;
  const stages = input.orders.map((o) =>
    deriveOrderStage(
      o,
      input.shipments,
      input.returns,
      input.now,
      input.returnWindowDays,
    ),
  );
  return pickDominantStage(stages);
}
