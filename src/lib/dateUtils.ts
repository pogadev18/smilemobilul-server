// utils/dateUtils.ts

import { zonedTimeToUtc, utcToZonedTime, format } from 'date-fns-tz';

type DateStrings = {
  [key: string]: string;
};

export const formatDatesToRomanianTime = (dates: DateStrings): DateStrings => {
  const timeZone = 'Europe/Bucharest';
  let formattedDates: DateStrings = {};

  for (const key in dates) {
    const zonedDate = utcToZonedTime(dates[key], timeZone);
    const utcDate = zonedTimeToUtc(zonedDate, timeZone);
    formattedDates[key] = format(utcDate, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", {
      timeZone: 'UTC',
    });
  }

  return formattedDates;
};
