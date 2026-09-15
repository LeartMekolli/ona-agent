export enum LifecycleStage {
  PRE_PURCHASE = 'PRE_PURCHASE',
  ORDER_PLACED = 'ORDER_PLACED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  RETURN_OPEN = 'RETURN_OPEN',
  CLOSED = 'CLOSED',
}

export enum Workflow {
  SUPPORT = 'SUPPORT',
  PRESALE = 'PRESALE',
  WINBACK = 'WINBACK',
}

/** Dominance ordering (spec §4.2). Higher wins. */
export const STAGE_PRIORITY: Readonly<Record<LifecycleStage, number>> = {
  [LifecycleStage.RETURN_OPEN]: 6,
  [LifecycleStage.IN_TRANSIT]: 5,
  [LifecycleStage.ORDER_PLACED]: 4,
  [LifecycleStage.DELIVERED]: 3,
  [LifecycleStage.PRE_PURCHASE]: 2,
  [LifecycleStage.CLOSED]: 1,
};
