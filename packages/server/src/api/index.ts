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
        title: 'Swagger API',
        version: '0.1.0'
      },
      servers: [
        {
          url: 'https://zhres.herokuapp.com',
          description: 'Online server'
        },
        {
          url: `http://localhost:${PORT}`,
          description: 'Local server'
        }
      ]
    },
    exposeRoute: true
  })

  f.register(cors)

  f.register(libRouter, { prefix: '/lib' })
  f.register(sentenceRouter, { prefix: '/sentence' })
  f.register(vocabRouter, { prefix: '/vocab' })
  f.register(hanziRouter, { prefix: '/hanzi' })
}

export default apiRouter
