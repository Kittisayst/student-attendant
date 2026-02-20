import { useState } from 'react'
import { format } from 'date-fns'
import { exportAttendanceExcel } from '../data/db'

const STATUS_STYLE = {
  ມາ:  'bg-green-900/40 text-green-300 border-green-800/50',
  ຂາດ: 'bg-red-900/40 text-red-300 border-red-800/50',
  ຄອບ: 'bg-yellow-900/40 text-yellow-300 border-yellow-800/50',
}

export default function AttendanceLog({ logs, students, onClearLogs }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10))

  const studentMap = Object.fromEntries(students.map(s => [s.id, s]))

  const dates = [...new Set(logs.map(l => l.date))].sort((a, b) => b.localeCompare(a))

  const filteredLogs = logs
    .filter(l => l.date === selectedDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''))

  const logMap = Object.fromEntries(filteredLogs.map(l => [l.studentId, l]))
  const loggedIds = new Set(filteredLogs.map(l => l.studentId))
  const absentStudents = students.filter(s => !loggedIds.has(s.id))

  const presentCount = filteredLogs.filter(l => !l.status || l.status === 'ມາ').length
  const leaveCount = filteredLogs.filter(l => l.status === 'ຄອບ').length
  const absentCount = filteredLogs.filter(l => l.status === 'ຂາດ').length + absentStudents.length

  const exportCSV = () => {
    const rows = [['ລະຫັດ', 'ຊື່ນັກຮຽນ', 'ຫ້ອງ', 'ວັນທີ', 'ເວລາ', 'ສະຖານະ']]
    students.forEach(s => {
      const log = logMap[s.id]
      rows.push([
        s.id, s.name, s.class, selectedDate,
        log?.time || '-',
        log?.status || (log ? 'ມາ' : 'ຂາດ'),
      ])
    })
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_${selectedDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportExcel = () => {
    exportAttendanceExcel(students, logs, selectedDate)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-center">
        <select
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        >
          {dates.length === 0 && (
            <option value={selectedDate}>{selectedDate}</option>
          )}
          {dates.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <button
          onClick={exportExcel}
          className="bg-green-700 hover:bg-green-600 active:scale-95 text-white px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0"
        >
          📊 Excel
        </button>
        <button
          onClick={exportCSV}
          className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-300 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all shrink-0"
        >
          📥 CSV
        </button>
        <button
          onClick={() => { if (confirm('ລຶບ log ທັງໝົດ?')) onClearLogs() }}
          title="ລຶບ log"
          className="w-10 h-10 bg-slate-800 border border-slate-700 hover:bg-red-900/50 hover:border-red-800 text-slate-400 hover:text-red-300 rounded-xl text-sm transition-all flex items-center justify-center shrink-0"
        >
          🗑
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3">
          <div className="text-xl font-bold text-white">{students.length}</div>
          <div className="text-slate-400 text-xs mt-1">ທັງໝົດ</div>
        </div>
        <div className="bg-green-900/30 border border-green-800/40 rounded-2xl p-3">
          <div className="text-xl font-bold text-green-400">{presentCount}</div>
          <div className="text-slate-400 text-xs mt-1">ມາ</div>
        </div>
        <div className="bg-yellow-900/30 border border-yellow-800/40 rounded-2xl p-3">
          <div className="text-xl font-bold text-yellow-400">{leaveCount}</div>
          <div className="text-slate-400 text-xs mt-1">ຄອບ</div>
        </div>
        <div className="bg-red-900/30 border border-red-800/40 rounded-2xl p-3">
          <div className="text-xl font-bold text-red-400">{absentCount}</div>
          <div className="text-slate-400 text-xs mt-1">ຂາດ</div>
        </div>
      </div>

      {filteredLogs.length === 0 && absentStudents.length === 0 && (
        <div className="text-slate-500 text-center py-8 bg-slate-800/50 border border-slate-700 rounded-2xl">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-sm">ບໍ່ມີຂໍ້ມູນການເຂົ້າຫ້ອງວັນທີ {selectedDate}</p>
        </div>
      )}

      {/* ລາຍຊື່ທີ່ມີ log (ມາ/ຂາດ/ຄອບ) */}
      {filteredLogs.length > 0 && (
        <div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">ລາຍຊື່ທີ່ກວດແລ້ວ</h3>
          <div className="flex flex-col gap-2 max-h-[768px] overflow-y-auto">
            {filteredLogs.map((log, i) => {
              const student = studentMap[log.studentId]
              const status = log.status || 'ມາ'
              const styleClass = STATUS_STYLE[status] || STATUS_STYLE['ມາ']
              return (
                <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center border border-slate-600">
                    {student?.photo ? (
                      <img src={student.photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-slate-500 text-sm">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{student?.name || log.studentId}</p>
                    <p className="text-slate-500 text-xs">{student?.class} · {log.time || '-'}</p>
                  </div>
                  <span className={`text-xs font-bold border px-2.5 py-1 rounded-full ${styleClass}`}>
                    {status === 'ມາ' ? '✓' : status === 'ຂາດ' ? '✗' : '~'} {status}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ລາຍຊື່ທີ່ຍັງບໍ່ກວດ */}
      {absentStudents.length > 0 && (
        <div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">ຍັງບໍ່ໄດ້ກວດ / ຂາດ</h3>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {absentStudents.map(student => (
              <div key={student.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center border border-slate-600">
                  {student.photo ? (
                    <img src={student.photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 text-sm">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-sm font-semibold truncate">{student.name}</p>
                  <p className="text-slate-600 text-xs">{student.id} · {student.class}</p>
                </div>
                <span className="text-slate-500 text-xs font-semibold bg-slate-700/60 border border-slate-600/50 px-2.5 py-1 rounded-full">
                  — ຍັງບໍ່ກວດ
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
