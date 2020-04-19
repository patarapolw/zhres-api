import { FastifyInstance } from 'fastify'
import sqlite3 from 'better-sqlite3'

export default (f: FastifyInstance, _: any, next: () => void) => {
  const zh = sqlite3('assets/zh.db', { readonly: true })
  const stmt = {
    vocabMatch: zh.prepare(/*sql*/`
    SELECT simplified, traditional, pinyin, english FROM vocab 
    WHERE
      simplified = ? OR
      traditional = ?
    ORDER BY rating DESC
    `),
    vocabQ (opts: {
      limit: number
      offset: number
    }) {
      return zh.prepare(/*sql*/`
      SELECT simplified, traditional, pinyin, english
      FROM vocab v
      LEFT JOIN token t ON t.entry = v.simplified
      WHERE
        simplified LIKE ? OR
        traditional LIKE ?
      ORDER BY frequency DESC, rating DESC
      LIMIT ${opts.limit} OFFSET ${opts.offset}
      `)
    },
    vocabQCount: zh.prepare(/*sql*/`
    SELECT COUNT(*) AS [count]
    FROM vocab v
    LEFT JOIN token t ON t.entry = v.simplified
    WHERE
      simplified LIKE ? OR
      traditional LIKE ?
    `)
  }

  f.post('/q', {
    schema: {
      tags: ['vocab'],
      summary: 'Query for a given vocab',
      body: {
        type: 'object',
        required: ['entry'],
        properties: {
          entry: { type: 'string' },
          offset: { type: 'integer' },
          limit: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: {
              type: 'array',
              items: {
                type: 'object',
                required: ['simplified', 'pinyin', 'english'],
                properties: {
                  simplified: { type: 'string' },
                  traditional: { type: 'string' },
                  pinyin: { type: 'string' },
                  english: { type: 'string' }
                }
              }
            },
            count: { type: 'integer' },
            offset: { type: 'integer' },
            limit: { type: 'integer' }
          }
        }
      }
    }
  }, async (req) => {
    const { entry, offset = 0, limit = 10 } = req.body

    return {
      result: stmt.vocabQ({
        offset, limit
      }).all(`%${entry}%`, `%${entry}%`),
      count: (stmt.vocabQCount.get(`%${entry}%`, `%${entry}%`) || {}).count || 0,
      offset,
      limit
    }
  })

  f.post('/match', {
    schema: {
      tags: ['vocab'],
      summary: 'Get translation for a given vocab',
      body: {
        type: 'object',
        required: ['entry'],
        properties: {
          entry: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            result: {
              type: 'array',
              items: {
                type: 'object',
                required: ['simplified', 'pinyin', 'english'],
                properties: {
                  simplified: { type: 'string' },
                  traditional: { type: 'string' },
                  pinyin: { type: 'string' },
                  english: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body

    return {
      result: stmt.vocabMatch.all(entry, entry)
    }
  })

  next()
}
