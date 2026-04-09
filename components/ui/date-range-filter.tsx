"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

import { DateRange } from "react-day-picker"

export interface DateRangeFilterProps {
  startDate: string | null
  endDate: string | null
  onStartDateChange: (date: string | null) => void
  onEndDateChange: (date: string | null) => void
  onClear: () => void
  placeholder?: string
  className?: string
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
  placeholder = "Filtrer par date",
  className,
}: DateRangeFilterProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  })

  // Sync internal state if props change externally
  React.useEffect(() => {
    setDate({
      from: startDate ? new Date(startDate) : undefined,
      to: endDate ? new Date(endDate) : undefined,
    })
  }, [startDate, endDate])

  const handleSelect = (selectedDate: DateRange | undefined) => {
    if (!selectedDate) {
      setDate({ from: undefined, to: undefined })
      onStartDateChange(null)
      onEndDateChange(null)
      return
    }

    setDate(selectedDate)
    
    // Format to YYYY-MM-DD for consistency with string state
    if (selectedDate.from) {
      onStartDateChange(format(selectedDate.from, "yyyy-MM-dd"))
    } else {
      onStartDateChange(null)
    }

    if (selectedDate.to) {
      // Set end date to 23:59:59 by advancing the logical date or just returning YYYY-MM-DD string
      onEndDateChange(format(selectedDate.to, "yyyy-MM-dd"))
    } else {
      onEndDateChange(null)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDate({ from: undefined, to: undefined })
    onClear()
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600",
              !date?.from && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
            <div className="flex-1 text-sm truncate">
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd LLL y", { /* locale */ })} -{" "}
                    {format(date.to, "dd LLL y")}
                  </>
                ) : (
                  format(date.from, "dd LLL y")
                )
              ) : (
                <span className="text-gray-500">{placeholder}</span>
              )}
            </div>
            {(date?.from || date?.to) && (
              <X 
                onClick={handleClear}
                className="ml-2 h-4 w-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300" 
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
