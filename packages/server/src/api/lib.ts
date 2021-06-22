import toPinyin from 'chinese-to-pinyin'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import jieba from 'nodejieba'

const libRouter: FastifyPluginAsync = async (f) => {
  const tags = ['lib']

  {
    const sBody = S.shape({
      entry: S.string(),
      mode: S.string().enum('search').optional()
    })

    const sResponse = S.shape({
      result: S.list(S.string())
    })

    f.post<{
      Body: typeof sBody.type
    }>('/jieba', {
      schema: {
        tags,
        summary: 'Cut chinese text into segments',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { entry, mode } = req.body

      switch (mode) {
        case 'search':
          return {
            result: jieba.cutForSearch(entry).filter((s) => /\p{sc=Han}/u.test(s)).filter((a, i, r) => r.indexOf(a) === i)
          }
      }

      return {
        result: jieba.cut(entry)
      }
    })
  }

  {
    const sBody = S.shape({
      entry: S.string()
    })

    const sResponse = S.shape({
      result: S.string()
    })

    f.post<{
      Body: typeof sBody.type
    }>('/pinyin', {
      schema: {
        tags,
        summary: 'Generate pinyin from Chinese text',
        body: sBody.valueOf(),
        response: {
          200: sResponse.valueOf()
        }
      }
    }, async (req): Promise<typeof sResponse.type> => {
      const { entry } = req.body

      return {
        result: toPinyin(entry, { keepRest: true, toneToNumber: true })
      }
    })
  }
}

export default libRouter
