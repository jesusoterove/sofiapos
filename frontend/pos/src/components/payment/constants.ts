/**
 * Quick amount constants for payment keypad.
 */
export const QUICK_AMOUNT_01 = 1000
export const QUICK_AMOUNT_02 = 2000
export const QUICK_AMOUNT_03 = 5000
export const QUICK_AMOUNT_04 = 10000
export const QUICK_AMOUNT_05 = 20000
export const QUICK_AMOUNT_06 = 50000
export const QUICK_AMOUNT_07 = 100000

/**
 * Array of all quick amounts in order.
 */
export const QUICK_AMOUNTS = [
  QUICK_AMOUNT_01,
  QUICK_AMOUNT_02,
  QUICK_AMOUNT_03,
  QUICK_AMOUNT_04,
  QUICK_AMOUNT_05,
  QUICK_AMOUNT_06,
  QUICK_AMOUNT_07,
] as const

/**
 * First 5 quick amounts (for column 1).
 */
export const QUICK_AMOUNTS_FIRST_FIVE = [
  QUICK_AMOUNT_01,
  QUICK_AMOUNT_02,
  QUICK_AMOUNT_03,
  QUICK_AMOUNT_04,
  QUICK_AMOUNT_05,
] as const

