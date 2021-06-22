import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { db } from './shared'

const sentenceRouter: FastifyPluginAsync = async (f) => {
  const tags = ['sentence']

  const stmt = {
    sentenceQ(opts: {
      limit: number
      offset: number
    }) {
      return db.tatoeba.prepare(/*sql*/`
      SELECT cmn, eng
      FROM tatoeba
      WHERE cmn LIKE '%'||@q||'%'
      ORDER BY RANDOM()
      LIMIT ${opts.limit} OFFSET ${opts.offset}
      `)
    },
    sentenceQCount: db.tatoeba.prepare(/*sql*/`
    SELECT COUNT(*) AS [count]
    FROM tatoeba
    WHERE cmn LIKE '%'||@q||'%'
    `),
    vocabRandom: db.level.prepare(/* sql */ `
    SELECT [entry] result, vocab [level]
    FROM [level]
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
        cmn: S.string(),
        eng: S.string()
      })),
      count: S.integer()
    })

    f.post<{
      Body: typeof sBody.type
    }>('/q', {
      schema: {
        tags,
        summary: 'Query for a sentence given vocab',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req) => {
      const { q: q_, offset = 0, limit = 10 } = req.body
      const q = q_.replace(/[_%]/g, '[$&]').replace('...', '%')

      return {
        result: stmt.sentenceQ({
          offset, limit
        }).all({ q }),
        count: (stmt.sentenceQCount.get({ q }) || {}).count || 0,
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
        summary: 'Randomize a sentence for a given level',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { level: { min = 1, max = 60 } = {} } = req.body
      const s = stmt.vocabRandom.get({ min, max }) || {} as any

      if (!s) {
        throw { statusCode: 404 }
      }

      const r = stmt.sentenceQ({ limit: 1, offset: 0 }).get({ q: s.result.replace('...', '%') })

      if (!r) {
        throw { statusCode: 404 }
      }

      return {
        result: r.cmn,
        level: s.level
      }
    })
  }
}

export default sentenceRouter
