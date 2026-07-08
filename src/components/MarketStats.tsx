interface MarketStatsProps {
  volume: number;
  endDate: string;
}

export function MarketStats({ volume, endDate }: MarketStatsProps) {
  return (
    <div className="flex justify-between text-sm text-slate-600 dark:text-slate-300">
      <div>
        <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Volume</div>
        <div className="font-semibold">{volume} guesses</div>
      </div>
      <div className="text-right">
        <div className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Ends</div>
        <div className="font-semibold">{endDate}</div>
      </div>
    </div>
  );
}
