/**
 * Receipt printing service for POS printers (ESC/POS).
 */
import type { Order } from '@/hooks/useOrderManagement'

const ESC = 0x1b
const GS = 0x1d
const FS = 0x1c

/** ESC @ - Initialize printer */
const CMD_INIT = new Uint8Array([ESC, 0x40])
/** FS ( C - Select UTF-8 encoding (m=2) for Latin characters like Ñ, á, é */
const CMD_UTF8 = new Uint8Array([FS, 0x28, 0x43, 0x02, 0x00, 0x30, 0x02])
/** ESC d n - Print buffer and feed n lines (flush + advance paper to cutter) */
const CMD_FEED_LINES = (n: number) => new Uint8Array([ESC, 0x64, n])
/** GS V 0 - Full cut */
const CMD_CUT = new Uint8Array([GS, 0x56, 0x00])

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/** Fixed width for amount column so all amounts align right (e.g. $1,234.56). */
const AMOUNT_WIDTH = 12

/**
 * Build ESC/POS receipt content from order and totals.
 * All amounts are right-aligned in the same column.
 */
function buildReceiptText(
  order: Order,
  totals: { subtotal: number; taxes: number; discount: number; total: number },
  locale: string = 'en-US'
): string {
  const lines: string[] = []
  const width = 42
  const labelWidth = width - AMOUNT_WIDTH

  lines.push('='.repeat(width))
  lines.push('SofiaPOS - Receipt'.padStart((width + 18) / 2))
  lines.push('='.repeat(width))
  //lines.push('')
  lines.push(`Order: ${order.orderNumber}`)
  lines.push(`Date: ${new Date().toLocaleString(locale)}`)
  //lines.push('')
  lines.push('-'.repeat(width))

  for (const item of order.items) {
    const name = item.productName.length > 24 ? item.productName.slice(0, 21) + '...' : item.productName
    const leftPart = `${item.quantity} x ${name}`
    const amount = formatPrice(item.total).padStart(AMOUNT_WIDTH)
    lines.push(leftPart.padEnd(labelWidth) + amount)
  }

  lines.push('-'.repeat(width))
  lines.push('Subtotal:'.padEnd(labelWidth) + formatPrice(totals.subtotal).padStart(AMOUNT_WIDTH))
  if (totals.discount > 0) {
    lines.push('Discount:'.padEnd(labelWidth) + formatPrice(totals.discount).padStart(AMOUNT_WIDTH))
  }
  lines.push('Tax:'.padEnd(labelWidth) + formatPrice(totals.taxes).padStart(AMOUNT_WIDTH))
  //lines.push('')
  lines.push('TOTAL:'.padEnd(labelWidth) + formatPrice(totals.total).padStart(AMOUNT_WIDTH))
  //lines.push('')
  lines.push('='.repeat(width))
  lines.push('Thank you for your business!')
  lines.push('='.repeat(width))
  //Three empty lines so the cut works fine.
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
  const encoder = new TextEncoder()
  const textBytes = encoder.encode(text)
  const feed = CMD_FEED_LINES(4)
  const totalLength =
    CMD_INIT.length + CMD_UTF8.length + textBytes.length + feed.length + CMD_CUT.length
  const result = new Uint8Array(totalLength)
  let offset = 0
  result.set(CMD_INIT, offset)
  offset += CMD_INIT.length
  result.set(CMD_UTF8, offset)
  offset += CMD_UTF8.length
  result.set(textBytes, offset)
  offset += textBytes.length
  result.set(feed, offset)
  offset += feed.length
  result.set(CMD_CUT, offset)
  return result
}

/**
 * Build and print a sample receipt with 1 item (for printer test).
 */
export async function printSampleReceipt(printerName: string): Promise<boolean> {
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
        taxAmount: 1,
      },
    ],
    status: 'paid',
    subtotal: 2000,
    taxes: 200,
    discount: 0,
    total: 2200,
  }
  const totals = { subtotal: 2000, taxes: 1, discount: 0, total: 2200 }
  return printReceipt(sampleOrder, totals, printerName)
}

/**
 * Print a receipt for the given order to the specified printer.
 */
export async function printReceipt(
  order: Order,
  totals: { subtotal: number; taxes: number; discount: number; total: number },
  printerName: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !(window as any).electronAPI?.printers) {
    console.error('Receipt printing requires Electron environment')
    return false
  }

  try {
    const receiptText = buildReceiptText(order, totals)
    const data = textToEscPos(receiptText)
    await (window as any).electronAPI.printers.sendRaw(printerName, data)
    return true
  } catch (error) {
    console.error('Failed to print receipt:', error)
    throw error
  }
}
