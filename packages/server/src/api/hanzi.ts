import fs from 'fs'

import sqlite3 from 'better-sqlite3'
import { FastifyPluginAsync } from 'fastify'
import yaml from 'js-yaml'
import S from 'jsonschema-definer'

const hanziRouter: FastifyPluginAsync = async (f) => {
  const tags = ['hanzi']

  const zh = sqlite3('assets/zh.db', { readonly: true })
  const stmt = {
    hanziMatch: zh.prepare(/*sql*/`
    SELECT sub, sup, [var] FROM token 
    WHERE
      [entry] = ?
    ORDER BY frequency DESC
    `)
  }
  const hsk = yaml.load(fs.readFileSync('assets/hsk.yaml', 'utf8')) as Record<string, string[]>

  {
    const sBody = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      sub: S.list(S.string()),
      sup: S.list(S.string()),
      var: S.list(S.string())
    })

    f.post<{
      Body: typeof sBody.type
    }>('/match', {
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
      const r = stmt.hanziMatch.get(entry) || {}
      const regex = /\p{sc=Han}/gu

      return {
        sub: (r.sub as string || '').match(regex) || [],
        sup: (r.sup as string || '').match(regex) || [],
        var: (r.var as string || '').match(regex) || []
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
        summary: 'Randomize a Hanzi for a given level',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { level: { min: levelMin, max: level } = {} } = req.body

      const hsMap = new Map<string, number>()

      Object.entries(hsk)
        .map(([lv, vs]) => ({ lv: parseInt(lv), vs }))
        .filter(({ lv }) => level ? lv <= level : true)
        .filter(({ lv }) => levelMin ? lv >= levelMin : true)
        .map(({ lv, vs }) => {
          vs.map(v => {
            v.split('').map(h => {
              const hLevel = hsMap.get(h)
              if (!hLevel || hLevel > lv) {
                hsMap.set(h, lv)
              }
            })
          })
        })

      const hs = Array.from(hsMap)
      const [h, lv] = hs[Math.floor(Math.random() * hs.length)] || []

      return {
        result: h,
        level: lv
      }
    })
  }
}

export default hanziRouter
