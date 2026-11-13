const KEY = 'ckkPosPrinter'

export const DEFAULT_PRINTER = {
  name: 'Default System Printer',
  paperSize: '80mm',
  connection: 'USB',
  printBill: true,
  printKot: true,
  autoPrintBill: true,
  autoPrintKot: true,
}

export function readPrinterSettings() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT_PRINTER }
    return { ...DEFAULT_PRINTER, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PRINTER }
  }
}

export function writePrinterSettings(value) {
  const next = { ...DEFAULT_PRINTER, ...value }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function paperClass(paperSize) {
  return paperSize === '58mm' ? 'thermal-58' : 'thermal-80'
}
