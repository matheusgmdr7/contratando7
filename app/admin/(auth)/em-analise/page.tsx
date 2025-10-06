"use client"

import { useState, useEffect } from "react"
import { 
  buscarPropostas, 
  atualizarStatusProposta, 
  buscarPropostaCompleta,
  buscarDependentesProposta,
  obterNomeCliente,
  obterEmailCliente,
  obterTelefoneCliente
} from "@/services/propostas-service-unificado"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Eye, CheckCircle, XCircle, Search, Filter, RefreshCw, Heart, Clock } from "lucide-react"
import { formatarMoeda } from "@/utils/formatters"
import { supabase } from "@/lib/supabase"

// Função para obter o texto da pergunta por ID
function obterTextoPergunta(perguntaId: number): string {
  const perguntas = {
    1: "Teve alguma doença que resultou em internação nos últimos 2 anos? (qual?)",
    2: "Foi submetido(a) a internações clínicas, cirúrgicas ou psiquiátricas nos últimos 5 anos? Caso positivo, informe quando e qual doença.",
    3: "Possui alguma doença hereditária ou congênita? (qual?)",
    4: "É portador de alguma doença que desencadeou sequela física? (qual?)",
    5: "É portador de alguma doença que necessitará de transplante?",
    6: "É portador de doença renal que necessite diálise e/ou hemodiálise?",
    7: "É portador de câncer? (informar a localização)",
    8: "Tem ou teve alguma doença oftalmológica, como catarata, glaucoma, astigmatismo, miopia, hipermetropia ou outra? Fez cirurgia refrativa?",
    9: "Tem ou teve alguma doença do ouvido, nariz ou garganta, como sinusite, desvio de septo, amigdalite, otite ou outra?",
    10: "É portador de alguma doença do aparelho digestivo, como gastrite, úlcera, colite, doença da vesícula biliar ou outras?",
    11: "É portador de alguma doença ortopédica como hérnia de disco, osteoporose ou outros?",
    12: "É portador de alguma doença neurológica como mal de Parkinson, doenças de Alzheimer, epilepsia ou outros?",
    13: "É portador de alguma doença cardíaca, circulatória (varizes e outras), hipertensiva ou diabetes?",
    14: "É portador de alguma doença ginecológica / urológica?",
    15: "É portador de hérnia inguinal, umbilical, incisional ou outras?",
    16: "É portador de alguma doença infectocontagiosa, inclusive AIDS ou hepatite?",
    17: "É portador de alguma doença psiquiátrica, como depressão, esquizofrenia, demência, alcoolismo, dependência de drogas ou outra?",
    18: "Teve alguma patologia que necessitou de tratamento psicológico ou psicoterápico? (qual?)",
    19: "É portador ou já sofreu de alguma doença do aparelho respiratório, como asma, doença pulmonar obstrutiva crônica, bronquite, enfisema ou outra?",
    20: "Tem ou teve alguma doença não relacionada nas perguntas anteriores?",
    21: "É gestante?"
  }
  
  return perguntas[perguntaId as keyof typeof perguntas] || "Pergunta não disponível"
}

