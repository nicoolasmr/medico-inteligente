'use server'

import { createAdminClient } from '../../../lib/supabase/admin'
import { slugify } from '../../../lib/utils'

const ONBOARDING_ERRORS = {
    EMAIL_IN_USE: 'Não foi possível concluir o cadastro: este e-mail já está em uso. Se precisar de ajuda, informe o código ONB-REG-EMAIL ao suporte.',
    CLINIC_SLUG_CONFLICT: 'Não foi possível concluir o cadastro: o identificador da clínica já existe. Revise o nome informado e, se o problema continuar, informe o código ONB-REG-SLUG ao suporte.',
    ENVIRONMENT: 'Não foi possível concluir o cadastro porque a configuração de autenticação está incompleta. Informe o código ONB-REG-ENV ao suporte.',
    DEFAULT: 'Não foi possível concluir o cadastro agora. Tente novamente em instantes. Se o erro persistir, informe o código ONB-REG-UNEXPECTED ao suporte.',
} as const

type RegisterClinicInput = {
    userName: string
    clinicName: string
    email: string
    password: string
}

type RegisterClinicResult =
    | { success: true; redirectTo: string }
    | { success: false; error: string }

function getDefaultAutomations(clinicId: string) {
    return [
        {
            clinic_id: clinicId,
            name: 'Lembrete de consulta 24h antes',
            trigger_event: 'appointment_created',
            action_type: 'whatsapp',
            delay_minutes: -1440,
            config: { message: 'Olá {patient_name}! Lembrando da sua consulta amanhã às {time}.' },
        },
        {
            clinic_id: clinicId,
            name: 'Pós-consulta: solicitar feedback',
            trigger_event: 'appointment_completed',
            action_type: 'whatsapp',
            delay_minutes: 120,
            config: { message: 'Olá {patient_name}! Como foi a consulta? Sua opinião importa!' },
        },
    ]
}

function normalizeRegistrationError(message: string) {
    if (message.includes('already been registered') || message.includes('User already registered')) {
        return ONBOARDING_ERRORS.EMAIL_IN_USE
    }

    if (message.includes('duplicate key') || message.includes('clinics_slug_key')) {
        return ONBOARDING_ERRORS.CLINIC_SLUG_CONFLICT
    }

    if (message.includes('Missing required environment variable')) {
        return ONBOARDING_ERRORS.ENVIRONMENT
    }

    return ONBOARDING_ERRORS.DEFAULT
}

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

async function rollbackRegistration(supabaseAdmin: ReturnType<typeof createAdminClient>, createdClinicId: string | null, createdUserId: string | null) {
    const rollbackSteps: Promise<unknown>[] = []

    if (createdClinicId) {
        rollbackSteps.push(supabaseAdmin.from('automations').delete().eq('clinic_id', createdClinicId))
        rollbackSteps.push(supabaseAdmin.from('users').delete().eq('clinic_id', createdClinicId))
        rollbackSteps.push(supabaseAdmin.from('clinics').delete().eq('id', createdClinicId))
    }

    if (createdUserId) {
        rollbackSteps.push(supabaseAdmin.auth.admin.deleteUser(createdUserId))
    }

    const rollbackResults = await Promise.allSettled(rollbackSteps)
    const failedRollback = rollbackResults.filter((result) => result.status === 'rejected')

    if (failedRollback.length > 0) {
        console.error('[onboarding] rollback incompleto após falha no cadastro', {
            createdClinicId,
            createdUserId,
            failedSteps: failedRollback.length,
        })
    }
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

        if (!createdClinicId) {
            throw new Error('Falha ao criar clínica')
        }

        const { error: automationError } = await supabaseAdmin
            .from('automations')
            .insert(getDefaultAutomations(createdClinicId))

        if (automationError) throw new Error(automationError.message)

        return { success: true, redirectTo: '/login?registered=true' }
    } catch (error) {
        await rollbackRegistration(supabaseAdmin, createdClinicId, createdUserId)

        // Observação de consistência: o banco já garante parte do cleanup com FKs e ON DELETE CASCADE.
        // Um próximo passo é mover também a criação/reparo do perfil `public.users` para trigger em `auth.users`,
        // reduzindo o risco de divergência entre metadata do Auth e perfil interno.
        const rawMessage = error instanceof Error ? error.message : ONBOARDING_ERRORS.DEFAULT
        return { success: false, error: normalizeRegistrationError(rawMessage) }
    }
}
