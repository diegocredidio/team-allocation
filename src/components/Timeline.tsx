"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { addDays, format, eachDayOfInterval, parseISO, differenceInDays, isSameDay, getWeek, getYear } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useStore } from "../store"
import { TimelineHeader } from "./TimelineHeader"
import { TimelineRow } from "./TimelineRow"
import { useAuth } from "../context/AuthContext"

// Definir uma largura mínima para cada célula de dia
export const DAY_CELL_WIDTH = 40 // pixels
// Largura da coluna de nomes (aumentada em 30%)
export const NAME_COLUMN_WIDTH = 260 // 200px * 1.3 = 260px
// Quantidade inicial de dias a mostrar (3 meses)
const INITIAL_DAYS_TO_SHOW = 90
// Quantidade de dias a adicionar em cada carregamento
const DAYS_INCREMENT = 30
// Threshold para carregar mais dias (porcentagem do scroll - 80% significa que quando o usuário
// estiver a 20% do final, carregaremos mais dias)
const LOAD_MORE_THRESHOLD = 0.8

export function Timeline() {
  const { user } = useAuth()
  const { teamMembers, allocations, projects, updateAllocation, addAllocation, removeAllocation } = useStore()
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || "")
  const timelineRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [cellWidth, setCellWidth] = useState(DAY_CELL_WIDTH)
  const [cellHeight, setCellHeight] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Estado para controlar quantos dias estamos mostrando
  const [daysToShow, setDaysToShow] = useState(INITIAL_DAYS_TO_SHOW)
  // Estado para monitorar se estamos carregando mais dias
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Dragging state
  const [dragState, setDragState] = useState<{
    type: "move" | "resize-start" | "resize-end"
    allocationId: string
    startX: number
    startY: number
    originalAllocation: any
    currentDeltaX: number
    currentDeltaY: number
    previewUpdates: any
  } | null>(null)

  // Selected allocation for controls
  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null)

  // Update selected project when projects change
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0].id)
    }
  }, [projects, selectedProject])

  const today = new Date()
  const startDate = today

  // Gerar dias com base no estado daysToShow
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, daysToShow - 1),
  })

  // Função para carregar mais dias quando o usuário rolar para a direita
  const loadMoreDays = useCallback(() => {
    if (isLoadingMore) return

    setIsLoadingMore(true)

    // Use setTimeout para evitar que a UI congele durante a atualização
    setTimeout(() => {
      setDaysToShow((prev) => prev + DAYS_INCREMENT)
      setIsLoadingMore(false)
    }, 100)
  }, [isLoadingMore])

  // Monitorar o scroll horizontal
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return

      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current

      // Calcular a posição de scroll relativa (0 a 1)
      const scrollPosition = scrollLeft / (scrollWidth - clientWidth)

      // Se o usuário estiver perto do final, carregar mais dias
      if (scrollPosition > LOAD_MORE_THRESHOLD) {
        loadMoreDays()
      }
    }

    const scrollContainer = scrollContainerRef.current
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll)
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll)
      }
    }
  }, [loadMoreDays])

  // Measure cell dimensions
  useEffect(() => {
    if (timelineRef.current) {
      const cells = timelineRef.current.querySelectorAll(".day-cell")
      if (cells.length > 0) {
        const rect = cells[0].getBoundingClientRect()
        setCellWidth(rect.width)
        setCellHeight(rect.height)
      }
    }
  }, [daysToShow]) // Atualizar quando daysToShow mudar

  // Handle mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !cellWidth || !cellHeight) return

      const { type, allocationId, startX, startY, originalAllocation } = dragState

      // Calculate delta in cells
      const deltaXCells = Math.round((e.clientX - startX) / cellWidth)
      const deltaYCells = Math.round((e.clientY - startY) / cellHeight)

      // Store current delta for use in mouseup
      let previewUpdates: any = {}

      if (type === "move") {
        // Move the allocation
        if (deltaXCells !== 0 || deltaYCells !== 0) {
          // Find new team member
          let newTeamMemberId = originalAllocation.teamMemberId
          if (deltaYCells !== 0) {
            const currentIndex = teamMembers.findIndex((m) => m.id === originalAllocation.teamMemberId)
            const newIndex = Math.max(0, Math.min(teamMembers.length - 1, currentIndex + deltaYCells))
            newTeamMemberId = teamMembers[newIndex].id
          }

          // Calculate new dates
          const startDateObj = parseISO(originalAllocation.startDate)
          const newStartDate = format(addDays(startDateObj, deltaXCells), "yyyy-MM-dd")
          const durationDays = differenceInDays(parseISO(originalAllocation.endDate), startDateObj)
          const newEndDate = format(addDays(parseISO(newStartDate), durationDays), "yyyy-MM-dd")

          previewUpdates = {
            teamMemberId: newTeamMemberId,
            startDate: newStartDate,
            endDate: newEndDate,
          }
        }
      } else if (type === "resize-start") {
        // Resize the start of the allocation
        if (deltaXCells !== 0) {
          const startDateObj = parseISO(originalAllocation.startDate)
          const newStartDate = format(addDays(startDateObj, deltaXCells), "yyyy-MM-dd")
          const endDateObj = parseISO(originalAllocation.endDate)

          // Don't allow start date to go past end date
          if (parseISO(newStartDate) < endDateObj) {
            previewUpdates = { startDate: newStartDate }
          }
        }
      } else if (type === "resize-end") {
        // Resize the end of the allocation
        if (deltaXCells !== 0) {
          const endDateObj = parseISO(originalAllocation.endDate)
          const newEndDate = format(addDays(endDateObj, deltaXCells), "yyyy-MM-dd")
          const startDateObj = parseISO(originalAllocation.startDate)

          // Don't allow end date to go before start date
          if (parseISO(newEndDate) > startDateObj) {
            previewUpdates = { endDate: newEndDate }
          }
        }
      }

      // Update drag state with preview updates
      setDragState({
        ...dragState,
        currentDeltaX: deltaXCells,
        currentDeltaY: deltaYCells,
        previewUpdates,
      })
    }

    const handleMouseUp = async () => {
      if (!dragState) return

      const { allocationId, previewUpdates } = dragState

      // Only update if there are actual changes
      if (previewUpdates && Object.keys(previewUpdates).length > 0) {
        setIsUpdating(true)
        try {
          await updateAllocation(allocationId, previewUpdates)
          console.log("Allocation updated successfully", previewUpdates)
        } catch (err) {
          setError("Failed to update allocation. Please try again.")
          console.error(err)
        } finally {
          setIsUpdating(false)
        }
      }

      setDragState(null)
    }

    if (dragState) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragState, cellWidth, cellHeight, teamMembers, updateAllocation])

  // Adicionar event listener para tecla Delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verificar se a tecla pressionada é Delete ou Backspace
      if ((e.key === "Delete" || e.key === "Backspace") && selectedAllocation) {
        // Prevenir comportamento padrão (como navegação para trás no caso do Backspace)
        e.preventDefault()
        // Deletar a alocação selecionada
        removeAllocation(selectedAllocation).catch((err) => {
          setError("Failed to remove allocation. Please try again.")
          console.error(err)
        })
        // Limpar a seleção
        setSelectedAllocation(null)
      }
    }

    // Adicionar o event listener
    document.addEventListener("keydown", handleKeyDown)

    // Remover o event listener quando o componente for desmontado
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [selectedAllocation, removeAllocation])

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize-start" | "resize-end", allocation: any) => {
    e.preventDefault()
    e.stopPropagation()

    setDragState({
      type,
      allocationId: allocation.id,
      startX: e.clientX,
      startY: e.clientY,
      originalAllocation: { ...allocation },
      currentDeltaX: 0,
      currentDeltaY: 0,
      previewUpdates: {},
    })
  }

  const handleCreateAllocation = async (teamMemberId: string, dateStr: string) => {
    if (!selectedProject) {
      setError("Please select a project first")
      return
    }

    if (!user) {
      setError("You must be logged in to create allocations")
      return
    }

    try {
      await addAllocation({
        teamMemberId,
        projectId: selectedProject,
        startDate: dateStr,
        endDate: format(addDays(parseISO(dateStr), 4), "yyyy-MM-dd"), // Default to 5 days
        percentage: 100,
      })
    } catch (err) {
      setError("Failed to create allocation. Please try again.")
      console.error(err)
    }
  }

  const handleSetPercentage = async (allocationId: string, percentage: number) => {
    try {
      setIsUpdating(true)
      await updateAllocation(allocationId, { percentage })
      console.log("Allocation percentage updated successfully")
    } catch (err) {
      setError("Failed to update allocation percentage. Please try again.")
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAllocation = async (allocationId: string) => {
    try {
      await removeAllocation(allocationId)
      if (selectedAllocation === allocationId) {
        setSelectedAllocation(null)
      }
    } catch (err) {
      setError("Failed to delete allocation. Please try again.")
      console.error(err)
    }
  }

  // Function to check if a cell has an allocation
  const getCellAllocation = (teamMemberId: string, day: Date) => {
    // If we're dragging, apply preview updates for the dragged allocation
    if (dragState && dragState.previewUpdates) {
      const allocationBeingDragged = allocations.find((a) => a.id === dragState.allocationId)

      if (allocationBeingDragged) {
        // Create a temporary allocation with preview updates
        const tempAllocation = {
          ...allocationBeingDragged,
          ...dragState.previewUpdates,
        }

        // Check if this temporary allocation matches the current cell
        const startDate = parseISO(tempAllocation.startDate)
        const endDate = parseISO(tempAllocation.endDate)

        if (tempAllocation.teamMemberId === teamMemberId && day >= startDate && day <= endDate) {
          return tempAllocation
        }

        // If this is the original position and we're moving, don't show it
        if (
          dragState.type === "move" &&
          allocationBeingDragged.teamMemberId === teamMemberId &&
          day >= parseISO(allocationBeingDragged.startDate) &&
          day <= parseISO(allocationBeingDragged.endDate)
        ) {
          return null
        }
      }
    }

    // Normal case - find allocation that matches this cell
    return allocations.find((allocation) => {
      // Skip the allocation being dragged if we're in drag mode
      if (dragState && allocation.id === dragState.allocationId) {
        return false
      }

      const startDate = parseISO(allocation.startDate)
      const endDate = parseISO(allocation.endDate)

      return allocation.teamMemberId === teamMemberId && day >= startDate && day <= endDate
    })
  }

  // Function to check if this is the start day of an allocation
  const isStartDay = (allocation: any, day: Date) => {
    return isSameDay(parseISO(allocation.startDate), day)
  }

  // Agrupar dias por mês para mostrar cabeçalhos de mês
  const daysByMonth: { [key: string]: Date[] } = {}
  days.forEach((day) => {
    const monthKey = format(day, "yyyy-MM")
    if (!daysByMonth[monthKey]) {
      daysByMonth[monthKey] = []
    }
    daysByMonth[monthKey].push(day)
  })

  // Agrupar dias por semana para mostrar números de semana
  const daysByWeek: { [key: string]: Date[] } = {}
  days.forEach((day) => {
    const weekKey = `${getYear(day)}-${getWeek(day, { locale: ptBR })}`
    if (!daysByWeek[weekKey]) {
      daysByWeek[weekKey] = []
    }
    daysByWeek[weekKey].push(day)
  })

  // Criar um estilo de grid com colunas de largura fixa
  const gridTemplateColumns = `${NAME_COLUMN_WIDTH}px repeat(${daysToShow}, minmax(${DAY_CELL_WIDTH}px, 1fr))`

  return (
    <div className="overflow-x-auto">
      {error && (
        <div className="p-4 bg-red-100 border-b border-red-200 text-red-700">
          {error}
          <button className="ml-2 text-red-500 hover:text-red-700 font-medium" onClick={() => setError(null)}>
            Dismiss
          </button>
        </div>
      )}

      <div className="p-4 bg-white border-b flex items-center gap-4">
        <div className="font-medium">Select project for new allocations:</div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border rounded p-1"
          disabled={projects.length === 0}
        >
          {projects.length === 0 ? (
            <option value="">No projects available</option>
          ) : (
            projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))
          )}
        </select>

        {/* Exibir informação sobre dias carregados */}
        <div className="ml-auto text-sm text-gray-500">
          Showing {daysToShow} days ({Math.round(daysToShow / 30)} months)
        </div>
      </div>

      <div className="overflow-x-auto" style={{ maxWidth: "100%" }} ref={scrollContainerRef}>
        <div style={{ width: `${NAME_COLUMN_WIDTH + daysToShow * DAY_CELL_WIDTH}px` }} ref={timelineRef}>
          <TimelineHeader
            days={days}
            daysByMonth={daysByMonth}
            daysByWeek={daysByWeek}
            gridTemplateColumns={gridTemplateColumns}
          />

          {/* Timeline Grid */}
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {teamMembers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No team members available. Add team members to start creating allocations.
              </div>
            ) : (
              teamMembers.map((member) => (
                <TimelineRow
                  key={member.id}
                  member={member}
                  days={days}
                  gridTemplateColumns={gridTemplateColumns}
                  getCellAllocation={getCellAllocation}
                  isStartDay={isStartDay}
                  handleCreateAllocation={handleCreateAllocation}
                  selectedAllocation={selectedAllocation}
                  setSelectedAllocation={setSelectedAllocation}
                  projects={projects}
                  dragState={dragState}
                  handleMouseDown={handleMouseDown}
                  handleSetPercentage={handleSetPercentage}
                  handleDeleteAllocation={handleDeleteAllocation}
                />
              ))
            )}
          </div>

          {/* Indicador de carregamento quando estiver adicionando mais dias */}
          {isLoadingMore && (
            <div className="text-center py-4 bg-white/80 fixed bottom-0 right-0 left-0">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-blue-500 border-r-transparent"></div>
              <span className="ml-2">Loading more days...</span>
            </div>
          )}

          {/* Indicador de atualização */}
          {isUpdating && (
            <div className="text-center py-2 px-4 bg-blue-500 text-white fixed top-4 right-4 rounded shadow-lg">
              <div className="inline-block h-3 w-3 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

