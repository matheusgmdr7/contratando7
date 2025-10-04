"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, TrendingUp, Users, CheckCircle, AlertCircle, RefreshCw, BarChart3, DollarSign, FilePlus, Activity, Target, UserCheck, Calculator, Send, CheckSquare } from "lucide-react"
import { buscarPropostasPorCorretor } from "@/services/propostas-service-unificado"
import { getCorretorLogado } from "@/services/auth-corretores-simples"
import { buscarComissoesPorCorretor } from "@/services/comissoes-service"
import { formatarMoeda } from "@/utils/formatters"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { testarConexaoSupabase } from "@/lib/supabase"

interface DashboardStats {
  propostasEnviadas: number
  propostasAprovadas: number
  comissoesTotais: number
  comissoesPagas: number
  clientesAtivos: number
}

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
    'cadastrado': { label: 'Cadastrada', color: 'bg-gray-100 text-gray-800' },
    'cadastrada': { label: 'Cadastrada', color: 'bg-gray-100 text-gray-800' }
  }
  
  return statusMap[status?.toLowerCase()] || { label: status || 'Desconhecido', color: 'bg-gray-100 text-gray-800' }
}

// Função para verificar se status é considerado aprovado (inclui cadastrados)
const isStatusAprovado = (status: string): boolean => {
  const statusAprovados = ['aprovada', 'aprovado', 'cadastrado', 'cadastrada']
  return statusAprovados.includes(status?.toLowerCase())
}

