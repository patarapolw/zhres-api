import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import yaml from 'js-yaml'

export async function populate(db = sqlite3('./generated/level.db')) {
  const hLevel = (() => {
    const level: {
      [level: string]: {
        hanzi: string
      }
    } = yaml.load(fs.readFileSync('./assets/level/hanzi.yaml', 'utf-8')) as any

    const map = new Map<string, number>()
    Object.entries(level).map(([lv_, { hanzi }]) => {
      const lv = parseInt(lv_);

      (hanzi.match(/\p{sc=Han}/gu) || []).map((h) => {
        map.set(h, lv)
      })
    })

    return map
  })()

  const vLevel = (() => {
    const level: {
      [level: string]: {
        vocab: string[]
      }
    } = yaml.load(fs.readFileSync('./assets/level/vocab.yaml', 'utf-8')) as any

    const map = new Map<string, number>()
    Object.entries(level).map(([lv_, { vocab }]) => {
      const lv = parseInt(lv_);

      vocab.map((v) => {
        map.set(v, lv)
      })
    })

    return map
  })()

  db.exec(/* sql */ `
  CREATE TABLE "level" (
    "entry"   TEXT NOT NULL PRIMARY KEY,
    "hanzi"   INT,
    "vocab"   INT
  );

  CREATE INDEX idx_level_hanzi ON "level"("hanzi");
  CREATE INDEX idx_level_vocab ON "level"("vocab");
  `)

  db.transaction(() => {
    const batchSize = 5000
    const stmt = db.prepare(/* sql */ `
    INSERT INTO "level" ("entry", "hanzi", "vocab")
    VALUES (@entry, @hanzi, @vocab)
    `)

    Array.from(new Set([
      ...hLevel.keys(),
      ...vLevel.keys()
    ])).map((entry) => {
      stmt.run({
        entry,
        hanzi: hLevel.get(entry),
        vocab: vLevel.get(entry)
      })
    })
  })()

  db.close()
}

if (require.main === module) {
  populate()
}
