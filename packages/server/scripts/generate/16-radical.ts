import sqlite3 from 'better-sqlite3'

export async function populate(db = sqlite3('./generated/radical.db')) {
  const s3 = sqlite3('./assets/radical.db', {
    readonly: true
  })

  const ordering = (() => {
    const db = sqlite3('./assets/junda.db', { readonly: true })

    const map = new Map<string, number>()
    db.prepare(/* sql */ `
    SELECT [character] c, raw_freq freq FROM hanzi
    `).all().map(({ c, freq }) => {
      map.set(c, freq)
    })

    db.close()

    return map
  })()

  const reHan = /\p{sc=Han}/gu
  const getHan = (s?: string) => {
    if (!s) {
      return []
    }

    let m: RegExpExecArray | null = null
    reHan.lastIndex = 0

    const out = new Map<string, number>()
    while ((m = reHan.exec(s))) {
      out.set(m[0], ordering.get(m[0]) || 0)
    }

    return Array.from(out).sort(([, v1], [, v2]) => v2 - v1).map(([k]) => k)
  }

  db.exec(/* sql */ `
  CREATE TABLE radical (
    "entry"     TEXT NOT NULL UNIQUE,
    "sub"       JSON NOT NULL,    -- TEXT[]
    "sup"       JSON NOT NULL,    -- TEXT[]
    "var"       JSON NOT NULL     -- TEXT[]
  );
  `)

  db.transaction(() => {
    const batchSize = 10000
    const stmt = db.prepare(/* sql */ `
    INSERT INTO radical ("entry", "sub", "sup", "var")
    VALUES (@entry, @sub, @sup, @var)
    `)

    s3
      .prepare(
        /* sql */ `
    SELECT "entry", "sub", "sup", "var"
    FROM radical
    `
      )
      .all()
      .map((p) => {
        stmt.run({
          entry: p.entry,
          sub: JSON.stringify(getHan(p.sub)),
          sup: JSON.stringify(getHan(p.sup)),
          var: JSON.stringify(getHan(p.var))
        })
      })
  })()

  db.close()
  s3.close()
}

if (require.main === module) {
  populate()
}
