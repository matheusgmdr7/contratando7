"use client"

import { useState, useEffect } from "react"
import { 
  buscarPropostas, 
  atualizarStatusProposta,
  buscarDependentesProposta,
  buscarQuestionarioSaude,
  buscarPropostaCompleta,
  obterDocumentosInteligente,
  obterNomeCliente,
  obterEmailCliente,
  obterTelefoneCliente
} from "@/services/propostas-service-unificado"
import { criarProposta } from "@/services/propostas-service-unificado"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, CheckCircle, Calendar, Building, Search, Filter, RefreshCw, Save, UserCheck, ChevronLeft, ChevronRight, Mail, DollarSign, Edit, Heart, FileText, Download } from "lucide-react"
import { formatarMoeda } from "@/utils/formatters"
import { UploadService } from "@/services/upload-service"
import { buscarCorretores } from "@/services/corretores-service"
import { Textarea } from "@/components/ui/textarea"

export default function CadastradoPage() {
  const [propostas, setPropostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState("")
  const [produtoFiltro, setProdutoFiltro] = useState("todos")
  const [propostaDetalhada, setPropostaDetalhada] = useState<any>(null)
  const [showModalDetalhes, setShowModalDetalhes] = useState(false)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [dependentes, setDependentes] = useState<any[]>([])
  const [questionariosSaude, setQuestionariosSaude] = useState<any[]>([])
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState<any>({})
  const [showModalCadastro, setShowModalCadastro] = useState(false)
  const [propostaCadastro, setPropostaCadastro] = useState<any>(null)

  // Campos para cadastro
  const [administradora, setAdministradora] = useState("")
  const [dataVencimento, setDataVencimento] = useState("")
  const [dataVigencia, setDataVigencia] = useState("")
  const [saving, setSaving] = useState(false)

  // Estado para modal de cadastro manual
  const [showModalCadastroManual, setShowModalCadastroManual] = useState(false)
  const [corretoresDisponiveis, setCorretoresDisponiveis] = useState<any[]>([])
  const [formManual, setFormManual] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    data_nascimento: "",
    cns: "",
    rg: "",
    orgao_emissor: "",
    nome_mae: "",
    sexo: "Masculino",
    uf_nascimento: "SP",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    produto_id: "",
    tabela_id: "",
    cobertura: "Nacional",
    acomodacao: "Enfermaria",
    sigla_plano: "",
    valor: "",
    tem_dependentes: false,
    dependentes: [] as any[],
    anexos: {
      rg_frente: null as File | null,
      rg_verso: null as File | null,
      cpf: null as File | null,
      comprovante_residencia: null as File | null,
      cns: null as File | null,
    },
    anexosDependentes: [] as any[],
    observacoes: "",
    corretor_id: "",
    administradora: "",
    produto: "",
    data_vigencia: "",
    data_vencimento: "",
    data_cadastro: "",
    status: "cadastrado",
    documentos: {},
  })
  const [uploading, setUploading] = useState(false)

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const [itensPorPagina] = useState(25)

  useEffect(() => {
    carregarPropostas()
  }, [])

  useEffect(() => {
    if (showModalCadastroManual) {
      buscarCorretores().then(setCorretoresDisponiveis)
    }
  }, [showModalCadastroManual])

  async function carregarPropostas() {
    try {
      setLoading(true)
      console.log("🔄 Carregando propostas aprovadas e cadastradas...")
      const data = await buscarPropostas()
      // Filtrar propostas com status "aprovada" ou "cadastrado"
      const propostasParaCadastro = data.filter((p: any) => 
        p.status === "aprovada" || p.status === "cadastrado" || p.status === "cadastrada"
      )
      console.log("📊 Propostas para cadastro:", propostasParaCadastro.length)
      console.log("📋 Status encontrados:", [...new Set(data.map((p: any) => p.status))])
      console.log("💰 Debug valores:", propostasParaCadastro.slice(0, 3).map(p => ({
        id: p.id,
        valor: p.valor,
        valor_total: p.valor_total,
        valor_mensal: p.valor_mensal
      })))
      setPropostas(propostasParaCadastro)
    } catch (error: any) {
      console.error("❌ Erro ao carregar propostas:", error)
      toast.error("Erro ao carregar propostas")
    } finally {
      setLoading(false)
    }
  }

  async function finalizarCadastro() {
    if (!propostaCadastro || !administradora || !dataVencimento || !dataVigencia) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      setSaving(true)
      
      // Atualizar a proposta com os dados de cadastro
      const { error } = await supabase
        .from("propostas")
        .update({
          administradora,
          data_vencimento: dataVencimento,
          data_vigencia: dataVigencia,
          data_cadastro: new Date().toISOString(),
          status: "cadastrado"
        })
        .eq("id", propostaCadastro.id)

      if (error) {
        throw error
      }

      toast.success("Cadastro finalizado com sucesso!")
      setShowModalCadastro(false)
      setPropostaCadastro(null)
      setAdministradora("")
      setDataVencimento("")
      setDataVigencia("")
      carregarPropostas()
    } catch (error: any) {
      console.error("Erro ao finalizar cadastro:", error)
      toast.error("Erro ao finalizar cadastro")
    } finally {
      setSaving(false)
    }
  }

  async function handleCadastroManual(e: any) {
    e.preventDefault()
    setUploading(true)
    try {
      // Upload dos anexos do titular
      let anexosUrls = {}
      if (formManual.anexos && (
        formManual.anexos.rg_frente || 
        formManual.anexos.rg_verso || 
        formManual.anexos.cpf || 
        formManual.anexos.comprovante_residencia || 
        formManual.anexos.cns
      )) {
        const uploadTitular = await UploadService.uploadDocumentos(
          "manual_titular", // id temporário
          formManual.anexos,
          [],
        )
        anexosUrls = uploadTitular.documentosUrls
      }

      // Upload dos anexos dos dependentes
      let anexosDependentesUrls = []
      if (formManual.anexosDependentes && formManual.anexosDependentes.length > 0) {
        for (let i = 0; i < formManual.anexosDependentes.length; i++) {
          const anexosDependente = formManual.anexosDependentes[i]
          if (anexosDependente && Object.keys(anexosDependente).some(key => anexosDependente[key])) {
            const uploadDependente = await UploadService.uploadDocumentos(
              `manual_dependente_${i}`,
              anexosDependente,
              [],
            )
            anexosDependentesUrls.push(uploadDependente.documentosUrls)
          } else {
            anexosDependentesUrls.push({})
          }
        }
      }

      // Criar proposta manualmente com todos os dados
      const propostaId = await criarProposta({
        // Dados do titular
        nome: formManual.nome,
        cpf: formManual.cpf,
        data_nascimento: formManual.data_nascimento,
        email: formManual.email,
        telefone: formManual.telefone,
        cns: formManual.cns,
        rg: formManual.rg,
        orgao_emissor: formManual.orgao_emissor,
        nome_mae: formManual.nome_mae,
        sexo: formManual.sexo,
        uf_nascimento: formManual.uf_nascimento,
        
        // Endereço
        cep: formManual.cep,
        endereco: formManual.endereco,
        numero: formManual.numero,
        complemento: formManual.complemento,
        bairro: formManual.bairro,
        cidade: formManual.cidade,
        estado: formManual.estado,
        
        // Dados do plano
        produto_id: formManual.produto_id,
        tabela_id: formManual.tabela_id,
        cobertura: formManual.cobertura,
        acomodacao: formManual.acomodacao,
        sigla_plano: formManual.sigla_plano,
        valor: formManual.valor,
        
        // Dados de cadastro
        corretor_id: formManual.corretor_id,
        administradora: formManual.administradora,
        data_vigencia: formManual.data_vigencia,
        data_vencimento: formManual.data_vencimento,
        data_cadastro: formManual.data_cadastro,
        status: formManual.status,
        
        // Dependentes
        dependentes: formManual.dependentes,
        
        // Anexos
        anexos: anexosUrls,
        anexosDependentes: anexosDependentesUrls,
        
        // Outros
        observacoes: formManual.observacoes,
        origem: "manual",
      })

      if (propostaId) {
        toast.success("Cliente cadastrado manualmente com sucesso!")
        setShowModalCadastroManual(false)
        setFormManual({
          nome: "",
          email: "",
          telefone: "",
          cpf: "",
          data_nascimento: "",
          cns: "",
          rg: "",
          orgao_emissor: "",
          nome_mae: "",
          sexo: "Masculino",
          uf_nascimento: "SP",
          cep: "",
          endereco: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
          produto_id: "",
          tabela_id: "",
          cobertura: "Nacional",
          acomodacao: "Enfermaria",
          sigla_plano: "",
          valor: "",
          tem_dependentes: false,
          dependentes: [],
          anexos: {
            rg_frente: null,
            rg_verso: null,
            cpf: null,
            comprovante_residencia: null,
            cns: null,
          },
          anexosDependentes: [],
          observacoes: "",
          corretor_id: "",
          administradora: "",
          produto: "",
          data_vigencia: "",
          data_vencimento: "",
          data_cadastro: "",
          status: "cadastrado",
          documentos: {},
        })
        carregarPropostas()
      } else {
        toast.error("Erro ao cadastrar cliente manualmente")
      }
    } catch (error) {
      console.error("Erro ao cadastrar cliente manualmente:", error)
      toast.error("Erro ao cadastrar cliente manualmente")
    } finally {
      setUploading(false)
    }
  }

  function abrirModalCadastro(proposta: any) {
    setPropostaCadastro(proposta)
    setShowModalCadastro(true)
  }

  async function abrirModalDetalhes(proposta: any) {
    setPropostaDetalhada(proposta)
    setShowModalDetalhes(true)
    setEditMode(false)
    setEditData({})
    await carregarDetalhesCompletos(proposta)
  }

  function parseDependentes(proposta: any) {
    try {
      if (proposta.dependentes && typeof proposta.dependentes === 'string') {
        return JSON.parse(proposta.dependentes)
      } else if (Array.isArray(proposta.dependentes)) {
        return proposta.dependentes
      }
      return []
    } catch {
      return []
    }
  }

  async function carregarDetalhesCompletos(proposta: any) {
    try {
      setLoadingDetalhes(true)
      console.log("🔍 CARREGANDO DETALHES COMPLETOS - UNIFICADO")
      console.log("=".repeat(60))
      console.log("📋 Proposta ID:", proposta.id)
      console.log("📋 Origem:", proposta.origem)

      // 1. Buscar dados completos da proposta
      const propostaCompleta = await buscarPropostaCompleta(proposta.id)
      setPropostaDetalhada(propostaCompleta as any)

      // 2. Carregar dependentes
      let dependentesData = await buscarDependentesProposta(proposta.id)
      if (!dependentesData || dependentesData.length === 0) {
        // Tentar parsear do campo dependentes
        dependentesData = parseDependentes(proposta)
      }
      setDependentes(dependentesData)

      // 3. Buscar questionários de saúde (centralizado)
      let questionariosData = []
      
      // Primeiro tentar buscar na tabela questionario_respostas
      const { data: questionariosRespostas, error: errorQuestionariosRespostas } = await supabase
        .from("questionario_respostas")
        .select("*, respostas_questionario(*)")
        .eq("proposta_id", proposta.id)
      
      if (!errorQuestionariosRespostas && questionariosRespostas && questionariosRespostas.length > 0) {
        console.log("✅ Questionário encontrado em questionario_respostas:", questionariosRespostas.length)
        questionariosData = questionariosRespostas
        
        // Extrair peso e altura do questionário do titular
        const questionarioTitular = questionariosRespostas.find(q => q.pessoa_tipo === "titular")
        if (questionarioTitular && propostaCompleta) {
          console.log("📏 Dados físicos do titular encontrados:", {
            peso: questionarioTitular.peso,
            altura: questionarioTitular.altura
          })
          // Adicionar peso e altura à proposta
          propostaCompleta.peso = questionarioTitular.peso || propostaCompleta.peso
          propostaCompleta.altura = questionarioTitular.altura || propostaCompleta.altura
          setPropostaDetalhada(propostaCompleta)
        }
        
        // Extrair peso e altura dos questionários dos dependentes
        if (dependentesData && dependentesData.length > 0) {
          dependentesData.forEach((dependente, index) => {
            const questionarioDependente = questionariosRespostas.find(q => 
              q.pessoa_tipo === "dependente" && q.pessoa_nome === dependente.nome
            )
            if (questionarioDependente) {
              console.log(`📏 Dados físicos do dependente ${dependente.nome}:`, {
                peso: questionarioDependente.peso,
                altura: questionarioDependente.altura
              })
              dependente.peso = questionarioDependente.peso || dependente.peso
              dependente.altura = questionarioDependente.altura || dependente.altura
            }
          })
          setDependentes([...dependentesData])
        }
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
      console.log("🔍 Debug questionários detalhado:", questionariosData?.map(q => ({
        id: q.id,
        pessoa_tipo: q.pessoa_tipo,
        pessoa_nome: q.pessoa_nome,
        respostas: q.respostas_questionario?.length || 0
      })))
      console.log("=".repeat(60))

    } catch (error) {
      console.error("❌ Erro ao carregar detalhes:", error)
      toast.error("Erro ao carregar detalhes da proposta")
    } finally {
      setLoadingDetalhes(false)
    }
  }

  function iniciarEdicao() {
    console.log("🔍 FUNÇÃO INICIAR EDIÇÃO CHAMADA")
    alert("🔍 FUNÇÃO INICIAR EDIÇÃO CHAMADA")
    console.log("🔍 Debug - Dados da proposta detalhada:", propostaDetalhada)
    console.log("🔍 Estado editMode antes:", editMode)
    
    setEditMode(true)
    console.log("🔍 setEditMode(true) executado")
    setEditData({
      nome: obterNomeCliente(propostaDetalhada),
      email: obterEmailCliente(propostaDetalhada),
      telefone: obterTelefoneCliente(propostaDetalhada),
      cpf: propostaDetalhada.cpf || "",
      rg: propostaDetalhada.rg || "",
      orgao_emissor: propostaDetalhada.orgao_emissor || propostaDetalhada.orgao_expedidor || "",
      cns: propostaDetalhada.cns || propostaDetalhada.cns_cliente || "",
      data_nascimento: propostaDetalhada.data_nascimento || "",
      sexo: propostaDetalhada.sexo || propostaDetalhada.sexo_cliente || "",
      estado_civil: propostaDetalhada.estado_civil || propostaDetalhada.estado_civil_cliente || "",
      uf_nascimento: propostaDetalhada.uf_nascimento || "",
      nome_mae: propostaDetalhada.nome_mae || propostaDetalhada.nome_mae_cliente || ""
    })
  }

  // FUNÇÃO ULTRA SIMPLES - APENAS CAMPOS ESSENCIAIS
  const salvarEdicao = async () => {
    alert("FUNÇÃO SALVAR CHAMADA - ULTRA SIMPLES")
    console.log("FUNÇÃO SALVAR CHAMADA - ULTRA SIMPLES")
    
    try {
      // APENAS os campos mais básicos que certamente existem
      const dadosMinimos = {
        nome: editData.nome || propostaDetalhada.nome || "",
        email: editData.email || propostaDetalhada.email || "",
        telefone: editData.telefone || propostaDetalhada.telefone || ""
      }
      
      console.log("Dados mínimos:", dadosMinimos)
      console.log("ID da proposta:", propostaDetalhada.id)
      
      const { data, error } = await supabase
        .from("propostas_corretores")
        .update(dadosMinimos)
        .eq("id", propostaDetalhada.id)
        .select()

      if (error) {
        console.error("❌ Erro do Supabase:", error)
        toast.error(`Erro ao salvar: ${error.message}`)
        return
      }

      console.log("✅ Dados salvos com sucesso:", data)
      toast.success("Dados atualizados com sucesso!")
      setEditMode(false)
      carregarPropostas()
      
    } catch (error) {
      console.error("❌ Erro geral:", error)
      toast.error(`Erro ao salvar: ${error.message}`)
    }
  }

  function cancelarEdicao() {
    setEditMode(false)
    setEditData({})
  }


  function verificarCadastroCompleto(proposta: any) {
    return proposta.administradora && proposta.data_vencimento && proposta.data_vigencia
  }

  function obterStatusProposta(proposta: any) {
    if (proposta.status === "cadastrado" || proposta.status === "cadastrada") {
      return {
        label: "Cadastrado",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle
      }
    } else if (proposta.status === "aprovada") {
      return {
        label: "Aprovado",
        color: "bg-blue-100 text-blue-800", 
        icon: CheckCircle
      }
    } else {
      return {
        label: proposta.status || "Indefinido",
        color: "bg-gray-100 text-gray-800",
        icon: CheckCircle
      }
    }
  }

  function formatarDataSegura(dataString: any) {
    if (!dataString) return null

    try {
      // Se a data está no formato YYYY-MM-DD, vamos tratá-la como data local
      if (typeof dataString === 'string' && dataString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [ano, mes, dia] = dataString.split('-')
        const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
        return data.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit", 
          year: "numeric",
        })
      }

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

  function calcularIdade(dataNascimento: any) {
    if (!dataNascimento) return "N/A"
    try {
      const hoje = new Date()
      const nascimento = new Date(dataNascimento)
      let idade = hoje.getFullYear() - nascimento.getFullYear()
      const diferencaMes = hoje.getMonth() - nascimento.getMonth()
      if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--
      }
      return `${idade} anos`
    } catch {
      return "N/A"
    }
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

  // Extrair produtos únicos para o filtro
  const produtosUnicos = Array.from(new Set(
    propostas.map(p => p.produto_nome || p.produto || p.sigla_plano || p.plano_nome)
      .filter(produto => produto && produto.trim() !== "")
  )).sort()

  const propostasFiltradas = propostas.filter((proposta) => {
    const nomeCliente = obterNomeCliente(proposta).toLowerCase()
    const emailCliente = obterEmailCliente(proposta).toLowerCase()
    const matchesFiltro = nomeCliente.includes(filtro.toLowerCase()) || emailCliente.includes(filtro.toLowerCase())
    
    // Filtro por produto
    const nomeProduto = proposta.produto_nome || proposta.produto || proposta.sigla_plano || proposta.plano_nome || ""
    const matchesProduto = produtoFiltro === "todos" || nomeProduto === produtoFiltro

    return matchesFiltro && matchesProduto
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
  }, [filtro, produtoFiltro])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm">
        <div className="text-center">
          <div className="loading-corporate mx-auto"></div>
          <span className="block mt-4 loading-text-corporate">Carregando clientes...</span>
          <p className="text-xs text-gray-500 mt-2">Aguarde um momento</p>
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
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight font-sans">Clientes para Cadastro</h1>
            <p className="text-gray-600 mt-1 font-medium">Gerencie clientes aprovados e finalize cadastros</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={carregarPropostas}
              className="bg-gray-700 hover:bg-gray-800 text-white font-bold px-4 py-2 btn-corporate shadow-corporate flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Lista
          </button>
          <button
            onClick={() => setShowModalCadastroManual(true)}
              className="bg-[#168979] hover:bg-[#13786a] text-white font-bold px-4 py-2 btn-corporate shadow-corporate flex items-center gap-2"
          >
            + Adicionar Cliente Manualmente
          </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg">
          <div className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider font-sans">Total</h3>
              <div className="text-3xl font-bold text-[#168979] mt-2">{propostas.length}</div>
        </div>
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-gray-700" />
          </div>
        </div>
          <div className="pb-6 px-6">
            <p className="text-xs text-gray-500 font-medium">Aprovados + Cadastrados</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg">
          <div className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider font-sans">Completos</h3>
              <div className="text-3xl font-bold text-[#168979] mt-2">{propostas.filter((p) => verificarCadastroCompleto(p)).length}</div>
          </div>
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-gray-700" />
            </div>
          </div>
          <div className="pb-6 px-6">
            <p className="text-xs text-gray-500 font-medium">Cadastros finalizados</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg">
          <div className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider font-sans">Pendentes</h3>
              <div className="text-3xl font-bold text-[#168979] mt-2">{propostas.filter((p) => !verificarCadastroCompleto(p)).length}</div>
            </div>
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-gray-700" />
            </div>
          </div>
          <div className="pb-6 px-6">
            <p className="text-xs text-gray-500 font-medium">Aguardando cadastro</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 rounded-lg">
          <div className="flex flex-row items-center justify-between pb-3 pt-6 px-6">
            <div>
              <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wider font-sans">Corretores</h3>
              <div className="text-3xl font-bold text-[#168979] mt-2">{propostas.filter((p) => p.origem === "propostas_corretores").length}</div>
            </div>
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-gray-700" />
            </div>
          </div>
          <div className="pb-6 px-6">
            <p className="text-xs text-gray-500 font-medium">Via corretores</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-lg shadow border border-gray-200">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Buscar por Nome</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
                placeholder="Nome ou email do cliente..."
                className="pl-10 w-full corporate-rounded"
            />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Filtrar por Produto</label>
            <Select value={produtoFiltro} onValueChange={setProdutoFiltro}>
              <SelectTrigger className="corporate-rounded">
                <SelectValue placeholder="Todos os produtos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Produtos</SelectItem>
                {produtosUnicos.map((produto) => (
                  <SelectItem key={produto} value={produto}>
                    {produto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Propostas */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Clientes (Aprovados e Cadastrados)</h2>
            <div className="text-sm text-gray-600">
              Mostrando {indiceInicio + 1}-{Math.min(indiceFim, totalItens)} de {totalItens} clientes
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
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
                  Valor/Data
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administradora/Vigência
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status Cadastro
                </th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {propostasExibidas.map((proposta) => (
                <tr key={proposta.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                      <div className="text-sm font-medium text-gray-900">
                        {obterNomeCliente(proposta)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {proposta.produto_nome || proposta.produto || proposta.sigla_plano || proposta.plano_nome || "Produto não informado"}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{obterEmailCliente(proposta)}</div>
                    <div className="text-sm text-gray-500">
                      {proposta.telefone || proposta.celular || "Telefone não informado"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      {(() => {
                        const valor = proposta.valor || proposta.valor_total || proposta.valor_mensal || proposta.valor_proposta
                        return valor ? formatarMoeda(valor) : "Valor não informado"
                      })()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(proposta.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col">
                    <div className="text-sm text-gray-900">
                      {proposta.administradora || <span className="text-gray-400">-</span>}
                    </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {proposta.data_vigencia ? `Vigência: ${formatarDataSegura(proposta.data_vigencia) || 'Data inválida'}` : ""}
                    </div>
                    <div className="text-xs text-gray-500">
                        {proposta.data_vencimento ? `Venc.: ${formatarDataSegura(proposta.data_vencimento) || 'Data inválida'}` : ""}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {(() => {
                      const status = obterStatusProposta(proposta)
                      const Icon = status.icon
                      return (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <Icon className="h-3 w-3 mr-1" />
                          {status.label}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="px-4 py-4">
                    {verificarCadastroCompleto(proposta) ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Calendar className="h-3 w-3 mr-1" />
                        Pendente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => abrirModalDetalhes(proposta)}
                        className="text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-xs transition-colors"
                      >
                        <Eye className="h-3 w-3 inline mr-1" />
                        Ver
                      </button>

                      {!verificarCadastroCompleto(proposta) && (
                        <button
                          onClick={() => abrirModalCadastro(proposta)}
                          className="text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors text-xs"
                        >
                          <Save className="h-3 w-3 inline mr-1" />
                          Completar Cadastro
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          {propostasExibidas.map((proposta) => (
            <div key={proposta.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
              {/* Header do Card */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 font-sans">
                    {obterNomeCliente(proposta)}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {proposta.produto_nome || proposta.produto || proposta.sigla_plano || proposta.plano_nome || "Produto não informado"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {(() => {
                    const status = obterStatusProposta(proposta)
                    const Icon = status.icon
                    return (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {status.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Informações do Card */}
              <div className="grid grid-cols-1 gap-3 text-sm">
                {/* Contato */}
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-900">{obterEmailCliente(proposta)}</div>
                    <div className="text-xs text-gray-500">
                      {proposta.telefone || proposta.celular || "Telefone não informado"}
                    </div>
                  </div>
                </div>

                {/* Valor e Data */}
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <div className="text-gray-900">
                      {(() => {
                        const valor = proposta.valor || proposta.valor_total || proposta.valor_mensal || proposta.valor_proposta
                        return valor ? formatarMoeda(valor) : "Valor não informado"
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(proposta.created_at).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>

                {/* Administradora */}
                {proposta.administradora && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div className="text-gray-900">{proposta.administradora}</div>
                  </div>
                )}

                {/* Vigência */}
                {proposta.data_vigencia && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-gray-900">
                        Vigência: {formatarDataSegura(proposta.data_vigencia) || 'Data inválida'}
                      </div>
                      {proposta.data_vencimento && (
                        <div className="text-xs text-gray-500">
                          Venc.: {formatarDataSegura(proposta.data_vencimento) || 'Data inválida'}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Status do Cadastro */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">Status do Cadastro:</span>
                  </div>
                  {verificarCadastroCompleto(proposta) ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      <Calendar className="h-3 w-3 mr-1" />
                      Pendente
                    </span>
                  )}
                </div>
              </div>

              {/* Ações */}
              <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => abrirModalDetalhes(proposta)}
                  className="text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded btn-corporate-sm transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Ver Detalhes
                </button>

                {!verificarCadastroCompleto(proposta) && (
                  <button
                    onClick={() => abrirModalCadastro(proposta)}
                    className="text-white bg-[#168979] hover:bg-[#13786a] px-3 py-2 rounded btn-corporate-sm transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Completar Cadastro
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {propostasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">Nenhum cliente aprovado encontrado</div>
            <div className="text-gray-400 text-sm mt-2">
              {filtro || produtoFiltro !== "todos"
                ? "Tente ajustar os filtros de busca"
                : "Nenhuma proposta foi aprovada ainda"}
            </div>
          </div>
        )}

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-700 text-center sm:text-left">
                Página {paginaAtual} de {totalPaginas} • Total: {totalItens} clientes
                <span className="ml-2 px-2 py-1 bg-[#168979] bg-opacity-10 text-[#168979] rounded text-xs font-medium">
                  📄 {totalPaginas} páginas disponíveis
                </span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(Math.max(1, paginaAtual - 1))}
                  disabled={paginaAtual === 1}
                  className="h-8 btn-corporate-sm"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Anterior</span>
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum
                    if (totalPaginas <= 5) {
                      pageNum = i + 1
                    } else if (paginaAtual <= 3) {
                      pageNum = i + 1
                    } else if (paginaAtual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i
                    } else {
                      pageNum = paginaAtual - 2 + i
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={paginaAtual === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPaginaAtual(pageNum)}
                        className={`h-8 w-8 p-0 btn-corporate-sm ${
                          paginaAtual === pageNum 
                            ? 'bg-[#168979] hover:bg-[#13786a] text-white border-[#168979]' 
                            : ''
                        }`}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaginaAtual(Math.min(totalPaginas, paginaAtual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="h-8 btn-corporate-sm"
                >
                  <span className="hidden sm:inline mr-1">Próxima</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      {showModalCadastro && propostaCadastro && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Completar Cadastro</h3>
            <p className="text-gray-600 mb-4">
              Informe os dados para finalizar o cadastro de <strong>{obterNomeCliente(propostaCadastro)}</strong>
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Administradora <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={administradora}
                  onChange={(e) => setAdministradora(e.target.value)}
                  placeholder="Nome da administradora"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={dataVencimento}
                  onChange={(e) => setDataVencimento(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vigência <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  value={dataVigencia}
                  onChange={(e) => setDataVigencia(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModalCadastro(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={finalizarCadastro}
                disabled={saving || !administradora || !dataVencimento || !dataVigencia}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Finalizar Cadastro
                  </>
                )}
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
                <h2 className="text-2xl font-bold text-gray-900">
                  Detalhes da Proposta
                  {editMode && <span className="ml-2 text-sm text-orange-600 font-normal">(Modo de Edição)</span>}
                </h2>
                <div className="flex gap-3">
                  {editMode ? (
                    <>
                      <Button
                        onClick={() => {
                          console.log("🔍 BOTÃO SALVAR CLICADO")
                          alert("🔍 BOTÃO SALVAR CLICADO")
                          salvarEdicao()
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                      <Button
                        onClick={cancelarEdicao}
                        variant="outline"
                      >
                        Cancelar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => {
                          console.log("🔍 BOTÃO EDITAR CLICADO")
                          alert("🔍 BOTÃO EDITAR CLICADO")
                          iniciarEdicao()
                        }}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      {!verificarCadastroCompleto(propostaDetalhada) && (
                        <Button
                          onClick={() => {
                            setShowModalDetalhes(false)
                            abrirModalCadastro(propostaDetalhada)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Completar Cadastro
                        </Button>
                      )}
                    </>
                  )}
                  <Button onClick={() => setShowModalDetalhes(false)} variant="outline">
                    Fechar
                  </Button>
                </div>
              </div>

              {loadingDetalhes ? (
                <div className="flex justify-center items-center h-64 bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <div className="text-center">
                    <div className="loading-corporate mx-auto"></div>
                    <span className="block mt-4 loading-text-corporate">Carregando detalhes...</span>
                    <p className="text-xs text-gray-500 mt-2">Aguarde um momento</p>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="dados" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
                    <TabsTrigger value="documentos">Documentos</TabsTrigger>
                    <TabsTrigger value="saude">Declaração de Saúde</TabsTrigger>
                    <TabsTrigger value="dependentes">Dependentes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dados" className="space-y-6 mt-6">
                    {/* Dados do Titular */}
                  <Card>
                    <CardHeader>
                        <CardTitle>Dados do Titular</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Nome Completo</label>
                            {editMode ? (
                              <Input
                                value={editData.nome || ""}
                                onChange={(e) => setEditData({...editData, nome: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-900 font-medium">{obterNomeCliente(propostaDetalhada)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Email</label>
                            {editMode ? (
                              <Input
                                type="email"
                                value={editData.email || ""}
                                onChange={(e) => setEditData({...editData, email: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                          <p className="text-gray-900">{obterEmailCliente(propostaDetalhada)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Telefone</label>
                            {editMode ? (
                              <Input
                                value={editData.telefone || ""}
                                onChange={(e) => setEditData({...editData, telefone: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-900">{obterTelefoneCliente(propostaDetalhada)}</p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">CPF</label>
                            {editMode ? (
                              <Input
                                value={editData.cpf || ""}
                                onChange={(e) => setEditData({...editData, cpf: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-900">{propostaDetalhada.cpf || "Não informado"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">RG</label>
                            {editMode ? (
                              <Input
                                value={editData.rg || ""}
                                onChange={(e) => setEditData({...editData, rg: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-900">{propostaDetalhada.rg || "Não informado"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Órgão Emissor</label>
                            {editMode ? (
                              <Input
                                value={editData.orgao_emissor || ""}
                                onChange={(e) => setEditData({...editData, orgao_emissor: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-900">{propostaDetalhada.orgao_emissor || propostaDetalhada.orgao_expedidor || "Não informado"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">CNS</label>
                            {editMode ? (
                              <Input
                                value={editData.cns || ""}
                                onChange={(e) => setEditData({...editData, cns: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-900">{propostaDetalhada.cns || propostaDetalhada.cns_cliente || "Não informado"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Data de Nascimento</label>
                            {editMode ? (
                              <Input
                                type="date"
                                value={editData.data_nascimento || ""}
                                onChange={(e) => setEditData({...editData, data_nascimento: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                          <p className="text-gray-900">
                                {propostaDetalhada.data_nascimento
                                  ? formatarDataSegura(propostaDetalhada.data_nascimento)
                                  : "Não informado"}
                          </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600">Idade</label>
                            <p className="text-gray-900">{calcularIdade(propostaDetalhada.data_nascimento)}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Sexo</label>
                            <p className="text-gray-900">{propostaDetalhada.sexo || propostaDetalhada.sexo_cliente || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Estado Civil</label>
                            <p className="text-gray-900">{propostaDetalhada.estado_civil || propostaDetalhada.estado_civil_cliente || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">UF de Nascimento</label>
                            {editMode ? (
                              <Input
                                value={editData.uf_nascimento || ""}
                                onChange={(e) => setEditData({...editData, uf_nascimento: e.target.value})}
                                className="mt-1"
                                placeholder="Ex: SP, RJ, MG..."
                              />
                            ) : (
                              <p className="text-gray-900">{propostaDetalhada.uf_nascimento || "Não informado"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Nome da Mãe</label>
                            {editMode ? (
                              <Input
                                value={editData.nome_mae || ""}
                                onChange={(e) => setEditData({...editData, nome_mae: e.target.value})}
                                className="mt-1"
                              />
                            ) : (
                              <p className="text-gray-900">{propostaDetalhada.nome_mae || propostaDetalhada.nome_mae_cliente || "Não informado"}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Nome do Pai</label>
                            <p className="text-gray-900">{propostaDetalhada.nome_pai || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Nacionalidade</label>
                            <p className="text-gray-900">{propostaDetalhada.nacionalidade || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Profissão</label>
                            <p className="text-gray-900">{propostaDetalhada.profissao || "Não informado"}</p>
                        </div>
                      </div>
                      </CardContent>
                    </Card>

                    {/* Endereço */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Endereço</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-600">Logradouro</label>
                          <p className="text-gray-900">
                              {propostaDetalhada.endereco || "Não informado"}
                              {propostaDetalhada.numero && `, ${propostaDetalhada.numero}`}
                          </p>
                        </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Complemento</label>
                            <p className="text-gray-900">{propostaDetalhada.complemento || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Bairro</label>
                            <p className="text-gray-900">{propostaDetalhada.bairro || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Cidade</label>
                            <p className="text-gray-900">{propostaDetalhada.cidade || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Estado</label>
                            <p className="text-gray-900">
                              {propostaDetalhada.estado || propostaDetalhada.uf || "Não informado"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">CEP</label>
                            <p className="text-gray-900">{propostaDetalhada.cep || "Não informado"}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Informações do Plano */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações do Plano</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Produto</label>
                            <p className="text-gray-900 font-medium">
                              {propostaDetalhada.produto_nome || propostaDetalhada.produto || "Não informado"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Plano</label>
                            <p className="text-gray-900">
                              {propostaDetalhada.plano_nome || propostaDetalhada.sigla_plano || "Não informado"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Cobertura</label>
                            <p className="text-gray-900">{propostaDetalhada.cobertura || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Acomodação</label>
                            <p className="text-gray-900">{propostaDetalhada.acomodacao || "Não informado"}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600">Valor Mensal Total</label>
                            <p className="text-2xl font-bold text-green-600">
                              R$ {calcularValorTotalMensal(propostaDetalhada).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </p>
                            {/* Detalhamento dos valores se houver dependentes */}
                            {(() => {
                              const dependentesArr = parseDependentes(propostaDetalhada)
                              if (dependentesArr && dependentesArr.length > 0) {
                                return (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-xs font-medium text-gray-700 mb-2">Detalhamento:</div>
                                    <div className="text-sm text-gray-700">
                                      <div className="flex justify-between">
                                        <span><b>Titular</b> ({obterNomeCliente(propostaDetalhada)}):</span>
                                        <span>R$ {(() => {
                                          let valorTitular = propostaDetalhada.valor_mensal || propostaDetalhada.valor || propostaDetalhada.valor_total || 0
                                          if (typeof valorTitular !== "number") {
                                            valorTitular = String(valorTitular).replace(/[^\d,\.]/g, "").replace(",", ".")
                                            valorTitular = Number.parseFloat(valorTitular)
                                          }
                                          return (!isNaN(valorTitular) && valorTitular > 0 ? valorTitular : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })
                                        })()}</span>
                                      </div>
                                      {dependentesArr.map((dep: any, idx: number) => {
                                        let valorDep = dep.valor_individual || dep.valor || dep.valor_plano || 0
                                        if (typeof valorDep !== "number") {
                                          valorDep = String(valorDep).replace(/[^\d,\.]/g, "").replace(",", ".")
                                          valorDep = Number.parseFloat(valorDep)
                                        }
                                        return (
                                          <div key={idx} className="flex justify-between">
                                            <span><b>Dependente</b> ({dep.nome || `Dependente ${idx + 1}`}):</span>
                                            <span>R$ {(!isNaN(valorDep) && valorDep > 0 ? valorDep : 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                          </div>
                                        )
                                      })}
                                      <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                                        <span>Total Mensal:</span>
                                        <span>R$ {calcularValorTotalMensal(propostaDetalhada).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados de Cadastro */}
                  {verificarCadastroCompleto(propostaDetalhada) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Dados de Cadastro</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700">Administradora</label>
                            <p className="text-gray-900">{propostaDetalhada.administradora}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Data de Vencimento</label>
                            <p className="text-gray-900">
                                {formatarDataSegura(propostaDetalhada.data_vencimento) || 'Data inválida'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700">Data de Vigência</label>
                            <p className="text-gray-900">
                                {formatarDataSegura(propostaDetalhada.data_vigencia) || 'Data inválida'}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  </TabsContent>

                  <TabsContent value="documentos" className="space-y-6 mt-6">
                    {/* Documentos do Titular */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          Documentos do Titular
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const documentos = obterDocumentosInteligente(propostaDetalhada, "titular")
                          if (!documentos || Object.keys(documentos).length === 0) {
                            return <p className="text-gray-500">Nenhum documento encontrado</p>
                          }
                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(documentos).map(([tipo, url]) => {
                                if (!url) return null
                                const nomeArquivo = `${tipo.replace(/_/g, " ").toUpperCase()}`
                                return (
                                  <div key={tipo} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-gray-700">{nomeArquivo}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(url as string, '_blank')}
                                        className="h-8 w-8 p-0"
                                        title="Visualizar"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>

                    {/* Documentos dos Dependentes */}
                    {dependentes && dependentes.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-green-500" />
                            Documentos dos Dependentes
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {dependentes.map((dependente, index) => {
                              const documentosDependente = obterDocumentosInteligente(propostaDetalhada, "dependente")
                              return (
                                <div key={dependente.id || index} className="border border-gray-200 rounded-lg p-4">
                                  <h4 className="font-medium text-gray-900 mb-3">
                                    {dependente.nome || `Dependente ${index + 1}`}
                                  </h4>
                                  {documentosDependente && Object.keys(documentosDependente).length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                      {Object.entries(documentosDependente).map(([tipo, url]) => {
                                        if (!url) return null
                                        const nomeArquivo = `${tipo.replace(/_/g, " ").toUpperCase()}`
                                        return (
                                          <div key={tipo} className="border border-gray-200 rounded-lg p-2">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-medium text-gray-700">{nomeArquivo}</span>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(url as string, '_blank')}
                                                className="h-6 w-6 p-0"
                                                title="Visualizar"
                                              >
                                                <Eye className="h-3 w-3" />
                                              </Button>
                                            </div>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-gray-500 text-sm">Nenhum documento encontrado</p>
                    )}
                  </div>
                              )
                            })}
                </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="saude" className="space-y-6 mt-6">
                    {/* Declaração de Saúde */}
                    {questionariosSaude && questionariosSaude.length > 0 ? (
                      questionariosSaude.map((q, idx) => (
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
                                  <div className="text-sm text-gray-600 mb-2">{resposta.pergunta_texto || resposta.pergunta || "Pergunta não disponível"}</div>
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
                      ))
                    ) : (
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
                    )}
                  </TabsContent>

                  <TabsContent value="dependentes" className="space-y-6 mt-6">
                    {/* Dependentes */}
                    {dependentes && dependentes.length > 0 ? (
                      dependentes.map((dependente, idx) => (
                        <Card key={dependente.id || idx}>
                          <CardHeader>
                            <CardTitle>Dependente {idx + 1}: {dependente.nome || "Nome não informado"}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Nome Completo</label>
                                <p className="text-gray-900">{dependente.nome || "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">CPF</label>
                                <p className="text-gray-900">{dependente.cpf || "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Data de Nascimento</label>
                                <p className="text-gray-900">
                                  {dependente.data_nascimento
                                    ? formatarDataSegura(dependente.data_nascimento)
                                    : "Não informado"}
                                </p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Idade</label>
                                <p className="text-gray-900">{calcularIdade(dependente.data_nascimento)}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Parentesco</label>
                                <p className="text-gray-900">{dependente.parentesco || "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Sexo</label>
                                <p className="text-gray-900">{dependente.sexo || "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">RG</label>
                                <p className="text-gray-900">{dependente.rg || "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">CNS</label>
                                <p className="text-gray-900">{dependente.cns || "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Nome da Mãe</label>
                                <p className="text-gray-900">{dependente.nome_mae || "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Peso</label>
                                <p className="text-gray-900">{dependente.peso ? `${dependente.peso} kg` : "Não informado"}</p>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-600">Altura</label>
                                <p className="text-gray-900">{dependente.altura ? `${dependente.altura} cm` : "Não informado"}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle>Dependentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-gray-500">Nenhum dependente cadastrado</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de cadastro manual */}
      {showModalCadastroManual && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-4xl mx-2 relative max-h-[95vh] overflow-y-auto">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setShowModalCadastroManual(false)}
              aria-label="Fechar"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center">Cadastro Manual de Cliente</h2>
            <form onSubmit={handleCadastroManual} className="space-y-6">
              {/* Dados do Titular */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Dados do Titular</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome *</label>
                    <Input value={formManual.nome} onChange={e => setFormManual({ ...formManual, nome: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF *</label>
                    <Input value={formManual.cpf} onChange={e => setFormManual({ ...formManual, cpf: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Nascimento *</label>
                    <Input type="date" value={formManual.data_nascimento} onChange={e => setFormManual({ ...formManual, data_nascimento: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-mail *</label>
                    <Input type="email" value={formManual.email} onChange={e => setFormManual({ ...formManual, email: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Telefone *</label>
                    <Input value={formManual.telefone} onChange={e => setFormManual({ ...formManual, telefone: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNS *</label>
                    <Input value={formManual.cns} onChange={e => setFormManual({ ...formManual, cns: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RG *</label>
                    <Input value={formManual.rg} onChange={e => setFormManual({ ...formManual, rg: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Órgão Emissor *</label>
                    <Input value={formManual.orgao_emissor} onChange={e => setFormManual({ ...formManual, orgao_emissor: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome da Mãe *</label>
                    <Input value={formManual.nome_mae} onChange={e => setFormManual({ ...formManual, nome_mae: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sexo *</label>
                    <Select value={formManual.sexo} onValueChange={v => setFormManual({ ...formManual, sexo: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Feminino">Feminino</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">UF de Nascimento *</label>
                    <Input value={formManual.uf_nascimento} onChange={e => setFormManual({ ...formManual, uf_nascimento: e.target.value })} required />
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CEP *</label>
                    <Input value={formManual.cep} onChange={e => setFormManual({ ...formManual, cep: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Endereço *</label>
                    <Input value={formManual.endereco} onChange={e => setFormManual({ ...formManual, endereco: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número *</label>
                    <Input value={formManual.numero} onChange={e => setFormManual({ ...formManual, numero: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Complemento</label>
                    <Input value={formManual.complemento} onChange={e => setFormManual({ ...formManual, complemento: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bairro *</label>
                    <Input value={formManual.bairro} onChange={e => setFormManual({ ...formManual, bairro: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cidade *</label>
                    <Input value={formManual.cidade} onChange={e => setFormManual({ ...formManual, cidade: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado *</label>
                    <Input value={formManual.estado} onChange={e => setFormManual({ ...formManual, estado: e.target.value })} required />
                  </div>
                </div>
              </div>

              {/* Dados do Plano */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Dados do Plano</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Produto *</label>
                    <Input value={formManual.produto_id} onChange={e => setFormManual({ ...formManual, produto_id: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tabela de Preços</label>
                    <Input value={formManual.tabela_id} onChange={e => setFormManual({ ...formManual, tabela_id: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cobertura *</label>
                    <Select value={formManual.cobertura} onValueChange={v => setFormManual({ ...formManual, cobertura: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nacional">Nacional</SelectItem>
                        <SelectItem value="Estadual">Estadual</SelectItem>
                        <SelectItem value="Regional">Regional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Acomodação *</label>
                    <Select value={formManual.acomodacao} onValueChange={v => setFormManual({ ...formManual, acomodacao: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Enfermaria">Enfermaria</SelectItem>
                        <SelectItem value="Apartamento">Apartamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Código do Plano *</label>
                    <Input value={formManual.sigla_plano} onChange={e => setFormManual({ ...formManual, sigla_plano: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Valor *</label>
                    <Input value={formManual.valor} onChange={e => setFormManual({ ...formManual, valor: e.target.value })} required />
                  </div>
                </div>
              </div>

              {/* Anexos do Titular */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Anexos do Titular</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RG - Frente</label>
                    <Input type="file" accept="image/*,.pdf" onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFormManual({
                          ...formManual,
                          anexos: { ...formManual.anexos, rg_frente: e.target.files[0] }
                        })
                      }
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">RG - Verso</label>
                    <Input type="file" accept="image/*,.pdf" onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFormManual({
                          ...formManual,
                          anexos: { ...formManual.anexos, rg_verso: e.target.files[0] }
                        })
                      }
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <Input type="file" accept="image/*,.pdf" onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFormManual({
                          ...formManual,
                          anexos: { ...formManual.anexos, cpf: e.target.files[0] }
                        })
                      }
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Comprovante de Residência</label>
                    <Input type="file" accept="image/*,.pdf" onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFormManual({
                          ...formManual,
                          anexos: { ...formManual.anexos, comprovante_residencia: e.target.files[0] }
                        })
                      }
                    }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CNS</label>
                    <Input type="file" accept="image/*,.pdf" onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        setFormManual({
                          ...formManual,
                          anexos: { ...formManual.anexos, cns: e.target.files[0] }
                        })
                      }
                    }} />
                  </div>
                </div>
              </div>

              {/* Dependentes */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Dependentes</h3>
                  <Button
                    type="button"
                    onClick={() => {
                      const novoDependente = {
                        nome: "",
                        cpf: "",
                        rg: "",
                        data_nascimento: "",
                        cns: "",
                        parentesco: "",
                        nome_mae: "",
                        sexo: "Masculino",
                        uf_nascimento: "SP",
                        orgao_emissor: "",
                        anexos: {
                          rg_frente: null,
                          rg_verso: null,
                          comprovante_residencia: null,
                        }
                      }
                      setFormManual({
                        ...formManual,
                        dependentes: [...formManual.dependentes, novoDependente],
                        anexosDependentes: [...formManual.anexosDependentes, {}]
                      })
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    + Adicionar Dependente
                  </Button>
                </div>
                {formManual.dependentes.map((dependente, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-700">Dependente {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => {
                          const novosDependentes = formManual.dependentes.filter((_, i) => i !== index)
                          const novosAnexos = formManual.anexosDependentes.filter((_, i) => i !== index)
                          setFormManual({
                            ...formManual,
                            dependentes: novosDependentes,
                            anexosDependentes: novosAnexos
                          })
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Remover
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome *</label>
                        <Input value={dependente.nome} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].nome = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">CPF *</label>
                        <Input value={dependente.cpf} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].cpf = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">RG *</label>
                        <Input value={dependente.rg} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].rg = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data de Nascimento *</label>
                        <Input type="date" value={dependente.data_nascimento} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].data_nascimento = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">CNS *</label>
                        <Input value={dependente.cns} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].cns = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Parentesco *</label>
                        <Input value={dependente.parentesco} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].parentesco = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome da Mãe *</label>
                        <Input value={dependente.nome_mae} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].nome_mae = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sexo *</label>
                        <Select value={dependente.sexo} onValueChange={v => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].sexo = v
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">UF de Nascimento *</label>
                        <Input value={dependente.uf_nascimento} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].uf_nascimento = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Órgão Emissor *</label>
                        <Input value={dependente.orgao_emissor} onChange={e => {
                          const novosDependentes = [...formManual.dependentes]
                          novosDependentes[index].orgao_emissor = e.target.value
                          setFormManual({ ...formManual, dependentes: novosDependentes })
                        }} required />
                      </div>
                    </div>
                    {/* Anexos do Dependente */}
                    <div className="mt-4">
                      <h5 className="font-medium text-gray-700 mb-2">Anexos do Dependente</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">RG - Frente</label>
                          <Input type="file" accept="image/*,.pdf" onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              const novosAnexos = [...formManual.anexosDependentes]
                              if (!novosAnexos[index]) novosAnexos[index] = {}
                              novosAnexos[index].rg_frente = e.target.files[0]
                              setFormManual({ ...formManual, anexosDependentes: novosAnexos })
                            }
                          }} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">RG - Verso</label>
                          <Input type="file" accept="image/*,.pdf" onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              const novosAnexos = [...formManual.anexosDependentes]
                              if (!novosAnexos[index]) novosAnexos[index] = {}
                              novosAnexos[index].rg_verso = e.target.files[0]
                              setFormManual({ ...formManual, anexosDependentes: novosAnexos })
                            }
                          }} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Comprovante de Residência</label>
                          <Input type="file" accept="image/*,.pdf" onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              const novosAnexos = [...formManual.anexosDependentes]
                              if (!novosAnexos[index]) novosAnexos[index] = {}
                              novosAnexos[index].comprovante_residencia = e.target.files[0]
                              setFormManual({ ...formManual, anexosDependentes: novosAnexos })
                            }
                          }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dados de Cadastro */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Dados de Cadastro</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Corretor Responsável *</label>
                    <Select value={formManual.corretor_id} onValueChange={v => setFormManual({ ...formManual, corretor_id: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o corretor" />
                      </SelectTrigger>
                      <SelectContent>
                        {corretoresDisponiveis.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.nome} ({c.email})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Administradora *</label>
                    <Input value={formManual.administradora} onChange={e => setFormManual({ ...formManual, administradora: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Vigência *</label>
                    <Input type="date" value={formManual.data_vigencia} onChange={e => setFormManual({ ...formManual, data_vigencia: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Vencimento *</label>
                    <Input type="date" value={formManual.data_vencimento} onChange={e => setFormManual({ ...formManual, data_vencimento: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Cadastro *</label>
                    <Input type="date" value={formManual.data_cadastro} onChange={e => setFormManual({ ...formManual, data_cadastro: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status *</label>
                    <Select value={formManual.status} onValueChange={v => setFormManual({ ...formManual, status: v })} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cadastrado">Cadastrado</SelectItem>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="cancelado">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Observações</h3>
                <Textarea
                  value={formManual.observacoes}
                  onChange={e => setFormManual({ ...formManual, observacoes: e.target.value })}
                  placeholder="Digite observações adicionais..."
                  rows={4}
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModalCadastroManual(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-700 hover:bg-green-800 text-white" disabled={uploading}>
                  {uploading ? "Salvando..." : "Salvar Cadastro"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 