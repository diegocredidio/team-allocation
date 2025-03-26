"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import {
  addDays,
  format,
  eachDayOfInterval,
  parseISO,
  differenceInDays,
  isSameDay,
  getDay,
  getWeek,
  isWeekend,
  getYear,
  getMonth,
  getDate,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { useStore } from "../store"
import { Plus, GripVertical, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

// Mostrar 3 meses (aproximadamente 90 dias)
const DAYS_TO_SHOW = 90
// Definir uma largura mínima para cada célula de dia
const DAY_CELL_WIDTH = 40 // pixels

// Mapeamento para abreviações de 3 letras dos dias da semana em português
const WEEKDAY_ABBR: { [key: number]: string } = {
  0: "DOM", // Domingo
  1: "SEG", // Segunda
  2: "TER", // Terça
  3: "QUA", // Quarta
  4: "QUI", // Quinta
  5: "SEX", // Sexta
  6: "SAB", // Sábado
}

export function Timeline() {
  const { teamMembers, allocations, projects, updateAllocation, addAllocation, removeAllocation } = useStore()
  const [selectedProject, setSelectedProject] = useState(projects[0]?.id || "")
  const timelineRef = useRef<HTMLDivElement>(null)
  const [cellWidth, setCellWidth] = useState(DAY_CELL_WIDTH)
  const [cellHeight, setCellHeight] = useState(0)

  // Dragging state
  const [dragState, setDragState] = useState<{
    type: "move" | "resize-start" | "resize-end"
    allocationId: string
    startX: number
    startY: number
    originalAllocation: any
  } | null>(null)

  // Selected allocation for controls
  const [selectedAllocation, setSelectedAllocation] = useState<string | null>(null)

  const today = new Date()
  const startDate = today
  const days = eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, DAYS_TO_SHOW - 1),
  })

  // Função para verificar se uma data é um feriado nacional brasileiro
  const isBrazilianHoliday = (date: Date): boolean => {
    const year = getYear(date)
    const month = getMonth(date) + 1 // getMonth é baseado em zero
    const day = getDate(date)

    // Feriados fixos
    const fixedHolidays = [
      { day: 1, month: 1 }, // Confraternização Universal
      { day: 21, month: 4 }, // Tiradentes
      { day: 1, month: 5 }, // Dia do Trabalho
      { day: 7, month: 9 }, // Independência do Brasil
      { day: 12, month: 10 }, // Nossa Senhora Aparecida
      { day: 2, month: 11 }, // Finados
      { day: 15, month: 11 }, // Proclamação da República
      { day: 25, month: 12 }, // Natal
    ]

    // Verificar feriados fixos
    if (fixedHolidays.some((holiday) => holiday.day === day && holiday.month === month)) {
      return true
    }

    // Feriados móveis para 2024
    // Nota: Em uma aplicação real, você usaria um algoritmo ou API para calcular estes feriados
    const mobileHolidays2024 = [
      { day: 12, month: 2 }, // Carnaval
      { day: 13, month: 2 }, // Carnaval
      { day: 29, month: 3 }, // Sexta-feira Santa
      { day: 30, month: 5 }, // Corpus Christi
    ]

    // Verificar feriados móveis para 2024
    if (year === 2024 && mobileHolidays2024.some((holiday) => holiday.day === day && holiday.month === month)) {
      return true
    }

    return false
  }

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
  }, [])

  // Handle mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !cellWidth || !cellHeight) return

      const { type, allocationId, startX, startY, originalAllocation } = dragState

      // Calculate delta in cells
      const deltaXCells = Math.round((e.clientX - startX) / cellWidth)
      const deltaYCells = Math.round((e.clientY - startY) / cellHeight)

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

          updateAllocation(allocationId, {
            teamMemberId: newTeamMemberId,
            startDate: newStartDate,
            endDate: newEndDate,
          })
        }
      } else if (type === "resize-start") {
        // Resize the start of the allocation
        if (deltaXCells !== 0) {
          const startDateObj = parseISO(originalAllocation.startDate)
          const newStartDate = format(addDays(startDateObj, deltaXCells), "yyyy-MM-dd")
          const endDateObj = parseISO(originalAllocation.endDate)

          // Don't allow start date to go past end date
          if (parseISO(newStartDate) < endDateObj) {
            updateAllocation(allocationId, { startDate: newStartDate })
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
            updateAllocation(allocationId, { endDate: newEndDate })
          }
        }
      }
    }

    const handleMouseUp = () => {
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

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize-start" | "resize-end", allocation: any) => {
    e.preventDefault()
    e.stopPropagation()

    setDragState({
      type,
      allocationId: allocation.id,
      startX: e.clientX,
      startY: e.clientY,
      originalAllocation: { ...allocation },
    })
  }

  const handleCreateAllocation = (teamMemberId: string, dateStr: string) => {
    if (!selectedProject) {
      alert("Please select a project first")
      return
    }

    const newAllocation = {
      id: uuidv4(),
      teamMemberId,
      projectId: selectedProject,
      startDate: dateStr,
      endDate: format(addDays(parseISO(dateStr), 4), "yyyy-MM-dd"), // Default to 5 days
      percentage: 100,
    }

    addAllocation(newAllocation)
  }

  const handleSetPercentage = (allocationId: string, percentage: number) => {
    updateAllocation(allocationId, { percentage })
  }

  const handleDeleteAllocation = (allocationId: string) => {
    removeAllocation(allocationId)
    if (selectedAllocation === allocationId) {
      setSelectedAllocation(null)
    }
  }

  // Function to check if a cell has an allocation
  const getCellAllocation = (teamMemberId: string, day: Date) => {
    return allocations.find((allocation) => {
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
  const gridTemplateColumns = `200px repeat(${DAYS_TO_SHOW}, minmax(${DAY_CELL_WIDTH}px, 1fr))`

  return (
    <div className="overflow-x-auto">
      <div className="p-4 bg-white border-b flex items-center gap-4">
        <div className="font-medium">Select project for new allocations:</div>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="border rounded p-1"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto" style={{ maxWidth: "100%" }}>
        <div style={{ width: `${200 + DAYS_TO_SHOW * DAY_CELL_WIDTH}px` }} ref={timelineRef}>
          {/* Meses */}
          <div style={{ display: "grid", gridTemplateColumns }}>
            <div className="p-4 font-semibold"></div>
            {Object.entries(daysByMonth).map(([monthKey, monthDays]) => (
              <div
                key={monthKey}
                className="text-center text-sm font-normal py-2 border-l bg-gray-100 text-slate-400"
                style={{ gridColumn: `span ${monthDays.length}` }}
              >
                {format(monthDays[0], "MMMM yyyy", { locale: ptBR })}
              </div>
            ))}
          </div>

          {/* Semanas */}
          <div style={{ display: "grid", gridTemplateColumns }}>
            <div className="p-4 font-normal"></div>
            {Object.entries(daysByWeek).map(([weekKey, weekDays]) => (
              <div
                key={weekKey}
                className="text-center text-xs py-1 border-l bg-gray-50 text-slate-500"
                style={{ gridColumn: `span ${weekDays.length}` }}
              >
                sem. {getWeek(weekDays[0], { locale: ptBR })}
              </div>
            ))}
          </div>

          {/* Header com dias */}
          <div style={{ display: "grid", gridTemplateColumns }} className="border-b sticky top-0 bg-white z-10">
            <div className="p-4 font-semibold">Team Member</div>
            {days.map((day) => {
              const isWeekendDay = isWeekend(day)
              const isHoliday = isBrazilianHoliday(day)
              const dayOfWeek = getDay(day) // 0 = domingo, 1 = segunda, etc.

              return (
                <div
                  key={format(day, "yyyy-MM-dd")}
                  className={`p-2 text-center text-xs border-l ${
                    isHoliday ? "bg-red-100" : isWeekendDay ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="font-medium">{WEEKDAY_ABBR[dayOfWeek]}</div>
                  <div className="text-gray-500">{format(day, "d")}</div>
                </div>
              )
            })}
          </div>

          {/* Timeline Grid */}
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto">
            {teamMembers.map((member) => (
              <div key={member.id} style={{ display: "grid", gridTemplateColumns }} className="border-b">
                <div className="p-4 flex items-center gap-3 sticky left-0 bg-white z-10">
                  <img src={member.avatar || "/placeholder.svg"} alt={member.name} className="w-8 h-8 rounded-full" />
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.role}</div>
                  </div>
                </div>

                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd")
                  const allocation = getCellAllocation(member.id, day)
                  const isStart = allocation && isStartDay(allocation, day)
                  const isWeekendDay = isWeekend(day)
                  const isHoliday = isBrazilianHoliday(day)

                  return (
                    <div
                      key={`${member.id}-${dateStr}`}
                      className={`border-l h-16 relative day-cell ${
                        isHoliday ? "bg-red-50" : isWeekendDay ? "bg-gray-50" : ""
                      }`}
                      onClick={() => {
                        if (!allocation) {
                          handleCreateAllocation(member.id, dateStr)
                        } else {
                          setSelectedAllocation(selectedAllocation === allocation.id ? null : allocation.id)
                        }
                      }}
                    >
                      {isStart && allocation && (
                        <AllocationBlock
                          allocation={allocation}
                          project={projects.find((p) => p.id === allocation.projectId)}
                          isDragging={dragState?.allocationId === allocation.id}
                          isSelected={selectedAllocation === allocation.id}
                          onMouseDown={handleMouseDown}
                          onSetPercentage={handleSetPercentage}
                          onDelete={handleDeleteAllocation}
                        />
                      )}

                      {!allocation && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 hover:bg-gray-100 transition-opacity">
                          <Plus className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AllocationBlock({
  allocation,
  project,
  isDragging,
  isSelected,
  onMouseDown,
  onSetPercentage,
  onDelete,
}: {
  allocation: any
  project: any
  isDragging: boolean
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent, type: "move" | "resize-start" | "resize-end", allocation: any) => void
  onSetPercentage: (id: string, percentage: number) => void
  onDelete: (id: string) => void
}) {
  if (!project) return null

  // Calculate width based on duration
  const startDate = parseISO(allocation.startDate)
  const endDate = parseISO(allocation.endDate)
  const durationDays = differenceInDays(endDate, startDate) + 1

  // Function to toggle percentage between 50% and 100%
  const handleTogglePercentage = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newPercentage = allocation.percentage === 100 ? 50 : 100
    onSetPercentage(allocation.id, newPercentage)
  }

  // Function to handle delete button click
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(allocation.id)
  }

  return (
    <div
      className={`absolute top-1 bottom-1 left-0 z-10 rounded overflow-hidden group ${isDragging ? "shadow-lg" : ""} ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      style={{
        width: `calc(${durationDays * 100}% - 2px)`,
        backgroundColor: project.color,
        cursor: "move",
      }}
      onMouseDown={(e) => onMouseDown(e, "move", allocation)}
    >
      {/* Percentage bar - only show if percentage is 50% */}
      {allocation.percentage === 50 && (
        <div
          className="absolute inset-0"
          style={{
            height: "50%",
            bottom: 0,
            top: "auto",
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.9) 5px, rgba(255,255,255,0.9) 10px)",
            backgroundColor: "rgba(0,0,0,0.1)",
          }}
        />
      )}

      <div className="p-1 text-xs text-white font-medium truncate flex items-center justify-between relative z-10">
        <div>{project.name}</div>
        <div className="flex items-center gap-1">
          <span>{allocation.percentage}%</span>
          <GripVertical className="w-4 h-4 opacity-50" />
        </div>
      </div>

      {/* Control buttons - always visible on hover */}
      <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100">
        {/* Single percentage toggle button */}
        <button
          className="p-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs"
          onClick={handleTogglePercentage}
        >
          {allocation.percentage === 100 ? "50%" : "100%"}
        </button>

        {/* Delete button */}
        <button className="p-1 rounded bg-white/20 hover:bg-red-500/70 text-white" onClick={handleDeleteClick}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Resize handles with visual indicators */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-white opacity-0 hover:opacity-30 cursor-ew-resize"
        onMouseDown={(e) => onMouseDown(e, "resize-start", allocation)}
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-0 hover:opacity-30 cursor-ew-resize"
        onMouseDown={(e) => onMouseDown(e, "resize-end", allocation)}
      />
    </div>
  )
}

