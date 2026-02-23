import { UseCaseError } from "@/core/errors/use-case-errors";

export class WrongCredentialsError extends Error implements UseCaseError {
    constructor() {
        super("Wrong credentials provided.");
    }   
}