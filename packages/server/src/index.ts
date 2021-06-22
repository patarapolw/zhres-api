import fastify from 'fastify'

import apiRouter from './api'
import { PORT } from './shared'

const app = fastify({
  logger: true
})

app.register(apiRouter, { prefix: '/api' })

app.addHook('preHandler', async (req, reply) => {
  const isHttps = ((req.headers['x-forwarded-proto'] as string || '').substring(0, 5) === 'https')
  if (isHttps) {
    return
  }

  const host = req.headers.host || req.hostname

  if (['localhost', '127.0.0.1'].includes(host.split(':')[0])) {
    return
  }

  const { method, url } = req

  if (method && ['GET', 'HEAD'].includes(method)) {
    reply.redirect(301, `https://${host}${url}`)
  }
})

app.get('/', (_, reply) => {
  // reply.redirect('/api/doc')

  reply.header('Content-Type', 'text/html')
  reply.send(/* html */ `
<!doctype html> <!-- Important: must specify -->
<html>
  <head>
    <meta charset="utf-8"> <!-- Important: rapi-doc uses utf8 charecters -->
    <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
  </head>
  <body>
    <rapi-doc
      spec-url="/api/doc/json"
      theme="light"
      font-size="largest"
      default-schema-tab="example"
    />
  </body>
</html>
  `)
})

app.listen(
  PORT,
  process.env.NODE_ENV === 'development' ? 'localhost' : '0.0.0.0',
  (err) => {
    if (err) {
      throw err
    }
  }
)
