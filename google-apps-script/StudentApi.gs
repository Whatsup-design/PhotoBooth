const SHEET_NAME = 'Early Bird Student List'
const FORMAT_MIN = 1
const FORMAT_MAX = 12

const HEADERS = {
  ID: 'รหัส / ID',
  THAI_NICKNAME: 'ชื่อเล่น',
  NICKNAME: 'Nickname',
  PAID: 'Paid',
  COME: 'Come',
  FORMAT: 'format',
}

function doGet(e) {
  try {
    const action = getParam(e, 'action') || 'all'

    if (action === 'all') {
      const students = getAllStudents()
      return jsonResponse({ success: true, action: 'all', count: students.length, data: students })
    }

    if (action === 'getById') {
      const id = getParam(e, 'id')
      if (!id) throw new Error('Missing id')
      return jsonResponse({ success: true, action: 'getById', data: getStudentById(id) })
    }

    if (action === 'debugHeaders') {
      return debugHeaders()
    }

    return jsonResponse({ success: false, error: 'Invalid GET action. Use action=all, getById, or debugHeaders' })
  } catch (error) {
    return jsonResponse({ success: false, error: errorMessage(error) })
  }
}

function doPost(e) {
  try {
    const body = parseBody(e)
    const action = String(body.action || '').trim()

    if (action === 'createStudent') {
      const id = String(body.id || '').trim()
      if (!id) throw new Error('Missing id')

      const result = withSheetLock(() => createStudent({
        id,
        thaiNickname: String(body.thaiNickname || '').trim(),
        nickname: String(body.nickname || '').trim(),
        paid: true,
        come: normalizeBoolean(body.come),
        format: body.format,
      }))

      return jsonResponse({ success: true, message: 'Emergency student added successfully', data: result })
    }

    if (action === 'updatePaid') {
      const id = String(body.id || '').trim()
      if (!id) throw new Error('Missing id')

      if (!normalizeBoolean(body.paid)) {
        throw new Error('Paid must be true')
      }

      const result = withSheetLock(() =>
        updateFieldById(id, HEADERS.PAID, true)
      )

      return jsonResponse({ success: true, message: 'Paid updated successfully', data: result })
    }

    if (action === 'updateCome') {
      const id = String(body.id || '').trim()
      if (!id) throw new Error('Missing id')

      const come = normalizeBoolean(body.come)
      const result = withSheetLock(() =>
        come
          ? markCameWithFormatById(id, requireFormat(body.format))
          : markNotCameById(id)
      )

      return jsonResponse({
        success: true,
        message: come ? 'Come and format updated successfully' : 'Come cancelled successfully',
        data: result,
      })
    }

    if (action === 'updateFormat') {
      const id = String(body.id || '').trim()
      if (!id) throw new Error('Missing id')

      const result = withSheetLock(() => updateFormatById(id, requireFormat(body.format)))
      return jsonResponse({ success: true, message: 'Format updated successfully', data: result })
    }

    return jsonResponse({ success: false, error: 'Invalid action. Use action=createStudent, updatePaid, updateCome, or updateFormat' })
  } catch (error) {
    return jsonResponse({ success: false, error: errorMessage(error) })
  }
}

// Run once from the Apps Script editor to add the required format header.
function ensureFormatColumn() {
  const sheet = getSheet()
  const lastColumn = sheet.getLastColumn()
  if (lastColumn < 1) throw new Error('The sheet does not have a header row')

  const headers = cleanHeaders(sheet.getRange(1, 1, 1, lastColumn).getValues()[0])
  const currentIndex = headers.indexOf(HEADERS.FORMAT)

  if (currentIndex !== -1) {
    return { success: true, message: 'Format column already exists', columnNumber: currentIndex + 1 }
  }

  const columnNumber = lastColumn + 1
  sheet.getRange(1, columnNumber).setValue(HEADERS.FORMAT)
  return { success: true, message: 'Format column added successfully', columnNumber }
}

function getAllStudents() {
  const sheet = getSheet()
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) return []

  const indexes = getIndexes(cleanHeaders(values[0]))
  return values.slice(1)
    .map((row, index) => studentFromRow(row, index + 2, indexes))
    .filter(Boolean)
}

function getStudentById(id) {
  const sheet = getSheet()
  const values = sheet.getDataRange().getValues()
  if (values.length < 2) throw new Error('No data found')

  const indexes = getIndexes(cleanHeaders(values[0]))
  const found = findRowById(values, indexes.id, id)
  if (!found) throw new Error(`Student id "${id}" not found`)

  return studentFromRow(found.row, found.rowNumber, indexes)
}

function createStudent(input) {
  const sheet = getSheet()
  const values = sheet.getDataRange().getValues()
  if (values.length < 1) throw new Error('The sheet does not have a header row')

  const indexes = getIndexes(cleanHeaders(values[0]))
  if (findRowById(values, indexes.id, input.id)) {
    throw new Error(`Student id "${input.id}" already exists`)
  }

  const format = input.come ? requireFormat(input.format) : null
  const row = Array(values[0].length).fill('')

  row[indexes.id] = input.id
  row[indexes.thaiNickname] = input.thaiNickname
  row[indexes.nickname] = input.nickname
  row[indexes.paid] = true
  row[indexes.come] = input.come
  row[indexes.format] = format === null ? '' : format

  sheet.appendRow(row)
  return studentFromRow(row, sheet.getLastRow(), indexes)
}

