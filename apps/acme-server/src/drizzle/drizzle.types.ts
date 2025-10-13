import { _relations, tables } from '@acme/db/tables'

export type DrizzleTables = typeof tables
type hi = DrizzleTables['userTable']['$inferSelect']
