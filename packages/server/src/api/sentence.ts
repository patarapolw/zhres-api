import sqlite3 from 'better-sqlite3'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

const sentenceRouter: FastifyPluginAsync = async (f) => {
  const tags = ['sentence']

  const zh = sqlite3('assets/zh.db', { readonly: true })
  const stmt = {
    sentenceQ(opts: {
      limit: number
      offset: number
    }) {
      return zh.prepare(/*sql*/`
      SELECT chinese, pinyin, english
      FROM sentence
      WHERE chinese LIKE ?
      ORDER BY frequency DESC
      LIMIT ${opts.limit} OFFSET ${opts.offset}
      `)
    },
    sentenceQCount: zh.prepare(/*sql*/`
    SELECT COUNT(*) AS [count]
    FROM sentence
    WHERE chinese LIKE ?
    `),
    sentenceLevel: zh.prepare(/*sql*/`
    SELECT chinese, [level]
    FROM sentence
    WHERE [level] <= ? AND [level] >= ?
    ORDER BY RANDOM()`)
  }

  {
    const sBody = S.shape({
      entry: S.string(),
      offset: S.integer().minimum(0).optional(),
      limit: S.integer().minimum(1).optional()
    })

    const sResponse = S.shape({
      result: S.list(S.shape({
        chinese: S.string(),
        pinyin: S.string().optional(),
        english: S.string()
      })),
      count: S.integer()
    })

    f.post<{
      Body: typeof sBody.type
    }>('/q', {
      schema: {
        tags,
        summary: 'Query for a given sentence',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req) => {
      const { entry, offset = 0, limit = 10 } = req.body

      return {
        result: stmt.sentenceQ({
          offset, limit
        }).all(`%${entry}%`),
        count: (stmt.sentenceQCount.get(`%${entry}%`) || {}).count || 0,
      }
    })
  }

  {
    const sLevel = S.integer().minimum(1).maximum(60)

    const sBody = S.shape({
      level: S.shape({
        min: sLevel.optional(),
        max: sLevel.optional()
      }).optional()
    })

    const sResponse = S.shape({
      result: S.string(),
      level: sLevel
    })

    f.post<{
      Body: typeof sBody.type
    }>('/random', {
      schema: {
        tags,
        summary: 'Randomize a sentence for a given level',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { level: { min: levelMin, max: level } = {} } = req.body
      const s = stmt.sentenceLevel.get(level || 60, levelMin || 1) || {} as any

      return {
        result: s.chinese,
        level: s.level
      }
    })
  }
}

export default sentenceRouter
