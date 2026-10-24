// RFC 4180 CSV parser. No dependency.
// - quoted fields may contain embedded commas, newlines (CR/LF/CRLF) and doubled quotes ("")
// - CRLF and LF line endings are both accepted
// - a trailing newline at end of input is ignored (does not produce an extra empty row)
// - an empty (unquoted, zero-length) cell becomes null; a quoted empty field ("") is "" (not null)
//
// Shape: the first record is the header (never null-mapped); every later record is a data row.

export function parseCsv(text: string): { header: string[]; rows: (string | null)[][] } {
  const records: (string | null)[][] = []
  let field = ""
  let quoted = false // currently inside a quoted field
  let fieldWasQuoted = false // this field opened with a quote
  let record: (string | null)[] = []
  let sawAnyChar = false // any char on the current (pending) record, so we can drop a trailing empty line

  const pushField = () => {
    // Unquoted empty cell -> null; quoted empty ("") -> "".
    if (field === "" && !fieldWasQuoted) {
      record.push(null)
    } else {
      record.push(field)
    }
    field = ""
    fieldWasQuoted = false
  }

  const pushRecord = () => {
    pushField()
    records.push(record)
    record = []
    sawAnyChar = false
  }

  const n = text.length
  for (let i = 0; i < n; i++) {
    const c = text[i]

    if (quoted) {
      if (c === '"') {
        if (i + 1 < n && text[i + 1] === '"') {
          field += '"' // doubled quote -> literal quote
          i++
        } else {
          quoted = false // closing quote
        }
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      quoted = true
      fieldWasQuoted = true
      sawAnyChar = true
      continue
    }

    if (c === ",") {
      pushField()
      sawAnyChar = true
      continue
    }

    if (c === "\r") {
      // CRLF: let the \n handle the record break; a lone \r also ends a record.
      if (i + 1 < n && text[i + 1] === "\n") {
        i++
      }
      pushRecord()
      continue
    }

    if (c === "\n") {
      pushRecord()
      continue
    }

    field += c
    sawAnyChar = true
  }

  // Flush the final record unless it is a trailing empty line produced by a terminating newline.
  if (sawAnyChar || field !== "" || record.length > 0) {
    pushRecord()
  }

  const first = records.shift() ?? []
  // Header cells are always strings (a null-mapped empty header cell becomes "").
  const header = first.map((cell) => (cell === null ? "" : cell))
  return { header, rows: records }
}
