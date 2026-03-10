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

    // 1. Auth signup (creates auth.users)
    const { data: auth, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
    })

    if (authError) throw new Error(authError.message)

    // 2. Create Clinic
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

    if (clinicError) throw new Error(clinicError.message)

    // 3. Create User Profile
    const { error: userError } = await supabaseAdmin
        .from('users')
        .insert({
            id: auth.user!.id,
            clinic_id: clinic.id,
            name: data.userName,
            email: data.email,
            role: 'owner',
        })

    if (userError) throw new Error(userError.message)

    // 4. Seed default automations
    await supabaseAdmin.from('automations').insert([
        {
            clinic_id: clinic.id,
            name: 'Lembrete de consulta 24h antes',
            trigger_event: 'appointment_created',
            action_type: 'whatsapp',
            delay_minutes: -1440,
            config: { message: 'Olá {patient_name}! Lembrando da sua consulta amanhã às {time}.' },
        },
        {
            clinic_id: clinic.id,
            name: 'Pós-consulta: solicitar feedback',
            trigger_event: 'appointment_completed',
            action_type: 'whatsapp',
            delay_minutes: 120,
            config: { message: 'Olá {patient_name}! Como foi a consulta? Sua opinião importa!' },
        }
    ])

    redirect('/login?registered=true')
}
