import { describe, expect, it } from 'vitest';
import {
  buildSpecialOrderReservationDeadline,
  calculateSpecialOrderReservationDeposit,
  isSpecialOrderReservationExpired,
} from './order-reservation.helpers';

describe('order-reservation.helpers', () => {
  it('calculates the 10 percent reservation deposit', () => {
    expect(calculateSpecialOrderReservationDeposit(100000)).toBe(10000);
    expect(calculateSpecialOrderReservationDeposit(-1)).toBe(0);
  });

  it('builds a 7 day reservation deadline', () => {
    expect(buildSpecialOrderReservationDeadline('2026-04-01T10:00:00.000Z').toISOString()).toBe(
      '2026-04-08T10:00:00.000Z',
    );
  });

  it('detects expired reservations', () => {
    expect(
      isSpecialOrderReservationExpired(
        '2026-04-01T10:00:00.000Z',
        new Date('2026-04-09T10:00:00.000Z'),
      ),
    ).toBe(true);
  });
});
