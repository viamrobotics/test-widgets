/** Two errors with the same name and message read as one error. */
export const errorKey = (error: Error) => `${error.name}\0${error.message}`
