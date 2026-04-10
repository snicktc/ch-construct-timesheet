type WeekDotsProps = {
  dates: string[]
  completedDates: Set<string>
  todayDate: string
}

export function WeekDots({ dates, completedDates, todayDate }: WeekDotsProps) {
  return (
    <div className="week-dots" aria-label="Weekvoortgang">
      {dates.map((date) => {
        const isCompleted = completedDates.has(date)
        const isToday = date === todayDate

        return (
          <span
            key={date}
            className={`week-dot${isCompleted ? ' is-complete' : ''}${isToday ? ' is-today' : ''}`}
            title={date}
          />
        )
      })}
    </div>
  )
}
