import type { Healer } from './config';

export interface OddsEntry {
  healer: Healer;
  count: number;
  percentage: number;
}

export interface GraphPoint {
  date: string;
  [seriesName: string]: number | string;
}

export interface MarketResponse {
  volume: number;
  odds: OddsEntry[];
  graph: {
    points: GraphPoint[];
    seriesNames: string[];
  };
}
