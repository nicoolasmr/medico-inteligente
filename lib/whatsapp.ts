import { requireEnv } from './env'

const GRAPH_API = 'https://graph.facebook.com/v19.0'

export type WhatsAppMessage = {
    to: string // E.164 format: +5511999990000
    message: string
}

export type WhatsAppDeliveryResult = {
    messageId?: string
    contactWaId?: string
    raw: unknown
}

type IncomingWhatsAppMessage = {
    from: string
    text: string | undefined
    msgId: string
    contact?: string
}

/**
 * Send a text message via WhatsApp Cloud API (Meta Graph API v19)
 */
export async function sendWhatsApp({ to, message }: WhatsAppMessage): Promise<WhatsAppDeliveryResult> {
    const phoneId = requireEnv('WHATSAPP_PHONE_NUMBER_ID', { context: 'WhatsApp delivery' })
    const token = requireEnv('WHATSAPP_TOKEN', { context: 'WhatsApp delivery' })

    const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
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

    const body = await res.json()

    if (!res.ok) {
        throw new Error(`WhatsApp API error: ${JSON.stringify(body)}`)
    }

    const response = body as {
        contacts?: Array<{ wa_id?: string }>
        messages?: Array<{ id?: string }>
    }

    return {
        messageId: response.messages?.[0]?.id,
        contactWaId: response.contacts?.[0]?.wa_id,
        raw: body,
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
    const verifyToken = requireEnv('WHATSAPP_VERIFY_TOKEN', { context: 'WhatsApp webhook verification' })

    if (mode === 'subscribe' && token === verifyToken) {
        return challenge
    }

    return null
}

/**
 * Parse an incoming WhatsApp webhook message body
 */
export function parseIncomingMessage(body: unknown): IncomingWhatsAppMessage | null {
    const payload = body as {
        entry?: Array<{
            changes?: Array<{
                value?: {
                    messages?: Array<{
                        from?: string
                        id?: string
                        text?: { body?: string }
                    }>
                    contacts?: Array<{
                        profile?: { name?: string }
                    }>
                }
            }>
        }>
    }

    const changes = payload.entry?.[0]?.changes?.[0]?.value
    const message = changes?.messages?.[0]

    if (!message?.from || !message.id) return null

    return {
        from: message.from,
        text: message.text?.body,
        msgId: message.id,
        contact: changes?.contacts?.[0]?.profile?.name,
    }
}
