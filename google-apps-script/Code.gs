const SHEET_NAME = 'PUT_MY_SHEET_TAB_NAME_HERE'

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'all').trim().toLowerCase()

    if (action !== 'all' && action !== 'paid') {
      return jsonResponse({ success: false, error: 'Unsupported action' })
    }

    const result = getSheetData()
    if (!result.success) {
      return jsonResponse(result)
    }

    const data = result.values.slice(1).reduce((students, row, rowIndex) => {
      const displayRow = result.displayValues[rowIndex + 1]
      const student = toStudent(row, displayRow, result.columns, rowIndex + 2)

      if (!student || (action === 'paid' && !student.paid)) {
        return students
      }

      students.push(student)
      return students
    }, [])

    return jsonResponse({
      success: true,
      action,
      count: data.length,
      data,
    })
  } catch (error) {
    return jsonResponse({ success: false, error: errorMessage(error) })
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  let hasLock = false

  try {
    lock.waitLock(10000)
    hasLock = true

    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}')
    const action = String(payload.action || '').trim()
    const id = String(payload.id || '').trim()

    if (action !== 'updateCome') {
      return jsonResponse({ success: false, error: 'Unsupported action' })
    }

    if (!id) {
      return jsonResponse({ success: false, error: 'Missing student id' })
    }

    if (typeof payload.come !== 'boolean') {
      return jsonResponse({ success: false, error: 'Come must be true or false' })
    }

    const result = getSheetData()
    if (!result.success) {
      return jsonResponse(result)
    }

    for (let rowIndex = 1; rowIndex < result.values.length; rowIndex += 1) {
      const currentId = result.displayValues[rowIndex][result.columns.id].trim()

      if (currentId !== id) {
        continue
      }

      result.sheet.getRange(rowIndex + 1, result.columns.come + 1).setValue(payload.come)

      return jsonResponse({
        success: true,
        action: 'updateCome',
        data: {
          rowNumber: rowIndex + 1,
          id,
          come: payload.come,
        },
      })
    }

    return jsonResponse({ success: false, error: `Student id "${id}" not found` })
  } catch (error) {
    return jsonResponse({ success: false, error: errorMessage(error) })
  } finally {
    if (hasLock) {
      lock.releaseLock()
    }
  }
}

function getSheetData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)

  if (!sheet) {
    return { success: false, error: `Sheet "${SHEET_NAME}" not found` }
  }

  const dataRange = sheet.getDataRange()
  const values = dataRange.getValues()
  const displayValues = dataRange.getDisplayValues()

  if (values.length === 0) {
    return { success: false, error: 'Sheet has no header row' }
  }

  const headers = displayValues[0].map((header) => header.trim())
  const columns = {
    id: findColumn(headers, ['รหัส / ID', 'ID', 'id']),
    thaiNickname: findColumn(headers, ['ชื่อเล่น', 'Thai Nickname', 'thaiNickname']),
    nickname: findColumn(headers, ['Nickname', 'nickname']),
    paid: findColumn(headers, ['Paid', 'paid']),
    come: findColumn(headers, ['Come', 'come', 'มาแล้ว', 'มา']),
  }

  const missing = Object.keys(columns).filter((key) => columns[key] === -1)
  if (missing.length > 0) {
    return { success: false, error: `Missing required column(s): ${missing.join(', ')}` }
  }

  return { success: true, sheet, values, displayValues, columns }
}

function toStudent(row, displayRow, columns, rowNumber) {
  const id = displayRow[columns.id].trim()
  const thaiNickname = displayRow[columns.thaiNickname].trim()
  const nickname = displayRow[columns.nickname].trim()

  if (id === '' && thaiNickname === '' && nickname === '') {
    return null
  }

  return {
    rowNumber,
    id,
    thaiNickname,
    nickname,
    paid: normalizeCheckbox(row[columns.paid]),
    come: normalizeCheckbox(row[columns.come]),
  }
}

function findColumn(headers, acceptedNames) {
  return headers.findIndex((header) => acceptedNames.includes(header))
}

function normalizeCheckbox(value) {
  return value === true || (typeof value === 'string' && value.trim().toLowerCase() === 'true')
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error)
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON)
}
