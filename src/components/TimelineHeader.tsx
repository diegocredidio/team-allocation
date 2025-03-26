import type React from "react"
import { format, getDay, getWeek, isWeekend } from "date-fns"
import { ptBR } from "date-fns/locale"
import { isBrazilianHoliday } from "../utils/dateUtils"

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

interface TimelineHeaderProps {
  days: Date[]
  daysByMonth: { [key: string]: Date[] }
  daysByWeek: { [key: string]: Date[] }
  gridTemplateColumns: string
}

export const TimelineHeader: React.FC<TimelineHeaderProps> = ({
  days,
  daysByMonth,
  daysByWeek,
  gridTemplateColumns,
}) => {
  return (
    <>
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
        <div className="p-4 font-semibold"></div>
        {Object.entries(daysByWeek).map(([weekKey, weekDays]) => (
          <div
            key={weekKey}
            className="text-center text-xs py-1 border-l bg-gray-50 text-slate-500"
            style={{ gridColumn: `span ${weekDays.length}` }}
          >
            Semana {getWeek(weekDays[0], { locale: ptBR })}
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
    </>
  )
}

