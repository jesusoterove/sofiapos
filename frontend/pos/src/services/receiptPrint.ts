/**
 * Receipt printing service for POS printers (ESC/POS).
 */
import type { Order } from '@/hooks/useOrderManagement'
import i18n from '@/i18n'
import { getRegistration } from '@/utils/registration'
import { formatCurrency, formatDateTime } from '@sofiapos/shared/utils'

const ESC = 0x1b
const GS = 0x1d

/** ESC @ - Initialize printer */
const CMD_INIT = new Uint8Array([ESC, 0x40])
// const CMD_UTF8 = new Uint8Array([ESC, 0x74, 0x02])
/** ESC d n - Print buffer and feed n lines (flush + advance paper to cutter) */
const CMD_FEED_LINES = (n: number) => new Uint8Array([ESC, 0x64, n])
/** GS V 0 - Full cut */
const CMD_CUT = new Uint8Array([GS, 0x56, 0x00])
/** * Use Code Page 6 for ISO-8859-1 (Latin-1).
 * If 0x06 doesn't work, try 0x10 (decimal 16) for WPC1252.
 */
const CMD_SELECT_CODE_PAGE = new Uint8Array([ESC, 0x74, 0x06]);

const BUSINESS_NAME = 'BUÑUELOS LOCOS'

function formatPrice(price: number, locale: string): string {
  return formatCurrency(price, {
    locale,
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/** Fixed width for Qty column (right-aligned). */
const QTY_WIDTH = 4
/** Fixed width for amount column so all amounts align right (e.g. $1,234.56). */
const AMOUNT_WIDTH = 10
/** Receipt width in characters. */
const WIDTH = 42
/** Space for description: width - qty - amount. */
const DESC_WIDTH = WIDTH - QTY_WIDTH - AMOUNT_WIDTH

/**
 * Build ESC/POS receipt content from order and totals.
 * Format: Description -> Qty -> Total (Qty and Total fixed length, right aligned).
 */
function centerText(text: string): string {
  return text.padStart((WIDTH + text.length) / 2)
}

function buildReceiptText(
  order: Order,
  totals: { subtotal: number; taxes: number; discount: number; total: number },
  paymentMethod: 'cash' | 'bank_transfer'
): string {
  const locale = i18n.language === 'es' ? 'es-ES' : 'en-US'
  const tr = (key: string) => (i18n.t(`receipt.${key}`) as string) || key
  const lines: string[] = []
  const labelWidth = WIDTH - AMOUNT_WIDTH

  const registration = getRegistration()
  const address = registration?.storeName || ''

  // Header
  lines.push('='.repeat(WIDTH))
  lines.push(centerText(BUSINESS_NAME))
  lines.push('='.repeat(WIDTH))
  if (address) {
    lines.push(centerText(address))
  }
  lines.push('-'.repeat(WIDTH))

  // Transaction metadata
  const receiptLabel = tr('receipt')
  lines.push(centerText(`${receiptLabel}: #${order.orderNumber}`))
  lines.push(centerText(formatDateTime(new Date(), {
    locale,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })))
  lines.push('-'.repeat(WIDTH))

  // Itemized details: Description -> Qty -> Total (Qty and Total fixed length, right aligned)
  for (const item of order.items) {
    const desc = item.productName.length > DESC_WIDTH ? item.productName.slice(0, DESC_WIDTH - 3) + '...' : item.productName
    const qty = String(item.quantity).padStart(QTY_WIDTH)
    const total = formatPrice(item.total, locale).padStart(AMOUNT_WIDTH)
    lines.push(desc.padEnd(DESC_WIDTH) + qty + total)
  }

  // Summary
  lines.push('-'.repeat(WIDTH))
  lines.push(tr('subtotal').padEnd(labelWidth) + formatPrice(totals.subtotal, locale).padStart(AMOUNT_WIDTH))
  if (totals.discount > 0) {
    lines.push(tr('discount').padEnd(labelWidth) + formatPrice(totals.discount, locale).padStart(AMOUNT_WIDTH))
  }
  lines.push(tr('tax').padEnd(labelWidth) + formatPrice(totals.taxes, locale).padStart(AMOUNT_WIDTH))
  lines.push(tr('total').toUpperCase().padEnd(labelWidth) + formatPrice(totals.total, locale).padStart(AMOUNT_WIDTH))
  lines.push('-'.repeat(WIDTH))

  // Payment method
  const paymentLabel = tr('paymentMethod')
  const paymentValue = paymentMethod === 'cash' ? tr('cash') : tr('bankTransfer')
  lines.push(centerText(`${paymentLabel}: ${paymentValue}`))
  lines.push('='.repeat(WIDTH))
  lines.push(centerText(tr('thankYou')))
  lines.push('='.repeat(WIDTH))
  lines.push('')
  lines.push('')

  return lines.join('\n')
}

/**
 * Convert text to ESC/POS bytes (init + UTF-8 + text + feed + cut).
 * UTF-8 mode enables Latin characters (Ñ, á, é, etc.) on supported printers.
 * Feed lines before cut ensures paper advances to cutter position for reliable cutting.
 */
function textToEscPos(text: string): Uint8Array {
  // Manually encode to Latin-1 bytes (1 char = 1 byte)
  const textBytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    textBytes[i] = text.charCodeAt(i) & 0xFF; 
  }
  
  const feed = CMD_FEED_LINES(4);
  const totalLength = 
    CMD_INIT.length + 
    CMD_SELECT_CODE_PAGE.length + 
    textBytes.length + 
    feed.length + 
    CMD_CUT.length;

  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  result.set(CMD_INIT, offset); offset += CMD_INIT.length;
  result.set(CMD_SELECT_CODE_PAGE, offset); offset += CMD_SELECT_CODE_PAGE.length;
  result.set(textBytes, offset); offset += textBytes.length;
  result.set(feed, offset); offset += feed.length;
  result.set(CMD_CUT, offset);
  
  return result;
}

/**
 * Build and print a sample receipt with 1 item (for printer test).
 */
export async function printSampleReceipt(printerName: string): Promise<boolean> {
  const sampleTotals = { subtotal: 2000, taxes: 1, discount: 0, total: 2200 }
  const sampleOrder: Order = {
    id: 0,
    orderNumber: 'TEST-001',
    storeId: 1,
    items: [
      {
        id: 'sample-1',
        productId: 0,
        productName: 'Buñuelo tradicional',
        quantity: 1,
        unitPrice: 2000,
        taxRate: 0.1,
        total: 2000,
        taxAmount: 200,
      },
    ],
    status: 'paid',
    subtotal: 2000,
    taxes: 200,
    discount: 0,
    total: 2200,
  }
  return printReceipt(sampleOrder, sampleTotals, printerName, 'cash')
}

/**
 * Print a receipt for the given order to the specified printer.
 */
export async function printReceipt(
  order: Order,
  totals: { subtotal: number; taxes: number; discount: number; total: number },
  printerName: string,
  paymentMethod: 'cash' | 'bank_transfer' = 'cash'
): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.printers) {
    console.error('Receipt printing requires Electron environment')
    return false
  }

  try {
    const receiptText = buildReceiptText(order, totals, paymentMethod)
    const data = textToEscPos(receiptText)
    await (window as any).electronAPI.printers.sendRaw(printerName, data)
    return true
  } catch (error) {
    console.error('Failed to print receipt:', error)
    throw error
  }
}
