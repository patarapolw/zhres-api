import toPinyin from 'chinese-to-pinyin'
import { FastifyPluginAsync } from 'fastify'
import S from 'jsonschema-definer'
import jieba from 'nodejieba'

const libRouter: FastifyPluginAsync = async (f) => {
  const tags = ['lib']

  {
    const sBody = S.shape({
      entry: S.string()
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
      const { entry } = req.body

      return {
        result: jieba.cutForSearch(entry)
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
