import fastify from 'fastify'

import apiRouter from './api'

const app = fastify({
  logger: true
})
const port = parseInt(process.env.PORT || '8080')

app.register(apiRouter, { prefix: '/api' })

app.addHook('preHandler', async (req, reply) => {
  const isHttps = ((req.headers['x-forwarded-proto'] || '').substring(0, 5) === 'https')
  if (isHttps) {
    return
  }

  const host = req.headers.host || req.hostname

  if (['localhost', '127.0.0.1'].includes(host.split(':')[0])) {
    return
  }

  const { method, url } = req.req

  if (method && ['GET', 'HEAD'].includes(method)) {
    reply.redirect(301, `https://${host}${url}`)
  }
})

app.listen(
  port,
  process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
  (err) => {
    if (err) {
      throw err
    }

    console.log(`Go to http://localhost:${port}`)
  }
)
