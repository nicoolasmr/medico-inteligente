'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { slugify } from '@/lib/utils'

export async function registerClinic(data: {
    userName: string
    clinicName: string
    email: string
    password: string
}) {
    const supabaseAdmin = createAdminClient()
    let createdUserId: string | null = null
    let createdClinicId: string | null = null

    try {
        const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: data.email,
            password: data.password,
            email_confirm: true,
        })

        if (authError || !auth.user) throw new Error(authError?.message ?? 'Falha ao criar usuário no Auth')
        createdUserId = auth.user.id

        const slug = slugify(data.clinicName)
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
    } catch (error) {
        if (createdClinicId) {
            await supabaseAdmin.from('automations').delete().eq('clinic_id', createdClinicId)
            await supabaseAdmin.from('users').delete().eq('clinic_id', createdClinicId)
            await supabaseAdmin.from('clinics').delete().eq('id', createdClinicId)
        }

        if (createdUserId) {
            await supabaseAdmin.auth.admin.deleteUser(createdUserId)
        }

        throw error
    }

    redirect('/login?registered=true')
}
