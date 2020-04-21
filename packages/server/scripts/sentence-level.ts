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

  sql.prepare(/*sql*/`
  SELECT id, chinese
  FROM sentence`).all().map((el) => {
    const level = Math.max(
      0,
      ...jieba.cut(el.chinese).map((seg) => lvMap.get(seg)).filter((el) => el) as number[]
    )

    sql.prepare(/*sql*/`
    UPDATE sentence
    SET [level] = ?
    WHERE id = ?`).run(level || null, el.id)
  })

  sql.close()
}

main()
