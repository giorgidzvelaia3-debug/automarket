"use client"

export default function RevenueChart({
  data,
}: {
  data: { date: string; amount: number }[]
}) {
  const max = Math.max(...data.map((d) => d.amount), 1)

  return (
    <div className="flex items-end gap-[3px] h-40">
      {data.map(({ date, amount }) => {
        const heightPct = (amount / max) * 100
        const label = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        })
        return (
          <div
            key={date}
            className="flex-1 flex flex-col items-center justify-end h-full group relative"
          >
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-gray-900 text-white text-[10px] rounded-lg px-2 py-1 whitespace-nowrap">
                <span className="font-semibold">₾{amount.toFixed(2)}</span>
                <span className="text-gray-300 ml-1">{label}</span>
              </div>
              <div className="w-1.5 h-1.5 bg-gray-900 rotate-45 -mt-1" />
            </div>
            {/* Bar */}
            <div
              className="w-full rounded-t bg-blue-500 hover:bg-blue-600 transition-colors min-h-[2px]"
              style={{ height: `${Math.max(heightPct, 1)}%` }}
            />
          </div>
        )
      })}
    </div>
  )
}
