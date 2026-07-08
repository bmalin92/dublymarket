import { MARKET_CLOSE_ET, MARKET_TIMEZONE, RESET_HOUR } from './config';

interface EtParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function getEtParts(date: Date): EtParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MARKET_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: map.hour === '24' ? 0 : Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  };
}

function etWallTimeToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcMs = targetUtcMs;
  for (let i = 0; i < 2; i++) {
    const etParts = getEtParts(new Date(utcMs));
    const etAsUtcMs = Date.UTC(
      etParts.year,
      etParts.month - 1,
      etParts.day,
      etParts.hour,
      etParts.minute,
      etParts.second,
    );
    utcMs += targetUtcMs - etAsUtcMs;
  }
  return new Date(utcMs);
}

export function getVotingDayKey(date: Date): string {
  const parts = getEtParts(date);
  const dayStart = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  if (parts.hour < RESET_HOUR) {
    dayStart.setUTCDate(dayStart.getUTCDate() - 1);
  }
  return dayStart.toISOString().slice(0, 10);
}

export function getNextResetTime(date: Date): Date {
  const parts = getEtParts(date);
  const todayReset = etWallTimeToUtc(parts.year, parts.month, parts.day, RESET_HOUR, 0);
  if (date.getTime() < todayReset.getTime()) {
    return todayReset;
  }
  const nextDayCalendar = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));
  return etWallTimeToUtc(
    nextDayCalendar.getUTCFullYear(),
    nextDayCalendar.getUTCMonth() + 1,
    nextDayCalendar.getUTCDate(),
    RESET_HOUR,
    0,
  );
}

const MARKET_CLOSE_UTC = etWallTimeToUtc(
  MARKET_CLOSE_ET.year,
  MARKET_CLOSE_ET.month,
  MARKET_CLOSE_ET.day,
  RESET_HOUR,
  0,
);

export function isMarketClosed(date: Date): boolean {
  return date.getTime() >= MARKET_CLOSE_UTC.getTime();
}
