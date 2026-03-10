const GRAPH_API = 'https://graph.facebook.com/v19.0'
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const TOKEN = process.env.WHATSAPP_TOKEN!

export type WhatsAppMessage = {
    to: string // E.164 format: +5511999990000
    message: string
}

/**
 * Send a text message via WhatsApp Cloud API (Meta Graph API v19)
 */
export async function sendWhatsApp({ to, message }: WhatsAppMessage): Promise<void> {
    const res = await fetch(`${GRAPH_API}/${PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to,
            type: 'text',
            text: { preview_url: false, body: message },
        }),
    })

    if (!res.ok) {
        const error = await res.json()
        throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
    }
}

/**
 * Verify webhook subscription from Meta
 * Used in GET /api/webhooks/whatsapp
 */
export function verifyWebhook(params: URLSearchParams): string | null {
    const mode = params.get('hub.mode')
    const token = params.get('hub.verify_token')
    const challenge = params.get('hub.challenge')
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return challenge
    }
    return null
}

/**
 * Parse an incoming WhatsApp webhook message body
 */
export function parseIncomingMessage(body: unknown) {
    const entry = (body as any)?.entry?.[0]
    const changes = entry?.changes?.[0]?.value
    const message = changes?.messages?.[0]
    if (!message) return null
    return {
        from: message.from as string,
        text: message.text?.body as string,
        msgId: message.id as string,
        contact: changes.contacts?.[0]?.profile?.name as string | undefined,
    }
}
