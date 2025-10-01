// Versão compatível da função cancelarProposta
// Esta versão funciona com as colunas existentes no banco

export async function cancelarPropostaCompativel(id, motivo) {
  try {
    console.log(`🚫 Cancelando proposta ${id}`)
    
    // Primeira tentativa: usar colunas específicas de cancelamento
    const dadosAtualizacao = {
      status: "cancelada",
      motivo_cancelamento: motivo || "Cancelada pelo administrador",
      data_cancelamento: new Date().toISOString(),
    }

    const { error } = await supabase.from("propostas").update(dadosAtualizacao).eq("id", id)

    if (error) {
      console.log("🔄 Primeira tentativa falhou, tentando com colunas existentes...")
      
      // Segunda tentativa: usar colunas existentes
      const dadosCompativel = {
        status: "cancelada",
        motivo_rejeicao: motivo || "Cancelada pelo administrador",
      }

      const { error: error2 } = await supabase
        .from("propostas")
        .update(dadosCompativel)
        .eq("id", id)

      if (error2) {
        console.error("❌ Erro ao cancelar proposta:", error2)
        return false
      }

      console.log("✅ Proposta cancelada com sucesso (versão compatível)")
      return true
    }

    console.log("✅ Proposta cancelada com sucesso")
    return true
  } catch (error) {
    console.error("❌ Erro inesperado ao cancelar proposta:", error)
    return false
  }
}
