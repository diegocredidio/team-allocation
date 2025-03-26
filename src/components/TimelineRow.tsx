"use client"

import type React from "react"
import { format, isWeekend } from "date-fns"
import { Plus } from "lucide-react"
import { AllocationBlock } from "./AllocationBlock"
import { isBrazilianHoliday } from "../utils/dateUtils"
import type { TeamMember, Project } from "../types"

interface TimelineRowProps {
  member: TeamMember
  days: Date[]
  gridTemplateColumns: string
  getCellAllocation: (teamMemberId: string, day: Date) => any
  isStartDay: (allocation: any, day: Date) => boolean
  handleCreateAllocation: (teamMemberId: string, dateStr: string) => void
  selectedAllocation: string | null
  setSelectedAllocation: (id: string | null) => void
  projects: Project[]
  dragState: any
  handleMouseDown: (e: React.MouseEvent, type: "move" | "resize-start" | "resize-end", allocation: any) => void
  handleSetPercentage: (id: string, percentage: number) => void
  handleDeleteAllocation: (id: string) => void
}

export const TimelineRow: React.FC<TimelineRowProps> = ({
  member,
  days,
  gridTemplateColumns,
  getCellAllocation,
  isStartDay,
  handleCreateAllocation,
  selectedAllocation,
  setSelectedAllocation,
  projects,
  dragState,
  handleMouseDown,
  handleSetPercentage,
  handleDeleteAllocation,
}) => {
  return (
    <div style={{ display: "grid", gridTemplateColumns }} className="border-b">
      <div className="p-4 flex items-center gap-3 sticky left-0 bg-white z-10">
        <img
          src={member.avatar || "/placeholder.svg"}
          alt={member.name}
          className="w-8 h-8 rounded-full flex-shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="font-medium truncate">{member.name}</div>
          <div className="text-sm text-gray-500 truncate">{member.role}</div>
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
            className={`border-l h-16 relative day-cell ${isHoliday ? "bg-red-50" : isWeekendDay ? "bg-gray-50" : ""}`}
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
  )
}

