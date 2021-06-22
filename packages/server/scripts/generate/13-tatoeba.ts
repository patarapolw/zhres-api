import { execSync } from 'child_process'
import fs from 'fs'
import https from 'https'

import sqlite3 from 'better-sqlite3'

export async function populate(
  db = sqlite3('./generated/tatoeba.db'),
  tempdir = './generated'
) {
  const s3 = sqlite3(':memory:')

  process.chdir(tempdir)

  s3.exec(/* sql */ `
  CREATE TABLE IF NOT EXISTS "sentence" (
    "id"      INT NOT NULL PRIMARY KEY,
    "lang"    TEXT NOT NULL,
    "text"    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "link" (
    "id1"     INT NOT NULL,
    "id2"     INT NOT NULL,
    PRIMARY KEY ("id1", "id2")
  );
  `)

  try {
    console.log('Downloading the latest Tatoeba CMN.')

    const zipName = './cmn_sentences.tsv.bz2'
    const urlString =
      'https://downloads.tatoeba.org/exports/per_language/cmn/cmn_sentences.tsv.bz2'
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

    execSync(`bzip2 -d ${zipName}`)

    const unzipName = './cmn_sentences.tsv'
    const f2 = fs.createReadStream(unzipName)
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "sentence" ("id", "lang", "text")
    VALUES (@id, @lang, @text)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const rs = ln.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const rs = line.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
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

  try {
    console.log('Downloading the latest Tatoeba ENG.')

    const zipName = './eng_sentences.tsv.bz2'
    const urlString =
      'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2'
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

    execSync(`bzip2 -d ${zipName}`)

    const unzipName = './eng_sentences.tsv'
    const f2 = fs.createReadStream(unzipName)
    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "sentence" ("id", "lang", "text")
    VALUES (@id, @lang, @text)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const rs = ln.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const rs = line.split('\t')
        if (rs.length === 3) {
          stmt.run({
            id: parseInt(rs[0]),
            lang: rs[1],
            text: rs[2]
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

  try {
    console.log('Downloading the latest Tatoeba Links.')

    const zipName = './links.tar.bz2'
    const urlString = 'https://downloads.tatoeba.org/exports/links.tar.bz2'
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

    execSync(`tar -xf ${zipName}`)
    fs.unlinkSync(zipName)

    const unzipName = './links.csv'
    const f2 = fs.createReadStream(unzipName)

    s3.exec('BEGIN')
    const stmt = s3.prepare(/* sql */ `
    INSERT INTO "link" ("id1", "id2")
    VALUES (@id1, @id2)
    ON CONFLICT DO NOTHING
    `)

    let line = ''
    f2.on('data', (d) => {
      const lines = (line + d.toString()).split('\n')
      line = lines.pop() || ''

      lines.map((ln) => {
        const rs = ln.split('\t')
        if (rs.length === 2) {
          stmt.run({
            id1: parseInt(rs[0]),
            id2: parseInt(rs[1])
          })
        }
      })
    })

    await new Promise<void>((resolve, reject) => {
      f2.once('error', reject).once('end', () => {
        const rs = line.split('\t')
        if (rs.length === 2) {
          stmt.run({
            id1: parseInt(rs[0]),
            id2: parseInt(rs[1])
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
  CREATE TABLE tatoeba (
    id    INT NOT NULL PRIMARY KEY,
    cmn   TEXT NOT NULL UNIQUE,
    eng   TEXT NOT NULL
  );

  CREATE INDEX idx_cmn ON tatoeba ("cmn");
  `)

  db.transaction(() => {
    const stmt = db.prepare(/* sql */ `
    INSERT INTO tatoeba (id, cmn, eng)
    VALUES (@id, @cmn, @eng)
    ON CONFLICT DO NOTHING
    `)

    s3
      .prepare(
        /* sql */ `
    SELECT
      s1.id       id,
      s1.text     eng,
      json_group_object(
        s2.lang,
        s2.text
      ) translation
    FROM sentence s1
    JOIN link t       ON t.id1 = s1.id
    JOIN sentence s2  ON t.id2 = s2.id
    WHERE s1.lang = 'eng' AND s2.lang = 'cmn'
    GROUP BY s1.id
    `
      )
      .all()
      .map((p) => {
        const tr = JSON.parse(p.translation)

        stmt.run({
          id: p.id,
          cmn: tr.cmn,
          eng: p.eng
        })
      })
  })()

  db.close()
}


if (require.main === module) {
  populate()
}
