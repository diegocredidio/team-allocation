import { getYear, getMonth, getDate } from "date-fns"

// Função para verificar se uma data é um feriado nacional brasileiro
export const isBrazilianHoliday = (date: Date): boolean => {
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

