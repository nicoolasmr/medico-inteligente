'use server'

import { createAdminClient } from '../../../lib/supabase/admin'
import { slugify } from '../../../lib/utils'

type RegisterClinicInput = {
    userName: string
    clinicName: string
    email: string
    password: string
}

type RegisterClinicResult =
    | { success: true; redirectTo: string }
    | { success: false; error: string }

async function generateClinicSlug(clinicName: string) {
    const supabaseAdmin = createAdminClient()
    const baseSlug = slugify(clinicName)

    for (let attempt = 0; attempt < 10; attempt += 1) {
        const candidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`
        const { count, error } = await supabaseAdmin
            .from('clinics')
            .select('id', { count: 'exact', head: true })
            .eq('slug', candidate)

        if (error) throw new Error(`Falha ao validar slug da clínica: ${error.message}`)
        if (!count) return candidate
    }

    throw new Error('Não foi possível gerar um identificador único para a clínica.')
}

export async function registerClinic(data: RegisterClinicInput): Promise<RegisterClinicResult> {
    const supabaseAdmin = createAdminClient()
    let createdUserId: string | null = null
    let createdClinicId: string | null = null

    try {
        const slug = await generateClinicSlug(data.clinicName)

        const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
            user_metadata: {
                name: data.userName,
                role: 'owner',
            },
        })

        if (authError || !auth.user) {
            throw new Error(authError?.message ?? 'Falha ao criar usuário no Auth')
        }
        createdUserId = auth.user.id

        const { data: clinic, error: clinicError } = await supabaseAdmin
            .from('clinics')
            .insert({
                name: data.clinicName,
                slug,
                plan: 'free',
            })
            .select()
            .single()

        if (clinicError || !clinic) throw new Error(clinicError?.message ?? 'Falha ao criar clínica')
        createdClinicId = clinic.id

        const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(createdUserId, {
            user_metadata: {
                name: data.userName,
                clinic_id: createdClinicId,
                role: 'owner',
            },
        })

        if (metadataError) throw new Error(metadataError.message)

        const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
                id: createdUserId,
                clinic_id: createdClinicId,
                name: data.userName,
                email: data.email,
                role: 'owner',
            })

        if (userError) throw new Error(userError.message)

        const { error: automationError } = await supabaseAdmin.from('automations').insert([
            {
                clinic_id: createdClinicId,
                name: 'Lembrete de consulta 24h antes',
                trigger_event: 'appointment_created',
                action_type: 'whatsapp',
                delay_minutes: -1440,
                config: { message: 'Olá {patient_name}! Lembrando da sua consulta amanhã às {time}.' },
            },
            {
                clinic_id: createdClinicId,
                name: 'Pós-consulta: solicitar feedback',
                trigger_event: 'appointment_completed',
                action_type: 'whatsapp',
                delay_minutes: 120,
                config: { message: 'Olá {patient_name}! Como foi a consulta? Sua opinião importa!' },
            }
        ])

        if (automationError) throw new Error(automationError.message)

        return { success: true, redirectTo: '/login?registered=true' }
    } catch (error) {
        if (createdClinicId) {
            await supabaseAdmin.from('automations').delete().eq('clinic_id', createdClinicId)
            await supabaseAdmin.from('users').delete().eq('clinic_id', createdClinicId)
            await supabaseAdmin.from('clinics').delete().eq('id', createdClinicId)
        }

        if (createdUserId) {
            await supabaseAdmin.auth.admin.deleteUser(createdUserId)
        }

        const message = error instanceof Error ? error.message : 'Não foi possível criar sua conta agora.'
        return { success: false, error: message }
    }
}
