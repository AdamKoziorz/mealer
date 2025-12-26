import { Kysely } from "kysely"
import { Database } from "../models/database"
import { UserRepository } from "../repositories/users.repository"

export class UserService {
    constructor(private userRepository: UserRepository) {}

    async getUserByEmail(email: string) {
        const user = await this.userRepository.findByEmail(email)
        return user
    }

    async createUser(userData) {
        // Services apply business logic to
        // validate the userData prior to
        // using the repository, throwing
        // an error if there is bad input.
    }
}