export default function CorretorDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    propostasEnviadas: 0,
    propostasAprovadas: 0,
    comissoesTotais: 0,
    comissoesPagas: 0,
    clientesAtivos: 0,
  })
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [ultimasPropostas, setUltimasPropostas] = useState<any[]>([])
  const [ultimasComissoes, setUltimasComissoes] = useState<any[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<string>(new Date().toISOString().substring(0, 7)) // Formato YYYY-MM
  const [periodoSelecionado, setPeriodoSelecionado] = useState<string>("todos")
  const [tentativasRecarregar, setTentativasRecarregar] = useState(0)
  const [statusSupabase, setStatusSupabase] = useState<boolean | null>(null)
  const [verificandoSupabase, setVerificandoSupabase] = useState(false)

  // Função para obter o primeiro e último dia do mês
  const obterPrimeiroDiaDoMes = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-")
    return new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1, 0, 0, 0, 0)
  }

  const obterUltimoDiaDoMes = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-")
    return new Date(Number.parseInt(ano), Number.parseInt(mes), 0, 23, 59, 59, 999)
  }

  // Função para filtrar dados por período
  const filtrarPorPeriodo = (dados: any[], dataInicio: Date, dataFim: Date) => {
    console.log("🔍 Filtrando dados por período:")
    console.log("📅 Data início:", dataInicio.toISOString())
    console.log("📅 Data fim:", dataFim.toISOString())
    console.log("📊 Total de dados antes do filtro:", dados.length)
    
    const dadosFiltrados = dados.filter((item) => {
      try {
      const dataItem = new Date(item.created_at || item.data)
        
        // Verificar se a data é válida
        if (isNaN(dataItem.getTime())) {
          console.log(`⚠️ Data inválida para item ${item.id}:`, item.created_at || item.data)
          return false
        }
        
        const estaNoPeriodo = dataItem >= dataInicio && dataItem <= dataFim
        
        if (!estaNoPeriodo) {
          console.log(`❌ Item ${item.id} fora do período:`, dataItem.toISOString(), "não está entre", dataInicio.toISOString(), "e", dataFim.toISOString())
        } else {
          console.log(`✅ Item ${item.id} dentro do período:`, dataItem.toISOString())
        }
        
        return estaNoPeriodo
      } catch (error) {
        console.error(`❌ Erro ao processar data do item ${item.id}:`, error)
        return false
      }
    })
    
    console.log("📊 Total de dados após filtro:", dadosFiltrados.length)
    return dadosFiltrados
  }

  // Verificar conexão com Supabase
  const verificarConexaoSupabase = async () => {
    try {
      setVerificandoSupabase(true)
      const resultado = await testarConexaoSupabase()
      setStatusSupabase(resultado)
      return resultado
    } catch (error) {
      console.error("Erro ao verificar conexão com Supabase:", error)
      setStatusSupabase(false)
      return false
    } finally {
      setVerificandoSupabase(false)
    }
  }

  useEffect(() => {
    // Verificar conexão com Supabase ao carregar a página
    verificarConexaoSupabase()
  }, [])

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setCarregando(true)
        setErro(null)

        // Verificar conexão com Supabase
        const conexaoOk = await verificarConexaoSupabase()
        if (!conexaoOk) {
          setErro("Não foi possível conectar ao banco de dados. Verifique a configuração do Supabase.")
          setCarregando(false)
          return
        }

        // Obter o corretor logado
        const corretor = getCorretorLogado()

        if (!corretor || !corretor.id) {
          setErro("Corretor não autenticado ou ID não disponível")
          setCarregando(false)
          return
        }

        console.log("🔐 Corretor autenticado:", corretor)
        console.log("🆔 ID do corretor autenticado:", corretor.id)

        // Buscar propostas do corretor
        const propostas = await buscarPropostasPorCorretor(corretor.id)
        console.log("📊 Propostas carregadas:", propostas.length)
        console.log("📋 Detalhes das propostas:", propostas.map(p => ({ id: p.id, status: p.status, created_at: p.created_at })))

        // Buscar comissões do corretor
        const comissoes = await buscarComissoesPorCorretor(corretor.id)

        // Definir datas de início e fim com base no período selecionado
        let dataInicio: Date, dataFim: Date

        if (periodoSelecionado === "mes-atual") {
          const hoje = new Date()
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1, 0, 0, 0, 0)
          dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999)
        } else if (periodoSelecionado === "mes-especifico") {
          dataInicio = obterPrimeiroDiaDoMes(mesSelecionado)
          dataFim = obterUltimoDiaDoMes(mesSelecionado)
        } else {
          // todos
          dataInicio = new Date(0) // Data mínima
          dataFim = new Date(8640000000000000) // Data máxima
        }

        console.log("📅 Período selecionado:", periodoSelecionado)
        console.log("📅 Data início:", dataInicio)
        console.log("📅 Data fim:", dataFim)

        // Filtrar dados pelo período selecionado
        const propostasFiltradas = filtrarPorPeriodo(propostas, dataInicio, dataFim)
        console.log("📊 Propostas filtradas:", propostasFiltradas.length)

        const comissoesFiltradas = filtrarPorPeriodo(comissoes, dataInicio, dataFim)

        // Calcular resumo das comissões
        const comissoesTotais = comissoesFiltradas.reduce((acc, comissao) => acc + Number(comissao.valor || 0), 0)
        const comissoesPagas = comissoesFiltradas
          .filter((comissao) => comissao.status === "pago")
          .reduce((acc, comissao) => acc + Number(comissao.valor || 0), 0)

        // Calcular estatísticas com base nas propostas
        const propostasEnviadas = propostasFiltradas.length
        const propostasAprovadas = propostasFiltradas.filter((p) => isStatusAprovado(p.status)).length

        console.log("📊 Propostas enviadas:", propostasEnviadas)
        console.log("📊 Propostas aprovadas:", propostasAprovadas)

        // Calcular clientes únicos (baseado no email)
        const clientesUnicos = new Set()
        propostasFiltradas?.forEach((proposta) => {
          // Apenas propostas APROVADAS contam como clientes ativos
          if (isStatusAprovado(proposta.status) && proposta.email_cliente) {
            clientesUnicos.add(proposta.email_cliente)
          }
        })
        const clientesAtivos = clientesUnicos.size

        // Atualizar estatísticas
        setStats({
          propostasEnviadas,
          propostasAprovadas,
          comissoesTotais,
          comissoesPagas,
          clientesAtivos,
        })

        // Definir últimas propostas reais (limitado a 5)
        const propostasRecentes =
          propostas.length > 0
            ? [...propostas]
                .sort((a, b) => new Date(b.created_at || "").getTime() - new Date(a.created_at || "").getTime())
                .slice(0, 5)
            : []

        setUltimasPropostas(propostasRecentes)

        // Definir últimas comissões (limitado a 5)
        const comissoesRecentes = [...comissoes]
          .sort(
            (a, b) =>
              new Date(b.created_at || b.data || "").getTime() - new Date(a.created_at || a.data || "").getTime(),
          )
          .slice(0, 5)

        setUltimasComissoes(comissoesRecentes)
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
        setErro("Erro ao carregar dados do dashboard. Tente novamente.")
      } finally {
        setCarregando(false)
      }
    }

    carregarDados()
  }, [mesSelecionado, periodoSelecionado, tentativasRecarregar])

  // Função para formatar o mês para exibição
  const formatarMes = (dataStr: string) => {
    const [ano, mes] = dataStr.split("-")
    const data = new Date(Number.parseInt(ano), Number.parseInt(mes) - 1, 1)
    return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
  }

  // Gerar opções de meses (últimos 12 meses)
  const gerarOpcoesMeses = () => {
    const opcoes = []
    const dataAtual = new Date()

    for (let i = 0; i < 12; i++) {
      const data = new Date(dataAtual.getFullYear(), dataAtual.getMonth() - i, 1)
      const valor = data.toISOString().substring(0, 7) // YYYY-MM
      opcoes.push({ valor, label: data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) })
    }

    return opcoes
  }

  const opcoesMeses = gerarOpcoesMeses()

  // Função para tentar recarregar os dados
  const handleRecarregar = () => {
    setTentativasRecarregar((prev) => prev + 1)
  }

  if (erro) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Erro ao carregar o dashboard</h2>
        <p className="text-gray-600 mb-6 max-w-md">{erro}</p>

        {statusSupabase === false && (
          <Alert variant="destructive" className="mb-6 max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Problema de conexão com o banco de dados</AlertTitle>
            <AlertDescription>
              Não foi possível conectar ao Supabase. Verifique se as variáveis de ambiente estão configuradas
              corretamente.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleRecarregar} variant="outline" className="min-w-[140px] btn-corporate">
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar novamente
          </Button>

          <Button onClick={verificarConexaoSupabase} variant="outline" disabled={verificandoSupabase} className="min-w-[140px] btn-corporate">
            {verificandoSupabase ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Verificar conexão
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">Dashboard</h1>
            <p className="text-gray-600 mt-1 font-medium">Acompanhe suas vendas e comissões</p>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <Tabs defaultValue="todos" className="w-full lg:w-[420px]" onValueChange={setPeriodoSelecionado}>
              <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                <TabsTrigger value="mes-atual" className="text-sm font-medium">Mês Atual</TabsTrigger>
                <TabsTrigger value="mes-especifico" className="text-sm font-medium">Mês Específico</TabsTrigger>
                <TabsTrigger value="todos" className="text-sm font-medium">Todos</TabsTrigger>
              </TabsList>
              <TabsContent value="mes-especifico" className="mt-3">
                <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesMeses.map((opcao) => (
                      <SelectItem key={opcao.valor} value={opcao.valor}>
                        {opcao.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
            <Button 
              className="bg-[#168979] hover:bg-[#13786a] text-white font-bold px-6 py-2 btn-corporate shadow-corporate"
              onClick={() => window.location.href = '/corretor/propostas/nova'}
            >
              <FileText className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="flex justify-center items-center h-64 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center">
            <div className="loading-corporate mx-auto"></div>
            <span className="block mt-4 loading-text-corporate">Carregando dados do dashboard...</span>
            <p className="text-xs text-gray-500 mt-2">Aguarde um momento</p>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider font-sans">Propostas Enviadas</CardTitle>
                  <div className="text-3xl font-bold text-[#168979] mt-2">{stats.propostasEnviadas}</div>
                </div>
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Send className="h-6 w-6 text-gray-700" />
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-xs text-gray-500 font-medium">
                  {periodoSelecionado === "mes-atual"
                    ? "No mês atual"
                    : periodoSelecionado === "mes-especifico"
                      ? `Em ${formatarMes(mesSelecionado)}`
                      : "Total"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider font-sans">Propostas Aprovadas</CardTitle>
                  <div className="text-3xl font-bold text-[#168979] mt-2">{stats.propostasAprovadas}</div>
                </div>
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-6 w-6 text-gray-700" />
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-xs text-gray-500 font-medium">
                  {periodoSelecionado === "mes-atual"
                    ? "No mês atual"
                    : periodoSelecionado === "mes-especifico"
                      ? `Em ${formatarMes(mesSelecionado)}`
                      : "Total"}
                </p>
              </CardContent>
            </Card>


            <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between pb-3 pt-6">
                <div>
                  <CardTitle className="text-sm font-bold text-gray-600 uppercase tracking-wider font-sans">Clientes Ativos</CardTitle>
                  <div className="text-3xl font-bold text-[#168979] mt-2">{stats.clientesAtivos}</div>
                </div>
                <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-gray-700" />
                </div>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-xs text-gray-500 font-medium">
                  {periodoSelecionado === "mes-atual"
                    ? "No mês atual"
                    : periodoSelecionado === "mes-especifico"
                      ? `Em ${formatarMes(mesSelecionado)}`
                      : "Total"}
                </p>
              </CardContent>
            </Card>

          </div>

          {/* Performance Indicator */}
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 font-sans">Performance do Mês</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center bg-white rounded-lg p-4 border border-gray-100">
                <div className="text-3xl font-bold text-[#168979] mb-2">
                  {stats.propostasAprovadas > 0 && stats.propostasEnviadas > 0 
                    ? Math.round((stats.propostasAprovadas / stats.propostasEnviadas) * 100)
                    : 0}%
                </div>
                <p className="text-sm text-gray-600 font-semibold">Taxa de Aprovação</p>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-gray-100">
                <div className="text-3xl font-bold text-[#168979] mb-2">
                  {formatarMoeda(stats.comissoesTotais)}
                </div>
                <p className="text-sm text-gray-600 font-semibold">Total em Comissões</p>
              </div>
              <div className="text-center bg-white rounded-lg p-4 border border-gray-100">
                <div className="text-3xl font-bold text-[#168979] mb-2">
                  {stats.clientesAtivos}
                </div>
                <p className="text-sm text-gray-600 font-semibold">Clientes Conquistados</p>
              </div>
            </div>
          </div>

          {/* Recent Activity Section */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm">
              <CardHeader className="pb-4 pt-6 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-lg font-bold text-gray-900 font-sans">Últimas Propostas</CardTitle>
                <CardDescription className="text-gray-600 font-medium">Propostas enviadas recentemente</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                {ultimasPropostas.length > 0 ? (
                  <div className="space-y-4">
                    {ultimasPropostas.map((proposta, index) => (
                      <div
                        key={proposta.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:shadow-corporate transition-all duration-200"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {proposta.nome_cliente || proposta.cliente || "Cliente não informado"}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(proposta.created_at || "").toLocaleDateString("pt-BR")}
                          </span>
                          <span className="text-xs text-gray-600 mt-1 font-medium">
                            {proposta.produto_nome || proposta.plano_nome || "Plano"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <span
                            className={`px-2 py-1 text-xs font-semibold corporate-rounded ${mapearStatusProposta(proposta.status).color}`}
                          >
                            {mapearStatusProposta(proposta.status).label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-semibold">Nenhuma proposta enviada ainda</p>
                    <p className="text-sm text-gray-500 mt-2 font-medium">As propostas aparecerão aqui após serem enviadas</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm">
              <CardHeader className="pb-4 pt-6 bg-gray-50 rounded-t-lg">
                <CardTitle className="text-lg font-bold text-gray-900 font-sans">Comissões Recentes</CardTitle>
                <CardDescription className="text-gray-600 font-medium">Últimas comissões recebidas</CardDescription>
              </CardHeader>
              <CardContent className="pb-6">
                {ultimasComissoes.length > 0 ? (
                  <div className="space-y-4">
                    {ultimasComissoes.map((comissao, index) => (
                      <div
                        key={comissao.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-200 hover:shadow-corporate transition-all duration-200"
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {comissao.descricao ||
                              (comissao.propostas_corretores?.cliente
                                ? `${comissao.propostas_corretores.cliente}`
                                : "Comissão")}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {new Date(comissao.created_at || comissao.data || "").toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-gray-900">
                            {formatarMoeda(comissao.valor || 0)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                              comissao.status === "pago" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {comissao.status === "pago" ? "Pago" : "Pendente"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-600 font-semibold">Nenhuma comissão recebida ainda</p>
                    <p className="text-sm text-gray-500 mt-2 font-medium">As comissões aparecerão aqui conforme forem processadas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
