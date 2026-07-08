interface MarketStatsProps {
  volume: number;
  endDate: string;
}

export function MarketStats({ volume, endDate }: MarketStatsProps) {
  return (
    <div className="flex justify-between text-sm text-slate-300">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-500">Volume</div>
        <div>{volume} guesses</div>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-wide text-slate-500">Ends</div>
        <div>{endDate}</div>
      </div>
    </div>
  );
}
