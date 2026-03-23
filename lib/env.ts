type EnvOptions = {
    allowEmpty?: boolean
    context?: string
}

export function requireEnv(name: string, options: EnvOptions = {}): string {
    const value = process.env[name]

    if (value === undefined || (!options.allowEmpty && value.trim() === '')) {
        const context = options.context ? ` (${options.context})` : ''
        throw new Error(`Missing required environment variable: ${name}${context}`)
    }

    return value
}

export function getOptionalEnv(name: string): string | undefined {
    const value = process.env[name]
    if (value === undefined) return undefined

    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
}
