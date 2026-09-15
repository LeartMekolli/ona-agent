export interface OrderRecord {
  id: string;
  placedAt: Date;
  cancelledAt?: Date;
  totalMinor: number;
  currency: string;
}

export interface ShipmentRecord {
  id: string;
  orderId: string;
  shippedAt?: Date;
  deliveredAt?: Date;
  lastScanAt?: Date;
}

export interface ReturnRecord {
  id: string;
  orderId: string;
  status:
    | 'REQUESTED'
    | 'LABEL_SENT'
    | 'IN_TRANSIT'
    | 'RECEIVED'
    | 'INSPECTED'
    | 'REFUNDED'
    | 'REJECTED';
  openedAt: Date;
}

export interface TicketRecord {
  id: string;
  contactId: string;
  status: 'OPEN' | 'CLOSED';
  ownedByHuman: boolean;
}

export interface DeriveStageInput {
  orders: readonly OrderRecord[];
  shipments: readonly ShipmentRecord[];
  returns: readonly ReturnRecord[];
  now: Date;
  returnWindowDays: number;
}
