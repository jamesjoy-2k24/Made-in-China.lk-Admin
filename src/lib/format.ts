import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = 'Asia/Colombo';

export const formatCurrency = (
  amount: number,
  currency: string = 'LKR'
): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

export const formatDate = (
  date: string | Date,
  format: string = 'YYYY-MM-DD'
): string => {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format(format);
};

export const formatDateTime = (date: string | Date): string => {
  return dayjs(date).tz(DEFAULT_TIMEZONE).format('YYYY-MM-DD HH:mm');
};

export const formatRelativeTime = (date: string | Date): string => {
  return dayjs(date).tz(DEFAULT_TIMEZONE).fromNow();
};

export const toUTC = (date: string | Date): string => {
  return dayjs(date).utc().toISOString();
};

export const fromUTC = (date: string): dayjs.Dayjs => {
  return dayjs.utc(date).tz(DEFAULT_TIMEZONE);
};

export const truncateText = (text: string, length: number = 50): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};
