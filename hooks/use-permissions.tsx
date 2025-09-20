"use client"

import { useState, useEffect } from "react"

interface Permissions {
  podeVisualizar: (recurso: string) => boolean
  isMaster: boolean
}

export function usePermissions(): Permissions {
  const [isMaster, setIsMaster] = useState(true) // Por enquanto, assume admin master

  useEffect(() => {
    // Aqui você pode implementar a lógica real de verificação de permissões
    // Por exemplo, verificar o tipo de usuário logado no Supabase
    const verificarPermissoes = async () => {
      try {
        // Implementar lógica de verificação de permissões aqui
        // Por enquanto, assume que é master admin
        setIsMaster(true)
      } catch (error) {
        console.error("Erro ao verificar permissões:", error)
        setIsMaster(false)
      }
    }

    verificarPermissoes()
  }, [])

  const podeVisualizar = (recurso: string): boolean => {
    // Por enquanto, permite visualizar tudo se for master
    // Você pode implementar lógica mais específica aqui
    if (isMaster) return true
    
    // Implementar regras específicas por recurso
    const permissoes = {
      'propostas': true,
      'corretores': true,
      'usuarios': true,
      'tabelas': true,
      'produtos': true,
      'vendas': true,
      'comissoes': true,
      'ferramentas': true,
    }
    
    return permissoes[recurso as keyof typeof permissoes] || false
  }

  return {
    podeVisualizar,
    isMaster
  }
}
