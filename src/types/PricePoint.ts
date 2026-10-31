export type PricePoint = {
  timestamp: string;
  price: number;
  /** Shown as a dashed line segment */
  estimated?: boolean;
};
