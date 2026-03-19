import { getClinicProfile } from './actions'
import { SettingsTabs } from '../../../components/configuracoes/SettingsTabs'

export default async function SettingsPage() {
    const clinic = await getClinicProfile()

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-display text-text-primary tracking-tight">Configurações</h1>
                <p className="text-text-secondary text-sm">Gerencie o perfil da sua clínica e preferências do sistema.</p>
            </div>

            <SettingsTabs initialClinic={clinic} />
        </div>
    )
}
