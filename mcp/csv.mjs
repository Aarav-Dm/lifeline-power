// Small RFC 4180 reader for the committed kits. No network. No writes.

export function parseCsv(text) {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const records = []
  let field = ""
  let quoted = false
  let fieldWasQuoted = false
  let record = []
  let saw = false

  const pushField = () => {
    record.push(field === "" && !fieldWasQuoted ? null : field)
    field = ""
    fieldWasQuoted = false
  }
  const pushRecord = () => {
    pushField()
    records.push(record)
    record = []
    saw = false
  }

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      quoted = true
      fieldWasQuoted = true
      saw = true
      continue
    }
    if (c === ",") {
      pushField()
      saw = true
      continue
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++
      if (saw || field.length > 0 || fieldWasQuoted) pushRecord()
      continue
    }
    field += c
    saw = true
  }
  if (saw || field.length > 0 || fieldWasQuoted) pushRecord()

  const [headerRow, ...data] = records
  return {
    header: (headerRow ?? []).map((h) => h ?? ""),
    rows: data,
  }
}
