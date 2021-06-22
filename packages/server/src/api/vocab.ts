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
      q: '你'
    })

    const sResponse = S.shape({
      result: S.list(S.shape({
        simplified: S.string(),
        traditional: S.list(S.string()),
        reading: S.list(S.string()),
        english: S.list(S.string())
      })),
      count: S.integer()
    }).examples({
      "result": [
        {
          "simplified": "你",
          "traditional": [],
          "reading": [
            "ni3"
          ],
          "english": [
            "you (informal, as opposed to courteous 您[nin2])"
          ]
        },
        {
          "simplified": "你们",
          "traditional": [
            "你們"
          ],
          "reading": [
            "ni3 men5"
          ],
          "english": [
            "you (plural)"
          ]
        },
        {
          "simplified": "你我",
          "traditional": [],
          "reading": [
            "ni3 wo3"
          ],
          "english": [
            "you and I",
            "everyone",
            "all of us (in society)",
            "we (people in general)"
          ]
        },
        {
          "simplified": "你等",
          "traditional": [],
          "reading": [
            "ni3 deng3"
          ],
          "english": [
            "you all (archaic)",
            "see also 你們|你们[ni3 men5]"
          ]
        },
        {
          "simplified": "你好",
          "traditional": [],
          "reading": [
            "ni3 hao3"
          ],
          "english": [
            "hello",
            "hi"
          ]
        },
        {
          "simplified": "走你",
          "traditional": [],
          "reading": [
            "zou3 ni3"
          ],
          "english": [
            "(neologism c. 2012) (interjection of encouragement) Let’s do this!",
            "Come on, you can do this!"
          ]
        },
        {
          "simplified": "迷你",
          "traditional": [],
          "reading": [
            "mi2 ni3"
          ],
          "english": [
            "mini (as in mini-skirt or Mini Cooper) (loanword)"
          ]
        },
        {
          "simplified": "去你的",
          "traditional": [],
          "reading": [
            "qu4 ni3 de5"
          ],
          "english": [
            "Get along with you!"
          ]
        },
        {
          "simplified": "你妈",
          "traditional": [
            "你媽"
          ],
          "reading": [
            "ni3 ma1"
          ],
          "english": [
            "(interjection) fuck you",
            "(intensifier) fucking"
          ]
        },
        {
          "simplified": "有人想你",
          "traditional": [],
          "reading": [
            "you3 ren2 xiang3 ni3"
          ],
          "english": [
            "Bless you! (after a sneeze)"
          ]
        }
      ],
      "count": 31
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
        }).all({ q }).map((r) => {
          const entry = JSON.parse(r.entry)
          const reading = JSON.parse(r.reading)
          const english = JSON.parse(r.english)

          return {
            simplified: entry[0],
            traditional: entry.slice(1),
            reading,
            english
          }
        }),
        count: (stmt.vocabQCount.get({ q }) || {}).count || 0,
      }
    })
  }

  {
    const sBody = S.shape({
      entry: S.string()
    }).examples({
      entry: '计划'
    })

    const sResponse = S.shape({
      result: S.list(S.shape({
        simplified: S.string(),
        traditional: S.list(S.string()),
        reading: S.list(S.string()),
        english: S.list(S.string())
      })),
    }).examples({
      "result": [
        {
          "simplified": "计划",
          "traditional": [
            "計劃"
          ],
          "reading": [
            "ji4 hua4"
          ],
          "english": [
            "plan",
            "project",
            "program",
            "to plan",
            "to map out",
            "CL:個|个[ge4],項|项[xiang4]"
          ]
        }
      ]
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
        result: stmt.vocabMatch.all({ entry }).map((r) => {
          const entry = JSON.parse(r.entry)
          const reading = JSON.parse(r.reading)
          const english = JSON.parse(r.english)

          return {
            simplified: entry[0],
            traditional: entry.slice(1),
            reading,
            english
          }
        })
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
    }).examples({
      "result": "学校",
      "level": 3
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
