import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import { addDays, subDays, startOfToday } from 'date-fns'

const prisma = new PrismaClient()

// Clinic and Master Admin IDs (Fixed for demo purposes)
const CLINIC_ID = '00000000-0000-0000-0000-000000000001'
const ADMIN_ID = '11111111-1111-1111-1111-111111111111'

async function main() {
    console.log('🌱 Starting database seed...')

    // 1. Create Clinic
    const clinic = await prisma.clinic.upsert({
        where: { id: CLINIC_ID },
        update: {},
        create: {
            id: CLINIC_ID,
            name: 'Clínica Médica Inteligente',
            slug: 'clinica-medica-inteligente',
            plan: 'pro',
            settings: {
                workingHours: { start: '08:00', end: '19:00' },
                calendarInterval: 30,
            },
        },
    })
    console.log('✅ Clinic created')

    // 2. Create Master User (Doctor/Owner)
    // Note: auth.users is managed by Supabase, prisma only maps the profile
    await prisma.user.upsert({
        where: { id: ADMIN_ID },
        update: {},
        create: {
            id: ADMIN_ID,
            clinicId: CLINIC_ID,
            name: 'Dr. Nicolas Moreira',
            email: 'nicoolascf55@gmail.com', // Aligning with developer email for test access
            role: 'owner',
            specialty: 'Cardiologia',
            crm: '123456-SP',
        },
    })
    console.log('✅ Master user profile created')

    // 3. Create Demo Patients (20 patients)
    const today = startOfToday()
    const patientData = [
        { name: 'Maria Santos', phone: '(11) 98888-1111', origin: 'Indicação', gender: 'F' },
        { name: 'Carlos Oliveira', phone: '(11) 97777-2222', origin: 'Google', gender: 'M' },
        { name: 'Ana Rodrigues', phone: '(11) 96666-3333', origin: 'Instagram', gender: 'F' },
        { name: 'Pedro Costa', phone: '(11) 95555-4444', origin: 'Indicação', gender: 'M' },
        { name: 'Fernanda Lima', phone: '(11) 94444-5555', origin: 'Site', gender: 'F' },
    ]

    const patients = []
    for (let i = 0; i < 20; i++) {
        const data = patientData[i % 5] || { name: `Paciente Demo ${i + 1}`, phone: `(11) 90000-00${i + 1}`, origin: 'Google', gender: 'M' }
        const p = await prisma.patient.create({
            data: {
                clinicId: CLINIC_ID,
                name: data.name === `Paciente Demo ${i + 1}` ? data.name : `${data.name} ${i > 4 ? String.fromCharCode(64 + i) : ''}`,
                phone: data.phone,
                origin: data.origin,
                gender: data.gender as any,
                lastVisitAt: i < 5 ? subDays(today, 7 * i) : null,
            }
        })
        patients.push(p)
    }
    console.log('✅ 20 patients created')

    // 4. Create Appointments
    for (let i = 0; i < 10; i++) {
        await prisma.appointment.create({
            data: {
                clinicId: CLINIC_ID,
                patientId: patients[i]!.id,
                doctorId: ADMIN_ID,
                scheduledAt: addDays(today, i - 2), // Some in past, some in future
                status: i < 3 ? 'completed' : (i < 5 ? 'confirmed' : 'scheduled'),
                type: 'Consulta de Rotina',
                durationMin: 30,
            }
        })
    }
    console.log('✅ 10 appointments created')

    // 5. Create Treatments (Kanban)
    const treatmentNames = ['Reabilitação Cardíaca', 'Check-up Preventivo', 'Acompanhamento Crônico', 'Cirurgia Vascular']
    for (let i = 0; i < 8; i++) {
        await prisma.treatment.create({
            data: {
                clinicId: CLINIC_ID,
                patientId: patients[i + 5]!.id,
                name: treatmentNames[i % 4]!,
                value: 1500 + (i * 500),
                stage: ['lead', 'consulta_realizada', 'tratamento_indicado', 'aprovado'][i % 4] as any,
                probability: 20 + (i * 10),
            }
        })
    }
    console.log('✅ 8 treatments created')

    // 6. Create Payments
    for (let i = 0; i < 5; i++) {
        await prisma.payment.create({
            data: {
                clinicId: CLINIC_ID,
                patientId: patients[i]!.id,
                amount: 350 + (i * 100),
                method: ['pix', 'credit', 'cash'][i % 3] as any,
                status: i < 3 ? 'paid' : 'pending',
                paidAt: i < 3 ? subDays(today, i) : null,
                dueDate: addDays(today, i),
            }
        })
    }
    console.log('✅ 5 payments created')

    // 7. Create Default Automations
    const defaultAutomations = [
        { name: 'Lembrete de consulta 24h antes', triggerEvent: 'appointment_created', actionType: 'whatsapp', delayMinutes: -1440, config: { message: 'Olá {patient_name}! Lembrando da sua consulta amanhã às {time}.' } },
        { name: 'Pós-consulta: solicitar feedback', triggerEvent: 'appointment_completed', actionType: 'whatsapp', delayMinutes: 120, config: { message: 'Olá {patient_name}! Como foi a consulta? Sua opinião importa!' } },
        { name: 'Paciente sem retorno (90d)', triggerEvent: 'patient_no_return_90', actionType: 'whatsapp', delayMinutes: 0, config: { message: 'Olá {patient_name}! Faz tempo que não nos vemos. Que tal agendar uma revisão?' } },
    ]

    for (const auto of defaultAutomations) {
        await prisma.automation.create({
            data: {
                clinicId: CLINIC_ID,
                ...auto,
                isActive: true,
            }
        })
    }
    console.log('✅ Default automations created')

    console.log('✨ Seed completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Seed error:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
