import { FastifyInstance } from 'fastify'
import S from 'jsonschema-definer'

import { db } from './shared'

export default (f: FastifyInstance, _: any, next: () => void) => {
  const tags = ['vocab']

  const stmt = {
    vocabMatch: db.cedict.prepare(/*sql*/`
    SELECT [entry], reading, english FROM cedict 
    WHERE [entry] LIKE '%"'||@entry||'"%'
    ORDER BY frequency DESC
    `),
    vocabQ(opts: {
      limit: number
      offset: number
    }) {
      return db.cedict.prepare(/*sql*/`
      SELECT [entry], reading, english FROM cedict 
      WHERE [entry] LIKE '%'||@q||'%'
      ORDER BY frequency DESC
      LIMIT ${opts.limit} OFFSET ${opts.offset}
      `)
    },
    vocabQCount: db.cedict.prepare(/*sql*/`
    SELECT COUNT(*) AS [count]
    FROM cedict 
    WHERE [entry] LIKE '%'||@q||'%'
    `),
    random: db.level.prepare(/*sql*/`
    SELECT [entry] result, vocab [level] FROM [level] 
    WHERE vocab >= @min AND vocab <= @max
    ORDER BY RANDOM()
    LIMIT 1
    `)
  }

  {
    const sBody = S.shape({
      q: S.string(),
      offset: S.integer().minimum(0).optional(),
      limit: S.integer().minimum(1).optional()
    }).examples({
      q: 'string'
    })

    const sResponse = S.shape({
      result: S.list(S.shape({
        simplified: S.string(),
        traditional: S.string().optional(),
        pinyin: S.string(),
        english: S.string()
      })),
      count: S.integer()
    })

    f.post<{
      Body: typeof sBody.type
    }>('/q', {
      schema: {
        tags,
        summary: 'Query for a given vocab',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { q: q_, offset = 0, limit = 10 } = req.body
      const q = q_.replace(/[_%]/g, '[$&]').replace('"', '')

      return {
        result: stmt.vocabQ({
          offset, limit
        }).all({ q }),
        count: (stmt.vocabQCount.get({ q }) || {}).count || 0,
      }
    })
  }

  {
    const sBody = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      result: S.list(S.shape({
        simplified: S.string(),
        traditional: S.string().optional(),
        pinyin: S.string(),
        english: S.string()
      }))
    })

    f.post<{
      Body: typeof sBody.type
    }>('/match', {
      schema: {
        tags,
        summary: 'Get translation for a given vocab',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { entry: q_ } = req.body
      const entry = q_.replace(/[_%]/g, '[$&]').replace('"', '')

      return {
        result: stmt.vocabMatch.all({ entry })
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
    }).examples({
      level: {
        min: 1,
        max: 10
      }
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
        summary: 'Randomize a vocab for a given level',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { level: { min = 1, max = 60 } = {} } = req.body
      const r = stmt.random.get({ min, max })

      if (!r) {
        throw { statusCode: 404 }
      }

      return r
    })
  }

  next()
}
