import jieba from 'nodejieba'
import Sqlite3 from 'better-sqlite3'

function main () {
  const sql = new Sqlite3('assets/zh.db')

  const fMap = new Map<string, number>()

  sql.prepare(/*sql*/`
  SELECT [entry], frequency
  FROM token`).all().map((el) => {
    fMap.set(el.entry, el.frequency)
  })

  sql.prepare(/*sql*/`
  SELECT id, chinese
  FROM sentence`).all().map((el) => {
    const frequency = Math.min(
      Infinity,
      ...jieba.cut(el.chinese).map((seg) => fMap.get(seg)).filter((el) => el) as number[]
    )

    sql.prepare(/*sql*/`
    UPDATE sentence
    SET frequency = ?
    WHERE id = ?`).run(frequency === Infinity ? null : frequency, el.id)
  })

  sql.close()
}

main()
