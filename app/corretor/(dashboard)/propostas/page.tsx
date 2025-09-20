"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertCircle, Search, FileText, Calendar, User, Phone, Mail, Package, DollarSign } from "lucide-react"
import { buscarPropostasPorCorretor } from "@/services/propostas-service-unificado"
import { verificarAutenticacao } from "@/services/auth-corretores-simples"
import { Spinner } from "@/components/ui/spinner"
import { formatarMoeda } from "@/utils/formatters"
import { useRouter } from "next/navigation"

// Função para mapear status do banco para exibição
const mapearStatusProposta = (status: string) => {
  const statusMap = {
    'parcial': { label: 'Aguardando Validação', color: 'bg-blue-100 text-blue-800' },
    'aguardando_cliente': { label: 'Email Enviado', color: 'bg-purple-100 text-purple-800' },
    'aguardando_validacao': { label: 'Aguardando Validação', color: 'bg-blue-100 text-blue-800' },
    'pendente': { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
    'em_analise': { label: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
    'aprovada': { label: 'Aprovada', color: 'bg-green-100 text-green-800' },
    'aprovado': { label: 'Aprovada', color: 'bg-green-100 text-green-800' },
    'rejeitada': { label: 'Rejeitada', color: 'bg-red-100 text-red-800' },
    'rejeitado': { label: 'Rejeitada', color: 'bg-red-100 text-red-800' },
    'cadastrado': { label: 'Cadastrada', color: 'bg-green-100 text-green-800' },
    'cadastrada': { label: 'Cadastrada', color: 'bg-green-100 text-green-800' }
  }
  
  return statusMap[status?.toLowerCase()] || { label: status || 'Desconhecido', color: 'bg-gray-100 text-gray-800' }
}

// Função para verificar se status é considerado aprovado (inclui cadastrados)
const isStatusAprovado = (status: string): boolean => {
  const statusAprovados = ['aprovada', 'aprovado', 'cadastrado', 'cadastrada']
  return statusAprovados.includes(status?.toLowerCase())
}

export default function CorretorPropostasPage() {
  const [propostas, setPropostas] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("Todos")
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const router = useRouter()

  // Teste da função formatarMoeda
  useEffect(() => {
    // Teste removido - função está funcionando corretamente
  }, [])

  useEffect(() => {
    async function carregarDados() {
      try {
        setCarregando(true)
        setErro(null)

        // Verificar autenticação
        const { autenticado, corretor } = verificarAutenticacao()
        if (!autenticado || !corretor) {
          setErro("Usuário não autenticado. Por favor, faça login novamente.")
          return
        }

        // Carregar propostas usando o serviço unificado
        const propostasData = await buscarPropostasPorCorretor(corretor.id)
        setPropostas(propostasData)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setErro("Não foi possível carregar os dados. Por favor, tente novamente.")
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [])

  const propostasFiltradas = propostas.filter((proposta) => {
    const matchSearch =
      proposta.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.email_cliente?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proposta.telefone_cliente?.includes(searchTerm) ||
      proposta.produto?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchStatus = filtroStatus === "Todos" || proposta.status === filtroStatus
    return matchSearch && matchStatus
  })

  if (erro) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">Propostas</h1>
          <p className="text-gray-600 mt-1 font-medium">Gerencie suas propostas</p>
        </div>

        <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-50 rounded-lg flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <p className="text-red-600 font-semibold">{erro}</p>
              <Button onClick={() => window.location.reload()} className="bg-[#168979] hover:bg-[#13786a] btn-corporate">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">Propostas</h1>
            <p className="text-gray-600 mt-1 font-medium">Gerencie todas as suas propostas</p>
          </div>
          <Button
            onClick={() => router.push("/corretor/propostas/nova")}
            className="bg-[#168979] hover:bg-[#13786a] text-white btn-corporate shadow-corporate"
          >
            <FileText className="mr-2 h-4 w-4" />
            Nova Proposta
          </Button>
        </div>
      </div>

      <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm">
        <CardHeader className="pb-4 pt-6 bg-gray-50 rounded-t-lg">
          <CardTitle className="text-lg font-bold text-gray-900 font-sans">Lista de Propostas</CardTitle>
          <p className="text-gray-600 text-sm font-medium mt-1">Propostas enviadas pelos clientes</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por cliente, email, telefone ou produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 text-sm corporate-rounded"
              />
            </div>
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-full lg:w-[200px] h-10 text-sm corporate-rounded">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="aguardando_validacao">Aguardando Validação</SelectItem>
                <SelectItem value="pendente">Em Análise</SelectItem>
                <SelectItem value="aprovada">Aprovadas</SelectItem>
                <SelectItem value="rejeitada">Rejeitadas</SelectItem>
                <SelectItem value="cadastrado">Cadastradas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block table-responsive-mobile">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableHead className="font-bold text-xs text-gray-700 uppercase tracking-wide">Cliente</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 uppercase tracking-wide">Contato</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 uppercase tracking-wide">Produto</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 uppercase tracking-wide">Data</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 uppercase tracking-wide">Status</TableHead>
                  <TableHead className="font-bold text-xs text-gray-700 uppercase tracking-wide">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carregando ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="loading-corporate mb-4"></div>
                        <p className="loading-text-corporate">Carregando propostas...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : propostasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-600 font-semibold">
                          {searchTerm || filtroStatus !== "Todos"
                            ? "Nenhuma proposta encontrada"
                            : "Nenhuma proposta cadastrada"}
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                          {searchTerm || filtroStatus !== "Todos"
                            ? "Tente ajustar os filtros de busca"
                            : "As propostas aparecerão aqui quando forem criadas"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  propostasFiltradas.map((proposta) => (
                    <TableRow key={proposta.id} className="text-sm hover:bg-gray-50">
                      <TableCell className="font-semibold">
                        {proposta.nome_cliente}
                        {proposta.corretor_nome && (
                          <div className="text-xs text-gray-500 font-medium">Corretor: {proposta.corretor_nome}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <span className="text-xs text-gray-500 font-medium">Email:</span>
                          <span className="text-xs font-medium">{proposta.email_cliente || "-"}</span>
                          <span className="text-xs text-gray-500 font-medium">Telefone:</span>
                          <span className="text-xs font-medium">{proposta.telefone_cliente || "-"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{proposta.produto || proposta.produto_nome || "-"}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {proposta.created_at ? new Date(proposta.created_at).toLocaleDateString("pt-BR") : "-"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded corporate-rounded text-xs font-semibold ${mapearStatusProposta(proposta.status).color}`}
                        >
                          {mapearStatusProposta(proposta.status).label}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-[#168979]">{proposta.valor_total > 0 ? formatarMoeda(proposta.valor_total) : "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card List */}
          <div className="lg:hidden mobile-card-list">
            {carregando ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="loading-corporate mb-4"></div>
                  <p className="loading-text-corporate">Carregando propostas...</p>
                </div>
              </div>
            ) : propostasFiltradas.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold">
                    {searchTerm || filtroStatus !== "Todos"
                      ? "Nenhuma proposta encontrada"
                      : "Nenhuma proposta cadastrada"}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {searchTerm || filtroStatus !== "Todos"
                      ? "Tente ajustar os filtros de busca"
                      : "As propostas aparecerão aqui quando forem criadas"}
                  </p>
                </div>
              </div>
            ) : (
              propostasFiltradas.map((proposta) => (
                <div key={proposta.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 mb-4 hover:shadow-md transition-shadow duration-200">
                  {/* Header do Card */}
                  <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">{proposta.nome_cliente}</h3>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{proposta.created_at ? new Date(proposta.created_at).toLocaleDateString("pt-BR") : "-"}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${mapearStatusProposta(proposta.status).color}`}
                    >
                      {mapearStatusProposta(proposta.status).label}
                    </span>
                  </div>
                  
                  {/* Informações de Contato */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Contato</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{proposta.email_cliente || "Não informado"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{proposta.telefone_cliente || "Não informado"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Informações do Produto */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">Produto</h4>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{proposta.produto || proposta.produto_nome || "Não especificado"}</span>
                    </div>
                  </div>
                  
                  {/* Informações Financeiras */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Valor da Proposta</h4>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500 font-medium">VALOR TOTAL</span>
                      </div>
                      <div className="text-2xl font-bold text-[#168979]">
                        {proposta.valor_total > 0 ? formatarMoeda(proposta.valor_total) : "Não definido"}
                      </div>
                    </div>
                  </div>
                  
                  {/* Corretor (se houver) */}
                  {proposta.corretor_nome && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Corretor: <span className="font-medium text-gray-700">{proposta.corretor_nome}</span></span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
