import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

if (require.main === module) {
  fs.readdirSync(path.join(__dirname, "generate")).map((f) => {
    if (/\.ts$/.test(f)) {
      spawnSync('./node_modules/.bin/ts-node', [f], {
        stdio: 'inherit',
        env: process.env
      })
    }
  })
}
