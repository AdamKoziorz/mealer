import { Kysely } from "kysely";
import { Database, NewUser, User } from '../models/database'

// Provides DB Queries specific to the 'users' table
export class UserRepository {
    constructor(private db: Kysely<Database>) {}

    async findByEmail(email: string): Promise<User | undefined> {
        return this.db
            .selectFrom('users')
            .selectAll()
            .where('email', '=', email)
            .executeTakeFirst()
    }

    async create(data: NewUser): Promise<User | undefined> {
        return this.db
            .insertInto('users')
            .values(data)
            .returningAll()
            .executeTakeFirstOrThrow()
    }
}