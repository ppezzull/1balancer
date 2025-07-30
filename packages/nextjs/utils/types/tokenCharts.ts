export interface Line {
  time: number;
  value: number;
}

export interface LinesResponse {
  data: Line[];
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface CandlesResponse {
  data: Candle[];
}
