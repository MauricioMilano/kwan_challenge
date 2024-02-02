
export type ErrorMessage = {
    message: String
}

export function APIerror(message: string): ErrorMessage{
    return {
        message: message
    }
}