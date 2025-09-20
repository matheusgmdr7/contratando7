export interface TabelaPreco {
  id: string | number
  titulo: string
  descricao?: string | null
  operadora?: string | null
  tipo_plano?: string | null
  segmentacao?: string | null
  corretora?: string | null // Adicionado campo corretora
  abrangencia?: string | null // NOVO CAMPO
  ativo: boolean
  created_at: string
  updated_at?: string | null
}

export interface TabelaPrecoFaixa {
  id: string | number
  tabela_id: string | number
  faixa_etaria: string
  valor: number
  created_at: string
}

export interface TabelaPrecoDetalhada {
  tabela: TabelaPreco
  faixas: TabelaPrecoFaixa[]
}

export interface TabelaProduto {
  relacao_id: string | number
  tabela_id: string | number
  tabela_titulo: string
  segmentacao: string
  descricao?: string
}

export interface CriarTabelaData {
  titulo: string
  descricao?: string
  operadora?: string
  tipo_plano?: string
  segmentacao?: string
  corretora?: string // Adicionado campo corretora
  abrangencia?: string // NOVO CAMPO
  ativo?: boolean
}

export interface VincularTabelaData {
  produto_id: string | number
  tabela_id: string | number
  segmentacao: string
  descricao?: string
}
