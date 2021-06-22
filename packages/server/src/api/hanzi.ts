import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'

import { db } from './shared'

const hanziRouter: FastifyPluginAsync = async (f) => {
  const tags = ['hanzi']

  const stmt = {
    radical: db.radical.prepare(/*sql*/`
    SELECT sub, sup, [var] FROM radical 
    WHERE [entry] = @entry
    `),
    match: db.junda.prepare(/*sql*/`
    SELECT [character] [entry], pinyin reading, english FROM hanzi 
    WHERE [entry] = @entry
    `),
    random: db.level.prepare(/*sql*/`
    SELECT [entry] result, hanzi [level] FROM [level] 
    WHERE hanzi >= @min AND hanzi <= @max
    ORDER BY RANDOM()
    LIMIT 1
    `)
  }

  {
    const sBody = S.shape({
      entry: S.string()
    }).examples({
      entry: '你'
    })

    const sResponse = S.shape({
      sub: S.list(S.string()),
      sup: S.list(S.string()),
      var: S.list(S.string())
    }).examples({
      "sub": [
        "尔",
        "亻"
      ],
      "sup": [
        "您"
      ],
      "var": [
        "您",
        "祢",
        "伱",
        "妳",
        "袮"
      ]
    })

    f.post<{
      Body: typeof sBody.type
    }>('/radical', {
      schema: {
        tags,
        summary: 'Get data for a given Hanzi',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { entry } = req.body
      const r = stmt.radical.get({ entry })

      if (!r) {
        throw { statusCode: 404 }
      }

      return {
        sub: JSON.parse(r.sub),
        sup: JSON.parse(r.sup),
        var: JSON.parse(r.var)
      }
    })
  }

  {
    const sBody = S.shape({
      entry: S.string()
    }).examples({
      entry: '你'
    })

    const sResponse = S.shape({
      result: S.list(S.shape({
        entry: S.string(),
        reading: S.list(S.string()),
        english: S.list(S.string())
      }))
    }).examples({
      "result": [
        {
          "entry": "你",
          "reading": [
            "ni3"
          ],
          "english": [
            "you"
          ]
        }
      ]
    })

    f.post<{
      Body: typeof sBody.type
    }>('/match', {
      schema: {
        tags,
        summary: 'Get translation for a given hanzi',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { entry } = req.body

      const rs = stmt.match.all({ entry })

      return {
        result: rs.map(({ entry, reading, english }) => ({
          entry,
          reading: reading ? reading.split('/') : [],
          english: english ? english.split('/') : []
        }))
      }
    })
  }

  {
    const sLevel = S.integer().minimum(1).maximum(60)

    const sBody = S.shape({
      level: S.shape({
        min: sLevel.optional().examples(1),
        max: sLevel.optional().examples(60)
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
    }).examples({
      "result": "何",
      "level": 10
    })

    f.post<{
      Body: typeof sBody.type
    }>('/random', {
      schema: {
        tags,
        summary: 'Randomize a Hanzi for a given level',
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
}

export default hanziRouter
