import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import { FastifyInstance } from 'fastify'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

export default (f: FastifyInstance, _: any, next: () => void) => {
  const tags = ['vocab']

  const zh = sqlite3('assets/zh.db', { readonly: true })
  const stmt = {
    vocabMatch: zh.prepare(/*sql*/`
    SELECT simplified, traditional, pinyin, english FROM vocab 
    WHERE
      simplified = ? OR
      traditional = ?
    ORDER BY rating DESC
    `),
    vocabQ(opts: {
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
  const hsk = yaml.load(fs.readFileSync('assets/hsk.yaml', 'utf8')) as Record<string, string[]>

  {
    const sBody = S.shape({
      entry: S.string(),
      offset: S.integer().minimum(0).optional(),
      limit: S.integer().minimum(1).optional()
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
      const { entry, offset = 0, limit = 10 } = req.body

      return {
        result: stmt.vocabQ({
          offset, limit
        }).all(`%${entry}%`, `%${entry}%`),
        count: (stmt.vocabQCount.get(`%${entry}%`, `%${entry}%`) || {}).count || 0
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
      const { entry } = req.body

      return {
        result: stmt.vocabMatch.all(entry, entry)
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
        summary: 'Randomize a vocab for a given level',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { level: { min: levelMin, max: level } = {} } = req.body

      const vs = Object.entries(hsk)
        .map(([lv, vs]) => ({ lv: parseInt(lv), vs }))
        .filter(({ lv }) => level ? lv <= level : true)
        .filter(({ lv }) => levelMin ? lv >= levelMin : true)
        .reduce((prev, { lv, vs }) => [...prev, ...vs.map(v => ({ v, lv }))], [] as {
          v: string
          lv: number
        }[])

      const v = vs[Math.floor(Math.random() * vs.length)] || {} as any

      return {
        result: v.v,
        level: v.lv
      }
    })
  }

  next()
}
