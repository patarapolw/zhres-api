import { FastifyPluginAsync } from 'fastify'
import cors from 'fastify-cors'
import swagger from 'fastify-swagger'

import { PORT } from '../shared'
import hanziRouter from './hanzi'
import libRouter from './lib'
import sentenceRouter from './sentence'
import vocabRouter from './vocab'

const apiRouter: FastifyPluginAsync = async (f) => {
  f.register(swagger, {
    routePrefix: '/doc',
    openapi: {
      info: {
        title: 'ZhRes API',
        version: '0.2.0'
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Local server'
        },
        {
          url: 'https://zhres.herokuapp.com',
          description: 'Online server'
        }
      ]
    },
    exposeRoute: true,
    hideUntagged: true
  })

  f.register(cors)

  f.register(libRouter, { prefix: '/lib' })
  f.register(hanziRouter, { prefix: '/hanzi' })
  f.register(vocabRouter, { prefix: '/vocab' })
  f.register(sentenceRouter, { prefix: '/sentence' })
}

export default apiRouter
