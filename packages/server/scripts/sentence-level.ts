import fs from 'fs'

import Sqlite3 from 'better-sqlite3'
import yaml from 'js-yaml'
import jieba from 'nodejieba'

function main () {
  const sql = new Sqlite3('assets/zh.db')
  const hsk = yaml.safeLoad(fs.readFileSync('assets/hsk.yaml', 'utf8')) as Record<string, string[]>

  const lvMap = new Map<string, number>()
  Object.entries(hsk).map(([lv, vs]) => {
    const lvNum = parseInt(lv)

    vs.map(v => {
      lvMap.set(v, lvNum)
    })
  })

  const tradMap = new Map<string, string>()

  sql.prepare(/*sql*/`
  SELECT simplified, traditional
  FROM vocab
  WHERE traditional IS NOT NULL`).all().map((el) => {
    tradMap.set(el.traditional, el.simplified)
  })

  sql.prepare(/*sql*/`
  SELECT id, chinese
  FROM sentence`).all().map((el) => {
    const level = Math.max(
      0,
      ...jieba.cut(el.chinese).map((seg) => {
        return lvMap.get(seg) || lvMap.get(tradMap.get(seg) || '')
      }).filter((el) => el) as number[]
    )

    sql.prepare(/*sql*/`
    UPDATE sentence
    SET [level] = ?
    WHERE id = ?`).run(level || null, el.id)
  })

  sql.close()
}

main()
