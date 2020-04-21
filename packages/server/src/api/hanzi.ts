import { FastifyInstance } from 'fastify'
import sqlite3 from 'better-sqlite3'

export default (f: FastifyInstance, _: any, next: () => void) => {
  const zh = sqlite3('assets/zh.db', { readonly: true })
  const stmt = {
    hanziMatch: zh.prepare(/*sql*/`
    SELECT sub, sup, [var] FROM token 
    WHERE
      [entry] = ?
    ORDER BY frequency DESC
    `)
  }

  f.post('/match', {
    schema: {
      tags: ['hanzi'],
      summary: 'Get data for a given Hanzi',
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
              type: 'object',
              properties: {
                sup: { type: 'string' },
                sub: { type: 'string' },
                var: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (req) => {
    const { entry } = req.body

    return {
      result: stmt.hanziMatch.get(entry)
    }
  })

  next()
}
