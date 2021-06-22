import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'
import path from 'path'

import sqlite3 from 'better-sqlite3'
import { PythonShell } from 'python-shell'

export async function populate(
  db = sqlite3('./generated/cedict.db'),
  tempdir = './generated'
) {
  const s3 = sqlite3(':memory:')

  process.chdir(tempdir)

  s3.exec(/* sql */ `
  CREATE TABLE "cedict" (
    "simplified"    TEXT NOT NULL,
    "traditional"   TEXT CHECK ("simplified" != "traditional"),
    "reading"       TEXT NOT NULL,
    "english"       JSON NOT NULL
  );

  CREATE UNIQUE INDEX idx_u_cedict ON "cedict" ("simplified", "traditional", "reading");
  `)

  try {
    console.log('Downloading the latest CEDICT.')

    const zipName = './cedict_1_0_ts_utf-8_mdbg.txt.gz'
    const urlString =
      'https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz'
    if (fs.existsSync(zipName)) {
      fs.unlinkSync(zipName)
    }
    const f = fs.createWriteStream(zipName)
    https.get(urlString, (res) => {
      res.pipe(f)
    })

    await new Promise((resolve, reject) => {
      f.once('error', reject).once('finish', resolve)
    })

    execSync(`gzip -d ${zipName}`)

    const unzipName = './cedict_1_0_ts_utf-8_mdbg.txt'
    const f2 = fs.createReadStream(unzipName)
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "cedict" ("simplified", "traditional", "reading", "english")
    VALUES (@simplified, @traditional, @reading, @english)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const m = /^(\p{sc=Han}+) (\p{sc=Han}+) \[([^\]]+)\] \/(.+)\/$/u.exec(
          ln.trim()
        )

        if (m) {
          stmt.run({
            simplified: m[2],
            traditional: m[2] === m[1] ? null : m[1],
            reading: m[3],
            english: JSON.stringify(m[4].split('/'))
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const m = /^(\p{sc=Han}+) (\p{sc=Han}+) \[([^\]]+)\] \/(.+)\/$/u.exec(
          line.trim()
        )

        if (m) {
          stmt.run({
            simplified: m[2],
            traditional: m[2] === m[1] ? null : m[1],
            reading: m[3],
            english: JSON.stringify(m[4].split('/'))
          })
        }

        resolve()
      })
    })

    fs.unlinkSync(unzipName)
    s3.exec('COMMIT')
  } catch (e) {
    console.error(e)
  }

  db.exec(/* sql */ `
  CREATE TABLE "cedict" (
    "entry"         JSON NOT NULL,  -- TEXT[]
    "reading"       JSON NOT NULL,  -- TEXT[]
    "english"       JSON NOT NULL,  -- TEXT[]
    "frequency"     FLOAT
  );

  CREATE INDEX idx_cedict_entry ON cedict ("entry");
  CREATE INDEX idx_cedict_frequency ON cedict ("frequency");
  `)

  {
    await (async () => {
      const stmt = db.prepare(/* sql */ `
      INSERT INTO "cedict" ("entry", "reading", "english", "frequency")
      VALUES (@entry, @reading, @english, @frequency)
      `)

      const py = new PythonShell(path.join(__dirname, '../script_wordfreq.py'), {
        mode: 'json',
        pythonPath: process.env.PYTHONPATH
      })
      const lots = new Map<string, {
        entry: string
        reading: string
        english: string
        frequency?: number
      }>()

      py.on('message', (msg: {
        c: string
        f: number
      }) => {
        const v = lots.get(msg.c)
        if (v) {
          v.frequency = msg.f
          lots.set(msg.c, v)
        }
      })

      s3
        .prepare(
        /* sql */ `
      SELECT
        "simplified",
        json_group_array("traditional") "alt",
        json_group_array("reading") "reading",
        json_group_array(json("english")) "english"
      FROM cedict
      GROUP BY "simplified"
    `
        )
        .all()
        .map((p) => {
          const entry: string[] = [
            p.simplified,
            ...(JSON.parse(p.alt) as string[]).filter((it) => it)
          ].filter((a, i, r) => r.indexOf(a) === i)

          const english = (JSON.parse(p.english) as string[][])
            .flat()
            .filter((a, i, r) => r.indexOf(a) === i)

          lots.set(entry[0], {
            entry: JSON.stringify(entry),
            reading: p.reading,
            english: JSON.stringify(english)
          })

          py.send(entry[0])
        })

      await new Promise<void>((resolve, reject) => {
        py.end((err) => err ? reject(err) : resolve())
      })

      db.transaction(() => {
        for (const v in lots.values()) {
          stmt.run(v)
        }
      })()
    })()
  }

  s3.close()
  db.close()
}

if (require.main === module) {
  populate()
}
