import { useState, useEffect, useCallback, useRef } from 'react'
import { loadModels } from './utils/faceApi'
import {
  loadStudents, saveStudent, deleteStudent, bulkPutStudents,
  loadLogs, addLog, upsertLog, clearLogs,
  exportJSON, importJSON,
  db,
} from './data/db'
import { INITIAL_STUDENTS } from './data/students'
import AttendanceScanner from './components/AttendanceScanner'
import StudentList from './components/StudentList'
import AttendanceLog from './components/AttendanceLog'
import { format } from 'date-fns'

const TABS = [
  { id: 'scan', label: '📷 ສະແກນ' },
  { id: 'students', label: '👥 ນັກຮຽນ' },
  { id: 'log', label: '📋 ບັນທຶກ' },
]

function App() {
  const [tab, setTab] = useState('scan')
  const [modelsReady, setModelsReady] = useState(false)
  const [dbReady, setDbReady] = useState(false)
  const [students, setStudents] = useState([])
  const [logs, setLogs] = useState([])
  const [toast, setToast] = useState(null)
  const importRef = useRef(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const refreshStudents = useCallback(async () => {
    const s = await loadStudents()
    setStudents(s)
  }, [])

  const refreshLogs = useCallback(async () => {
    const l = await loadLogs()
    setLogs(l)
  }, [])

  useEffect(() => {
    async function init() {
      await loadModels().catch(console.error)
      setModelsReady(true)

      const existing = await db.students.count()
      if (existing === 0) {
        await bulkPutStudents(INITIAL_STUDENTS)
      }
      await refreshStudents()
      await refreshLogs()
      setDbReady(true)
    }
    init()
  }, [refreshStudents, refreshLogs])

  const handleCheckin = useCallback(async (student) => {
    const now = new Date()
    const entry = {
      studentId: student.id,
      date: format(now, 'yyyy-MM-dd'),
      time: format(now, 'HH:mm:ss'),
    }
    await addLog(entry)
    await refreshLogs()
  }, [refreshLogs])

  const handleUpdateStudent = useCallback(async (id, updates) => {
    const student = students.find(s => s.id === id)
    if (!student) return
    await saveStudent({ ...student, ...updates })
    await refreshStudents()
  }, [students, refreshStudents])

  const handleAddStudent = useCallback(async (student) => {
    await saveStudent(student)
    await refreshStudents()
  }, [refreshStudents])

  const handleDeleteStudent = useCallback(async (id) => {
    if (!confirm('ລຶບນັກຮຽນຄົນນີ້?')) return
    await deleteStudent(id)
    await refreshStudents()
    await refreshLogs()
  }, [refreshStudents, refreshLogs])

  const handleClearLogs = useCallback(async () => {
    await clearLogs()
    await refreshLogs()
  }, [refreshLogs])

  const handleManualAttendance = useCallback(async (studentId, status) => {
    const now = new Date()
    const date = format(now, 'yyyy-MM-dd')
    const time = format(now, 'HH:mm:ss')
    await upsertLog(studentId, date, status, time)
    await refreshLogs()
  }, [refreshLogs])

  const handleImportExcel = useCallback(async (count) => {
    await refreshStudents()
    showToast(`Import Excel ສຳເລັດ! ເພີ່ມ ${count} ຄົນ`)
  }, [refreshStudents])

  const handleExportJSON = useCallback(async () => {
    const json = await exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance_backup_${format(new Date(), 'yyyyMMdd_HHmm')}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Export JSON ສຳເລັດ!')
  }, [])

  const handleImportJSON = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      await importJSON(text)
      await refreshStudents()
      await refreshLogs()
      showToast('Import JSON ສຳເລັດ!')
    } catch {
      showToast('ໄຟລ໌ JSON ບໍ່ຖືກຕ້ອງ', 'error')
    }
    e.target.value = ''
  }, [refreshStudents, refreshLogs])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayChecked = new Set(logs.filter(l => l.date === todayStr).map(l => l.studentId)).size

  if (!dbReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🎓</div>
          <p className="text-slate-300 text-lg font-semibold">ກຳລັງໂຫຼດລະບົບ...</p>
          <p className="text-slate-500 text-sm mt-1">ກຳລັງໂຫຼດ AI Models ແລະ ຖານຂໍ້ມູນ</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}

      <header className="bg-slate-800/90 backdrop-blur border-b border-slate-700 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-xl shrink-0">🎓</div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">ລະບົບກວດຊື່ນັກຮຽນ</h1>
              <p className="text-xs mt-0.5 flex items-center gap-1.5">
                <span className={modelsReady ? 'text-green-400' : 'text-yellow-400'}>
                  {modelsReady ? '● AI ພ້ອມ' : '⏳ ໂຫຼດ AI...'}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-slate-400">{todayStr}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right mr-1">
              <div className="text-xl font-bold text-green-400 leading-tight">{todayChecked}<span className="text-slate-500 text-xs font-normal">/{students.length}</span></div>
              <div className="text-slate-500 text-xs">ເຂົ້າຫ້ອງ</div>
            </div>
            <button
              onClick={handleExportJSON}
              title="Export JSON"
              className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-base"
            >⬇</button>
            <button
              onClick={() => importRef.current?.click()}
              title="Import JSON"
              className="w-9 h-9 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors text-base"
            >⬆</button>
            <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex bg-slate-800 rounded-2xl p-1 mb-5 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'scan' && (
          <AttendanceScanner
            students={students}
            logs={logs}
            onCheckin={handleCheckin}
            modelsReady={modelsReady}
          />
        )}
        {tab === 'students' && (
          <StudentList
            students={students}
            logs={logs}
            onUpdateStudent={handleUpdateStudent}
            onAddStudent={handleAddStudent}
            onDeleteStudent={handleDeleteStudent}
            onManualAttendance={handleManualAttendance}
            onImportExcel={handleImportExcel}
          />
        )}
        {tab === 'log' && (
          <AttendanceLog
            logs={logs}
            students={students}
            onClearLogs={handleClearLogs}
          />
        )}
      </div>
    </div>
  )
}

export default App
