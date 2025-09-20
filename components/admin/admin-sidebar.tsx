"use client"

import { Button } from "@/components/ui/button"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Menu,
  X,
  Table,
  Home,
  Users,
  ChevronDown,
  ChevronRight,
  FileText,
  ChevronsLeft,
  ChevronsRight,
  Building2,
  Package,
  DollarSign,
  UserCheck,
  ClipboardList,
  CheckCircle,
  UserPlus,
} from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import { signOutAdmin } from "@/lib/supabase-auth"

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [corretoresExpanded, setCorretoresExpanded] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const avatarUrl = "" // Replace with actual avatar URL if available
  const corretor = { email: "admin@example.com" } // Replace with actual corretor data
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Hook de permissões
  const { podeVisualizar, isMaster } = usePermissions()

  const getInitials = (name: string | undefined) => {
    if (!name) return ""
    const nameParts = name.split(" ")
    let initials = ""
    for (let i = 0; i < nameParts.length; i++) {
      initials += nameParts[i].charAt(0).toUpperCase()
    }
    return initials
  }

  // Detectar se é mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Verificar inicialmente
    checkIfMobile()

    // Adicionar listener para redimensionamento
    window.addEventListener("resize", checkIfMobile)

    // Limpar listener
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  // Fechar sidebar automaticamente após navegação em mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    }
  }, [pathname, isMobile])

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    if (isMobile) {
      setIsOpen(false)
    }
  }

  const toggleCorretoresSection = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isCollapsed) {
      setCorretoresExpanded(!corretoresExpanded)
    }
  }

  const isActive = (path: string) => {
    return pathname === path
  }

  const isCorretoresSection = () => {
    return (
      pathname.includes("/admin/corretores") ||
      pathname.includes("/admin/produtos-corretores") ||
      pathname.includes("/admin/comissoes")
    )
  }

  // Função para lidar com o logout
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await signOutAdmin()
      router.push("/admin/login")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
    // Quando colapsar, sempre expandir a seção de corretores para mostrar os ícones
    if (!isCollapsed) {
      setCorretoresExpanded(true)
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-4 left-4 z-50 md:hidden">
        <button onClick={toggleSidebar} className="p-2 corporate-rounded bg-white shadow-corporate text-gray-700 hover:bg-gray-100" aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay para mobile */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={closeSidebar}></div>}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out ${
          isOpen
            ? isCollapsed
              ? "w-16 translate-x-0"
              : "w-64 translate-x-0"
            : isCollapsed
              ? "w-16 -translate-x-full"
              : "w-64 -translate-x-full"
        } md:translate-x-0 ${isCollapsed ? "md:w-16" : "md:w-64 lg:w-72"}`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between h-16 border-b border-gray-200 px-4 bg-white">
            {!isCollapsed && (
              <Link
                href="/admin"
                className="flex items-center gap-2 font-bold transition-colors hover:bg-transparent text-gray-900 font-sans"
              >
                <span className="text-lg">Portal Admin</span>
              </Link>
            )}
            <Button onClick={toggleCollapse} variant="ghost" className="p-1 hover:bg-gray-100 hidden md:flex text-gray-700" size="sm">
              {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto py-2">
            <ul className="space-y-1">
              {podeVisualizar("dashboard") && (
              <li>
                <Link
                  href="/admin"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                    isActive("/admin") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                  )}
                  onClick={closeSidebar}
                  title={isCollapsed ? "Dashboard" : ""}
                >
                  <Home className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Dashboard</span>}
                </Link>
              </li>
              )}
              {podeVisualizar("leads") && (
              <li>
                <Link
                  href="/admin/leads"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                    isActive("/admin/leads") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                  )}
                  onClick={closeSidebar}
                  title={isCollapsed ? "Leads" : ""}
                >
                  <Users className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Leads</span>}
                </Link>
              </li>
              )}
              {podeVisualizar("tabelas") && (
              <li>
                <Link
                  href="/admin/tabelas"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                    isActive("/admin/tabelas") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                  )}
                  onClick={closeSidebar}
                  title={isCollapsed ? "Tabelas de Preços" : ""}
                >
                  <Table className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Tabelas de Preços</span>}
                </Link>
              </li>
              )}
              {podeVisualizar("modelos-propostas") && (
              <li>
                <Link
                  href="/admin/modelos-propostas"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                    isActive("/admin/modelos-propostas") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                  )}
                  onClick={closeSidebar}
                  title={isCollapsed ? "Modelo de Propostas" : ""}
                >
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Modelo de Propostas</span>}
                </Link>
              </li>
              )}
              {podeVisualizar("propostas") && (
              <li>
                <Link
                  href="/admin/propostas"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                    isActive("/admin/propostas") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                  )}
                  onClick={closeSidebar}
                  title={isCollapsed ? "Propostas Recebidas" : ""}
                >
                  <FileText className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Propostas Recebidas</span>}
                </Link>
              </li>
              )}
              {podeVisualizar("em-analise") && (
              <li>
                <Link
                  href="/admin/em-analise"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                    isActive("/admin/em-analise") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                  )}
                  onClick={closeSidebar}
                  title={isCollapsed ? "Em Análise" : ""}
                >
                  <ClipboardList className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Em Análise</span>}
                </Link>
              </li>
              )}
              {podeVisualizar("cadastrado") && (
              <li>
                <Link
                  href="/admin/cadastrado"
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                    isActive("/admin/cadastrado") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                  )}
                  onClick={closeSidebar}
                  title={isCollapsed ? "Cadastrados" : ""}
                >
                  <UserPlus className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span>Cadastrados</span>}
                </Link>
              </li>
              )}

              {/* Seção de Corretores com expansão/colapso */}
              <li className="pt-3 mt-3">
                {!isCollapsed ? (
                  <button
                    onClick={toggleCorretoresSection}
                    className={`flex items-center justify-between w-full p-2 text-base font-normal rounded-lg hover:bg-white/10 ${
                      isCorretoresSection() ? "bg-white/10 font-medium" : ""
                    }`}
                  >
                    <div className="flex items-center">
                      <Building2 className="w-5 h-5 text-white flex-shrink-0" />
                      <span className="ml-3">Corretores</span>
                    </div>
                    {corretoresExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <Link
                    href="/admin/corretores"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-white hover:bg-white/10 text-white/80"
                    title="Corretores"
                  >
                    <Building2 className="w-5 h-5 flex-shrink-0" />
                  </Link>
                )}

                {/* Submenu de Corretores */}
                {(corretoresExpanded || isCollapsed) && (
                  <ul className={`${isCollapsed ? "space-y-1" : "pl-6 mt-1 space-y-1"}`}>
                    <li>
                      <Link
                        href="/admin/corretores"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                          isActive("/admin/corretores")
                            ? "bg-[#168979] text-white shadow-lg"
                            : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                        )}
                        onClick={closeSidebar}
                        title={isCollapsed ? "Corretores" : ""}
                      >
                        <UserCheck className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">Corretores</span>}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/produtos-corretores"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                          isActive("/admin/produtos-corretores")
                            ? "bg-[#168979] text-white shadow-lg"
                            : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                        )}
                        onClick={closeSidebar}
                        title={isCollapsed ? "Produtos dos Corretores" : ""}
                      >
                        <Package className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">Produtos</span>}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/admin/comissoes"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-4 py-3 transition-all duration-200 font-bold font-sans mx-2",
                          isActive("/admin/comissoes") ? "bg-[#168979] text-white shadow-lg" : "text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm",
                        )}
                        onClick={closeSidebar}
                        title={isCollapsed ? "Comissões" : ""}
                      >
                        <DollarSign className="h-5 w-5 flex-shrink-0" />
                        {!isCollapsed && <span className="text-sm">Comissões</span>}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </nav>

          {/* Footer com informações do usuário */}
        </div>
      </aside>

      {/* Content - adjusted to give space to the sidebar */}
      <div className={`transition-all duration-300 ${isCollapsed ? "md:ml-16" : "md:ml-64 lg:ml-72"}`}>
        {/* Este div é apenas para empurrar o conteúdo para a direita em telas maiores */}
      </div>
    </>
  )
}
