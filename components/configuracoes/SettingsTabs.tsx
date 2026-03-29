'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import {
    Building2,
    Users,
    Key,
    Bell,
    Shield,
    MessageSquare,
    Globe,
    Save
} from 'lucide-react'
import { toast } from 'sonner'

export function SettingsTabs({ initialClinic }: { initialClinic: any }) {
    return (
        <Tabs defaultValue="clinic" className="w-full flex flex-col lg:flex-row gap-8">

            {/* Custom Vertical Tabs for Desktop */}
            <TabsList className="bg-bg-surface border border-bg-border p-2 flex flex-col h-fit w-full lg:w-64 rounded-sm gap-1">
                <TabsTrigger value="clinic" className="justify-start gap-3 w-full px-4 py-3 data-[state=active]:bg-brand-primary/10 data-[state=active]:text-brand-primary">
                    <Building2 size={16} />
                    Minha Clínica
                </TabsTrigger>
                <TabsTrigger value="team" className="justify-start gap-3 w-full px-4 py-3 data-[state=active]:bg-brand-primary/10 data-[state=active]:text-brand-primary">
                    <Users size={16} />
                    Equipe
                </TabsTrigger>
                <TabsTrigger value="api" className="justify-start gap-3 w-full px-4 py-3 data-[state=active]:bg-brand-primary/10 data-[state=active]:text-brand-primary">
                    <Key size={16} />
                    API & Integrações
                </TabsTrigger>
                <TabsTrigger value="security" className="justify-start gap-3 w-full px-4 py-3 data-[state=active]:bg-brand-primary/10 data-[state=active]:text-brand-primary">
                    <Shield size={16} />
                    Segurança
                </TabsTrigger>
            </TabsList>

            {/* Content Area */}
            <div className="flex-1 space-y-6">

                {/* Clinic Profile Tab */}
                <TabsContent value="clinic" className="mt-0">
                    <div className="card p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-display text-text-primary mb-1">Perfil da Clínica</h3>
                            <p className="text-xs text-text-secondary">Informações básicas que aparecem nas mensagens aos pacientes.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome da Clínica</label>
                                <Input defaultValue={initialClinic?.name} placeholder="Ex: Clínica Dr. Silva" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Telefone de Contato</label>
                                <Input defaultValue={initialClinic?.phone} placeholder="(11) 99999-9999" />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Endereço</label>
                                <Input defaultValue={initialClinic?.address} placeholder="Rua das Flores, 123 - São Paulo/SP" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-bg-border flex justify-end">
                            <Button className="gap-2 px-8" onClick={() => toast.success('Configurações salvas!')}>
                                <Save size={16} />
                                Salvar Alterações
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* API Tab */}
                <TabsContent value="api" className="mt-0">
                    <div className="card p-8 space-y-8">
                        <div>
                            <h3 className="text-lg font-display text-text-primary mb-1">Chaves e Integrações</h3>
                            <p className="text-xs text-text-secondary">Configure os motores de inteligência e comunicação.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 rounded-sm bg-bg-app border border-bg-border flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <MessageSquare className="text-brand-success" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">WhatsApp API (Business)</p>
                                        <p className="text-[10px] text-text-muted">Conectado via Meta Cloud API</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold text-brand-primary uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                    Configurar Token
                                </button>
                            </div>

                            <div className="p-4 rounded-sm bg-bg-app border border-bg-border flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Globe className="text-blue-400" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-text-primary">OpenAI (GPT-4o)</p>
                                        <p className="text-[10px] text-text-muted">Motor de Insights Ativado</p>
                                    </div>
                                </div>
                                <button className="text-[10px] font-bold text-brand-primary uppercase hover:underline opacity-0 group-hover:opacity-100 transition-opacity">
                                    Ver Quota
                                </button>
                            </div>
                        </div>

                        <div className="p-4 rounded-sm bg-brand-primary/5 border border-brand-primary/20 flex gap-4">
                            <Bell className="text-brand-primary shrink-0" size={20} />
                            <p className="text-xs text-text-secondary leading-relaxed">
                                <strong>Dica de Segurança:</strong> Nunca compartilhe seus tokens de API com terceiros. Suas chaves são criptografadas antes de serem salvas no banco.
                            </p>
                        </div>
                    </div>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="mt-0">
                    <div className="card p-8">
                        <h3 className="text-lg font-display text-text-primary mb-4">Registro de Atividades</h3>
                        <div className="space-y-4">
                            {[
                                { user: 'Dr. Ricardo', action: 'Logon realizado do endereço IP 192.168.1.1', time: 'Há 10 minutos' },
                                { user: 'Sistema', action: 'Bakcup diário concluído com sucesso', time: 'Há 4 horas' },
                            ].map((log, i) => (
                                <div key={i} className="flex items-start justify-between py-2 border-b border-bg-border last:border-0">
                                    <div>
                                        <p className="text-xs font-semibold text-text-primary">{log.user}</p>
                                        <p className="text-[10px] text-text-secondary mt-1">{log.action}</p>
                                    </div>
                                    <span className="text-[10px] text-text-muted whitespace-nowrap">{log.time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </TabsContent>

            </div>
        </Tabs>
    )
}
