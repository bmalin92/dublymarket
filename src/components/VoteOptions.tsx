import type { OddsEntry } from '@/lib/types';
import { getHealerColor } from '@/lib/colors';

interface VoteOptionsProps {
  odds: OddsEntry[];
  disabled: boolean;
  disabledReason: string | null;
  onVote: (healer: string) => void;
  isDark: boolean;
}

export function VoteOptions({ odds, disabled, disabledReason, onVote, isDark }: VoteOptionsProps) {
  return (
    <div className="flex flex-col gap-2">
      {disabled && disabledReason && (
        <div className="rounded bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-transparent">
          {disabledReason}
        </div>
      )}
      {odds.map((entry) => {
        const color = getHealerColor(entry.healer, isDark);
        const isDiscipline = entry.healer === 'Discipline Priest';
        const isHolyPriest = entry.healer === 'Holy Priest';
        const isRestoDruid = entry.healer === 'Restoration Druid';
        const isHolyPaladin = entry.healer === 'Holy Paladin';
        const isMistweaverMonk = entry.healer === 'Mistweaver Monk';
        const isBardHunter = entry.healer === 'Bard Hunter';
        
        // Classes that should use dark text in Dark Mode due to bright background fills
        const usesDarkTextInDarkMode = isDiscipline || isHolyPriest || isRestoDruid || isHolyPaladin || isMistweaverMonk || isBardHunter;

        // Invert text colors for Discipline Priest, and use same dark text color for other bright classes in Dark Mode only
        let healerTextClass = '';
        if (isDiscipline) {
          healerTextClass = 'text-slate-100 dark:text-slate-800';
        } else if (usesDarkTextInDarkMode) {
          healerTextClass = 'dark:text-slate-800';
        }
        const normalTextClass = 'text-slate-800 dark:text-slate-100';

        // Apply glow/shadow:
        // In Dark Mode, all options get a brighter, broader glow matching their class color.
        // In Light Mode, only Discipline Priest gets a brighter, broader light-mode specific glow (#7F7F7F).
        let textStyle: React.CSSProperties | undefined = undefined;
        if (isDark) {
          textStyle = {
            textShadow: `0 0 3px ${color}, 0 0 3px ${color}, 0 0 8px ${color}, 0 0 8px ${color}, 0 0 20px ${color}`,
          };
        } else if (isDiscipline) {
          textStyle = {
            textShadow: '0 0 3px #7F7F7F, 0 0 3px #7F7F7F, 0 0 8px #7F7F7F, 0 0 8px #7F7F7F, 0 0 20px #7F7F7F',
          };
        }

        return (
          <button
            key={entry.healer}
            type="button"
            disabled={disabled}
            onClick={() => onVote(entry.healer)}
            className={`relative overflow-hidden rounded border border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900/40 px-3 py-2.5 text-left text-sm ${normalTextClass} disabled:cursor-not-allowed disabled:opacity-60 transition-colors hover:border-slate-400 dark:hover:border-slate-600`}
          >
            <span
              className="absolute inset-y-0 left-0 transition-all duration-300"
              style={{
                width: `${entry.percentage}%`,
                backgroundColor: color,
              }}
            />
            <span className="relative flex justify-between font-semibold">
              <span className={healerTextClass} style={textStyle}>{entry.healer}</span>
              <span>{entry.percentage.toFixed(1)}%</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