function markCameWithFormatById(id, format) {
  const sheet = getSheet()
  const values = sheet.getDataRange().getValues()
  const indexes = getIndexes(cleanHeaders(values[0]))
  const found = findRowById(values, indexes.id, id)
  if (!found) throw new Error(`Student id "${id}" not found`)

  if (!normalizeBoolean(found.row[indexes.paid])) {
    throw new Error('Student has not paid yet and cannot be marked as came')
  }

  sheet.getRange(found.rowNumber, indexes.come + 1).setValue(true)
  sheet.getRange(found.rowNumber, indexes.format + 1).setValue(format)
  return { rowNumber: found.rowNumber, id, come: true, format }
}

function markNotCameById(id) {
  const sheet = getSheet()
  const values = sheet.getDataRange().getValues()
  const indexes = getIndexes(cleanHeaders(values[0]))
  const found = findRowById(values, indexes.id, id)
  if (!found) throw new Error(`Student id "${id}" not found`)

  sheet.getRange(found.rowNumber, indexes.come + 1).setValue(false)
  sheet.getRange(found.rowNumber, indexes.format + 1).clearContent()
  return { rowNumber: found.rowNumber, id, come: false, format: null }
}

function updateFormatById(id, format) {
  const sheet = getSheet()
  const values = sheet.getDataRange().getValues()
  const indexes = getIndexes(cleanHeaders(values[0]))
  const found = findRowById(values, indexes.id, id)
  if (!found) throw new Error(`Student id "${id}" not found`)

  if (!normalizeBoolean(found.row[indexes.come])) {
    throw new Error('Student must be marked as came before changing format')
  }

  sheet.getRange(found.rowNumber, indexes.format + 1).setValue(format)
  return { rowNumber: found.rowNumber, id, format }
}

function updateFieldById(id, header, value) {
  const sheet = getSheet()
  const values = sheet.getDataRange().getValues()
  const indexes = getIndexes(cleanHeaders(values[0]))
  const found = findRowById(values, indexes.id, id)
  if (!found) throw new Error(`Student id "${id}" not found`)

  const fieldIndex = header === HEADERS.PAID ? indexes.paid : -1
  if (fieldIndex === -1) throw new Error('Invalid field')

  sheet.getRange(found.rowNumber, fieldIndex + 1).setValue(value)
  return { rowNumber: found.rowNumber, id, field: header, value }
}

function studentFromRow(row, rowNumber, indexes) {
  const id = String(row[indexes.id] || '').trim()
  if (!id) return null

  return {
    rowNumber,
    id,
    thaiNickname: String(row[indexes.thaiNickname] || '').trim(),
    nickname: String(row[indexes.nickname] || '').trim(),
    paid: normalizeBoolean(row[indexes.paid]),
    come: normalizeBoolean(row[indexes.come]),
    format: normalizeFormat(row[indexes.format]),
  }
}

function findRowById(values, idIndex, id) {
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex] || '').trim() === id) {
      return { row: values[i], rowNumber: i + 1 }
    }
  }
  return null
}

function getIndexes(headers) {
  const indexes = {
    id: headers.indexOf(HEADERS.ID),
    thaiNickname: headers.indexOf(HEADERS.THAI_NICKNAME),
    nickname: headers.indexOf(HEADERS.NICKNAME),
    paid: headers.indexOf(HEADERS.PAID),
    come: headers.indexOf(HEADERS.COME),
    format: headers.indexOf(HEADERS.FORMAT),
  }

  const required = [
    ['id', HEADERS.ID],
    ['thaiNickname', HEADERS.THAI_NICKNAME],
    ['nickname', HEADERS.NICKNAME],
    ['paid', HEADERS.PAID],
    ['come', HEADERS.COME],
    ['format', HEADERS.FORMAT],
  ]

  const missing = required
    .filter(([key]) => indexes[key] === -1)
    .map(([, header]) => header)

  if (missing.length > 0) throw new Error(`Missing headers: ${missing.join(', ')}`)
  return indexes
}

function withSheetLock(callback) {
  const lock = LockService.getScriptLock()
  let locked = false

  try {
    lock.waitLock(10000)
    locked = true
    return callback()
  } finally {
    if (locked) lock.releaseLock()
  }
}

function getSheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
  if (!sheet) throw new Error(`Sheet "${SHEET_NAME}" not found`)
  return sheet
}

function getParam(e, key) {
  return e && e.parameter ? String(e.parameter[key] || '').trim() : ''
}

function cleanHeaders(row) {
  return row.map((header) => String(header).trim().replace(/\s+/g, ' '))
}

function normalizeBoolean(value) {
  if (value === true) return true
  if (value === false) return false

  return ['true', 'yes', '1', 'paid', 'come', 'มาแล้ว', 'จ่ายแล้ว', 'ชำระแล้ว']
    .includes(String(value || '').trim().toLowerCase())
}

function normalizeFormat(value) {
  const text = String(value || '').trim()
  if (!/^\d+$/.test(text)) return null

  const format = Number(text)
  return format >= FORMAT_MIN && format <= FORMAT_MAX ? format : null
}

function requireFormat(value) {
  const format = normalizeFormat(value)
  if (format === null) throw new Error(`Format must be an integer from ${FORMAT_MIN} to ${FORMAT_MAX}`)
  return format
}

function parseBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {}
  try {
    return JSON.parse(e.postData.contents)
  } catch (error) {
    return e.parameter || {}
  }
}

function debugHeaders() {
  const sheet = getSheet()
  return jsonResponse({
    success: true,
    sheetName: SHEET_NAME,
    headers: sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0],
  })
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}
