import sqlite3 from 'better-sqlite3'

export const db = {
  junda: sqlite3('./assets/junda.db', { readonly: true }),
  cedict: sqlite3('./generated/cedict.db', { readonly: true }),
  level: sqlite3('./generated/level.db', { readonly: true }),
  radical: sqlite3('./generated/radical.db', { readonly: true }),
  tatoeba: sqlite3('./generated/tatoeba.db', { readonly: true })
}
