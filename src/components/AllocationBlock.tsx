"use client"

import type React from "react"
import { parseISO, differenceInDays } from "date-fns"
import { GripVertical, Trash2 } from "lucide-react"
import type { Project } from "../types"

interface AllocationBlockProps {
  allocation: any
  project: Project | undefined
  isDragging: boolean
  isSelected: boolean
  onMouseDown: (e: React.MouseEvent, type: "move" | "resize-start" | "resize-end", allocation: any) => void
  onSetPercentage: (id: string, percentage: number) => void
  onDelete: (id: string) => void
}

export const AllocationBlock: React.FC<AllocationBlockProps> = ({
  allocation,
  project,
  isDragging,
  isSelected,
  onMouseDown,
  onSetPercentage,
  onDelete,
}) => {
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
      className={`absolute top-1 bottom-1 left-0 z-10 rounded overflow-hidden group ${isDragging ? "shadow-lg opacity-80" : ""} ${
        isSelected ? "ring-2 ring-blue-500" : ""
      }`}
      style={{
        width: `calc(${durationDays * 100}% - 2px)`,
        backgroundColor: project.color,
        cursor: "move",
        transition: isDragging ? "none" : "all 0.1s ease",
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

