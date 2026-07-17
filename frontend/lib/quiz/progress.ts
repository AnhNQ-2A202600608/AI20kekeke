import dayjs from 'dayjs';

export const getStreak = (activeDays: string[]): number => {
  let count = 0;
  let day = dayjs();
  const todayStr = day.format('YYYY-MM-DD');
  const yesterdayStr = day.add(-1, 'day').format('YYYY-MM-DD');

  if (!activeDays.includes(todayStr) && activeDays.includes(yesterdayStr)) {
    day = day.add(-1, 'day');
  }

  while (activeDays.includes(day.format('YYYY-MM-DD'))) {
    count++;
    day = day.add(-1, 'day');
  }

  return count;
};