export default function EmAnalisePage() {
  const [propostas, setPropostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [origemFiltro, setOrigemFiltro] = useState("todas")
  const [propostaDetalhada, setPropostaDetalhada] = useState<any>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState("")
  const [showModalRejeicao, setShowModalRejeicao] = useState(false)
  const [showModalDetalhes, setShowModalDetalhes] = useState(false)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [dependentes, setDependentes] = useState<any[]>([])
  const [questionariosSaude, setQuestionariosSaude] = useState<any[]>([])

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(25)

  useEffect(() => {
    carregarPropostas()
  }, [])

  async function carregarPropostas() {
    try {
      setLoading(true)
      console.log("🔄 Carregando propostas em análise...")
      const data = await buscarPropostas()
      // Filtrar apenas propostas com status "pendente"
      const propostasEmAnalise = data.filter((p: any) => p.status === "pendente")
      console.log("📊 Propostas em análise:", propostasEmAnalise.length)
      setPropostas(propostasEmAnalise)
    } catch (error: any) {
      console.error("❌ Erro ao carregar propostas:", error)
      toast.error("Erro ao carregar propostas")
    } finally {
      setLoading(false)
    }
  }

  async function aprovarProposta(id: string) {
    try {
      await atualizarStatusProposta(id, "aprovada")
      toast.success("Proposta aprovada com sucesso!")
      carregarPropostas()
    } catch (error: any) {
      console.error("Erro ao aprovar proposta:", error)
      toast.error("Erro ao aprovar proposta")
    }
  }

  async function rejeitarProposta() {
    if (!propostaDetalhada) return

    try {
      await atualizarStatusProposta(propostaDetalhada.id, "rejeitada", motivoRejeicao)
      toast.success("Proposta rejeitada com sucesso!")
      setShowModalRejeicao(false)
      setMotivoRejeicao("")
      setPropostaDetalhada(null)
      carregarPropostas()
    } catch (error: any) {
      console.error("Erro ao rejeitar proposta:", error)
      toast.error("Erro ao rejeitar proposta")
    }
  }

  function abrirModalRejeicao(proposta: any) {
    setPropostaDetalhada(proposta)
    setShowModalRejeicao(true)
  }

  async function abrirModalDetalhes(proposta: any) {
    setPropostaDetalhada(proposta)
    setShowModalDetalhes(true)
    await carregarDetalhesCompletos(proposta)
  }

  async function carregarDetalhesCompletos(proposta: any) {
    try {
      setLoadingDetalhes(true)
      console.log("🔍 CARREGANDO DETALHES COMPLETOS - EM ANÁLISE")
      console.log("📋 Proposta ID:", proposta.id)

      // 1. Buscar dados completos da proposta
      const propostaCompleta = await buscarPropostaCompleta(proposta.id)
      setPropostaDetalhada(propostaCompleta as any)

      // 2. Carregar dependentes
      let dependentesData = await buscarDependentesProposta(proposta.id)
      if (!dependentesData || dependentesData.length === 0) {
        // Tentar parsear do campo dependentes
        try {
          if (proposta.dependentes && typeof proposta.dependentes === 'string') {
            dependentesData = JSON.parse(proposta.dependentes)
          } else if (Array.isArray(proposta.dependentes)) {
            dependentesData = proposta.dependentes
          }
        } catch {
          dependentesData = []
        }
      }
      setDependentes(dependentesData)

      // 3. Buscar questionários de saúde
      let questionariosData = []
      
      // Primeiro tentar buscar na tabela questionario_respostas
      const { data: questionariosRespostas, error: errorQuestionariosRespostas } = await supabase
        .from("questionario_respostas")
        .select("*, respostas_questionario(*)")
        .eq("proposta_id", proposta.id)
      
      if (!errorQuestionariosRespostas && questionariosRespostas && questionariosRespostas.length > 0) {
        console.log("✅ Questionário encontrado em questionario_respostas:", questionariosRespostas.length)
        questionariosData = questionariosRespostas
      } else {
        console.log("ℹ️ Nenhum questionário em questionario_respostas, tentando questionario_saude...")
        
        // Fallback para a tabela questionario_saude
        const { data: questionariosSaude, error: errorQuestionariosSaude } = await supabase
          .from("questionario_saude")
          .select("*")
          .eq("proposta_id", proposta.id)
          .order("pergunta_id", { ascending: true })
        
        if (!errorQuestionariosSaude && questionariosSaude && questionariosSaude.length > 0) {
          console.log("✅ Questionário encontrado em questionario_saude:", questionariosSaude.length)
          questionariosData = questionariosSaude
        } else {
          console.log("ℹ️ Nenhum questionário encontrado em nenhuma tabela")
        }
      }
      
      setQuestionariosSaude(questionariosData)
      
      console.log("🎯 RESUMO DO CARREGAMENTO:")
      console.log("📋 Proposta completa:", !!propostaCompleta)
      console.log("👨‍👩‍👧‍👦 Dependentes:", dependentesData?.length || 0)
      console.log("🏥 Questionários:", questionariosData?.length || 0)

    } catch (error) {
      console.error("❌ Erro ao carregar detalhes:", error)
      toast.error("Erro ao carregar detalhes da proposta")
    } finally {
      setLoadingDetalhes(false)
    }
  }

  function renderDeclaracaoSaudeUnificada() {
    if (!questionariosSaude || questionariosSaude.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Declaração de Saúde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Nenhuma resposta encontrada</p>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="space-y-6">
        {questionariosSaude.map((q, idx) => (
          <Card key={q.id || idx}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                {q.pessoa_tipo === "titular"
                  ? "Declaração de Saúde - Titular"
                  : `Declaração de Saúde - ${q.pessoa_nome}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-2 text-sm text-gray-700">
                <span className="mr-4">Peso: <b>{q.peso || "-"} kg</b></span>
                <span>Altura: <b>{q.altura || "-"} cm</b></span>
              </div>
              {q.respostas_questionario && q.respostas_questionario.length > 0 ? (
                // Remover duplicatas baseado em pergunta_id
                Array.from(new Map(q.respostas_questionario.map((r: any) => [r.pergunta_id, r])).values())
                  .map((resposta: any, i: any) => (
                    <div key={`${q.id}-${resposta.pergunta_id}-${i}`} className="border-l-4 border-blue-200 pl-4 py-2 mb-2">
                      <div className="font-medium text-gray-900 mb-1">Pergunta {resposta.pergunta_id}</div>
                      <div className="text-sm text-gray-600 mb-2">
                        {resposta.pergunta_texto || resposta.pergunta || obterTextoPergunta(resposta.pergunta_id)}
                      </div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${resposta.resposta === "sim" || resposta.resposta === true ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}`}>
                        {resposta.resposta === "sim" || resposta.resposta === true ? "SIM" : "NÃO"}
                      </div>
                      {resposta.observacao && (
                        <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>Observações:</strong> {resposta.observacao}
                        </div>
                      )}
                    </div>
                  ))
              ) : (
                <div className="text-gray-500">Nenhuma resposta encontrada</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  function obterNomeCliente(proposta: any) {
    if (proposta.origem === "propostas") {
      return proposta.nome_cliente || proposta.nome || "Nome não informado"
    } else {
      return proposta.cliente || proposta.nome_cliente || "Nome não informado"
    }
  }

  function obterEmailCliente(proposta: any) {
    if (proposta.origem === "propostas") {
      return proposta.email || "Email não informado"
    } else {
      return proposta.email_cliente || proposta.email || "Email não informado"
    }
  }

  // Função para exibir badge de status (igual à /propostas)
  function getStatusBadge(status: any) {
    if (status === "parcial") {
      return {
        label: "AGUARDANDO VALIDAÇÃO",
        color: "bg-gray-100 text-blue-600",
        icon: Clock
      }
    } else if (status === "aguardando_cliente") {
      return {
        label: "AGUARDANDO CLIENTE",
        color: "bg-gray-100 text-amber-600",
        icon: Clock
      }
    } else if (status === "pendente") {
      return {
        label: "AGUARDANDO ANÁLISE",
        color: "bg-gray-100 text-yellow-600",
        icon: Clock
      }
    } else if (status === "aprovada") {
      return {
        label: "APROVADA",
        color: "bg-gray-100 text-green-600",
        icon: CheckCircle
      }
    } else if (status === "rejeitada") {
      return {
        label: "REJEITADA",
        color: "bg-gray-100 text-red-600",
        icon: XCircle
      }
    } else if (status === "cancelada") {
      return {
        label: "CANCELADA",
        color: "bg-gray-100 text-orange-600",
        icon: XCircle
      }
    } else if (status === "cadastrado" || status === "cadastrada") {
      return {
        label: "CADASTRADO",
        color: "bg-gray-100 text-green-600",
        icon: CheckCircle
      }
    } else {
      return {
        label: status || "INDEFINIDO",
        color: "bg-gray-100 text-gray-600",
        icon: CheckCircle
      }
    }
  }

  // Função para exibir badge de origem (igual à /propostas)
  function getOrigemBadge(origem: any) {
    const origemConfig = {
      propostas: { label: "Cliente Direto", color: "bg-slate-50 text-slate-700 border border-slate-200" },
      propostas_corretores: { label: "Via Corretor", color: "bg-gray-50 text-gray-700 border border-gray-200" },
    }

    return origemConfig[origem as keyof typeof origemConfig] || { label: origem, color: "bg-gray-50 text-gray-700 border border-gray-200" }
  }

  // Função para parsear dependentes igual à página de propostas
  function parseDependentes(proposta: any) {
    let dependentesArr: any[] = []
    if (proposta.dependentes_dados && Array.isArray(proposta.dependentes_dados) && proposta.dependentes_dados.length > 0) {
      dependentesArr = proposta.dependentes_dados
    } else if (typeof proposta.dependentes === "string" && proposta.dependentes && proposta.dependentes.length > 0) {
      try {
        dependentesArr = JSON.parse(proposta.dependentes)
      } catch {}
    } else if (Array.isArray(proposta.dependentes) && proposta.dependentes && proposta.dependentes.length > 0) {
      dependentesArr = proposta.dependentes
    }
    return dependentesArr
  }

  // Função para calcular valor total mensal (titular + dependentes)
  function calcularValorTotalMensal(proposta: any) {
    let total = 0
    let valorTitular = proposta.valor_mensal || proposta.valor || proposta.valor_total || 0
    if (typeof valorTitular !== "number") {
      valorTitular = String(valorTitular).replace(/[^\d,\.]/g, "").replace(",", ".")
      valorTitular = Number.parseFloat(valorTitular)
    }
    if (!isNaN(valorTitular) && valorTitular > 0) {
      total += valorTitular
    }
    const dependentesArr = parseDependentes(proposta)
    if (dependentesArr && dependentesArr.length > 0) {
      dependentesArr.forEach((dep: any) => {
        let valorDep = dep.valor_individual || dep.valor || dep.valor_plano || 0
        if (typeof valorDep !== "number") {
          valorDep = String(valorDep).replace(/[^\d,\.]/g, "").replace(",", ".")
          valorDep = Number.parseFloat(valorDep)
        }
        if (!isNaN(valorDep) && valorDep > 0) {
          total += valorDep
        }
      })
    }
    return total
  }

  function formatarDataSegura(dataString: any) {
    if (!dataString) return "N/A"
    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) {
        return "Data inválida"
      }
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    } catch (error) {
      return "Erro na data"
    }
  }

  function formatarHoraSegura(dataString: any) {
    if (!dataString) return "N/A"
    try {
      const data = new Date(dataString)
      if (isNaN(data.getTime())) {
        return "Hora inválida"
      }
      return data.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (error) {
      return "Erro na hora"
    }
  }

  const propostasFiltradas = propostas.filter((proposta) => {
    const nomeCliente = obterNomeCliente(proposta).toLowerCase()
    const emailCliente = obterEmailCliente(proposta).toLowerCase()
    const matchesFiltro = nomeCliente.includes(filtro.toLowerCase()) || emailCliente.includes(filtro.toLowerCase())
    const matchesOrigem = origemFiltro === "todas" || proposta.origem === origemFiltro

    return matchesFiltro && matchesOrigem
  })

  // Cálculos de paginação
  const totalItens = propostasFiltradas.length
  const totalPaginas = Math.ceil(totalItens / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const propostasExibidas = propostasFiltradas.slice(indiceInicio, indiceFim)

  // Reset da página quando filtros mudam
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtro, origemFiltro])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center">
          <div className="loading-corporate mx-auto"></div>
          <span className="block mt-4 loading-text-corporate">Carregando propostas...</span>
          <p className="text-xs text-gray-500 mt-2">Aguarde um momento</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Propostas Em Análise</h1>
        <button
          onClick={carregarPropostas}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar Lista
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-gray-900">{propostas.length}</div>
          <div className="text-xs text-gray-600">Total em Análise</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-gray-700">
            {propostas.filter((p) => p.origem === "propostas").length}
          </div>
          <div className="text-xs text-gray-600">Clientes Diretos</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <div className="text-xl font-bold text-gray-700">
            {propostas.filter((p) => p.origem === "propostas_corretores").length}
          </div>
          <div className="text-xs text-gray-600">Via Corretores</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar</label>
            <Input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Nome ou email..."
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Origem</label>
            <Select value={origemFiltro} onValueChange={setOrigemFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as origens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="propostas">Clientes Diretos</SelectItem>
                <SelectItem value="propostas_corretores">Via Corretores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Propostas */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Propostas em Análise</h2>
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1}-{Math.min(indiceFim, totalItens)} de {totalItens} propostas
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origem/Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor/Data
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {propostasExibidas.map((proposta) => {
                // Configurações de status e origem (igual à /propostas)
                const statusConfig = getStatusBadge(proposta.status)
                const origemConfig = getOrigemBadge(proposta.origem)
                return (
                  <tr key={proposta.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900" title={obterNomeCliente(proposta)}>
                        {obterNomeCliente(proposta)}
                      </div>
                      <div className="text-xs text-gray-500">ID: {proposta.id}</div>
                      {(proposta.produto_nome || proposta.produto) && (
                        <div className="text-xs text-gray-600 mt-1">Produto: {proposta.produto_nome || proposta.produto}</div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-900" title={obterEmailCliente(proposta)}>
                        {obterEmailCliente(proposta)}
                      </div>
                      <div className="text-xs text-gray-500" title={proposta.telefone || proposta.celular}>
                        {proposta.telefone || proposta.celular || "Telefone não informado"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${origemConfig.color}`}
                        >
                          {origemConfig.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded ${statusConfig.color}`}
                        >
                          {(() => {
                            const IconComponent = statusConfig.icon
                            return <IconComponent className="w-3 h-3" />
                          })()}
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500" title={proposta.corretor_nome ? `Corretor: ${proposta.corretor_nome}` : "Envio Direto"}>
                        {proposta.corretor_nome ? (
                          <span className="text-gray-900 font-normal">{proposta.corretor_nome}</span>
                        ) : (
                          <span className="text-gray-400">Envio Direto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {typeof calcularValorTotalMensal === 'function'
                          ? `R$ ${calcularValorTotalMensal(proposta).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : (proposta.valor ? formatarMoeda(proposta.valor) : "Valor não informado")}
                      </div>
                      <div className="text-xs text-gray-500">{typeof formatarDataSegura === 'function' ? formatarDataSegura(proposta.created_at) : new Date(proposta.created_at).toLocaleDateString("pt-BR")}</div>
                      <div className="text-xs text-gray-500">{typeof formatarHoraSegura === 'function' ? formatarHoraSegura(proposta.created_at) : new Date(proposta.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-1">
                        <button
                          onClick={() => abrirModalDetalhes(proposta)}
                          className="text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors"
                        >
                          Ver
                        </button>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => aprovarProposta(proposta.id)}
                            className="text-green-700 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors text-xs flex-1"
                          >
                            Aprovar
                          </button>
                          <button
                            onClick={() => abrirModalRejeicao(proposta)}
                            className="text-red-700 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors text-xs flex-1"
                          >
                            Reprovar
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {propostasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Nenhuma proposta em análise encontrada</div>
            <div className="text-gray-400 text-sm mt-2">
              {filtro || origemFiltro !== "todas"
                ? "Tente ajustar os filtros de busca"
                : "Todas as propostas foram analisadas"}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Rejeição */}
      {showModalRejeicao && propostaDetalhada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Rejeitar Proposta</h3>
            <p className="text-gray-600 mb-4">
              Tem certeza que deseja rejeitar a proposta de <strong>{obterNomeCliente(propostaDetalhada)}</strong>?
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Motivo da Rejeição</label>
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                placeholder="Informe o motivo da rejeição..."
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModalRejeicao(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={rejeitarProposta}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {showModalDetalhes && propostaDetalhada && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-900">Detalhes da Proposta</h2>
                <button
                  onClick={() => setShowModalDetalhes(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {loadingDetalhes ? (
                <div className="flex justify-center items-center h-32 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-center">
                    <div className="loading-corporate mx-auto"></div>
                    <span className="block mt-4 loading-text-corporate">Carregando detalhes...</span>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="dados" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                    <TabsTrigger value="saude">Declaração de Saúde</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dados" className="space-y-6 mt-6">
                    {/* Dados do Cliente */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Dados do Cliente</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Nome</label>
                            <p className="text-gray-900">{obterNomeCliente(propostaDetalhada)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <p className="text-gray-900">{obterEmailCliente(propostaDetalhada)}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Telefone</label>
                            <p className="text-gray-900">
                              {propostaDetalhada.telefone || propostaDetalhada.celular || "Não informado"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Valor</label>
                            <p className="text-gray-900">
                              {propostaDetalhada.valor ? formatarMoeda(propostaDetalhada.valor) : "Não informado"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Ações */}
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => aprovarProposta(propostaDetalhada.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => {
                          setShowModalDetalhes(false)
                          abrirModalRejeicao(propostaDetalhada)
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reprovar
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="saude" className="space-y-6 mt-6">
                    {renderDeclaracaoSaudeUnificada()}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
