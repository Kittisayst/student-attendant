import { useState, useRef } from 'react'
import RegisterFace from './RegisterFace'
import { downloadExcelTemplate, importStudentsFromExcel } from '../data/db'

const STATUS_CONFIG = {
  ມາ:  { label: 'ມາ',  bg: 'bg-green-600 hover:bg-green-700',  active: 'bg-green-600 ring-2 ring-green-400', text: 'text-white' },
  ຂາດ: { label: 'ຂາດ', bg: 'bg-red-600 hover:bg-red-700',     active: 'bg-red-600 ring-2 ring-red-400',    text: 'text-white' },
  ຄອບ: { label: 'ຄອບ', bg: 'bg-yellow-600 hover:bg-yellow-700', active: 'bg-yellow-600 ring-2 ring-yellow-400', text: 'text-white' },
}

export default function StudentList({ students, logs, onUpdateStudent, onAddStudent, onDeleteStudent, onManualAttendance, onImportExcel }) {
  const [registerTarget, setRegisterTarget] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStudent, setNewStudent] = useState({ id: '', name: '', class: '' })
  const [search, setSearch] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('list')
  const excelRef = useRef(null)

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayLogs = logs.filter(l => l.date === todayStr)
  const logMap = Object.fromEntries(todayLogs.map(l => [l.studentId, l]))

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.includes(search)
  )

  const handleSaveFace = (studentId, descriptor, photo) => {
    onUpdateStudent(studentId, { descriptor, photo })
    setRegisterTarget(null)
  }

  const handleAddStudent = () => {
    if (!newStudent.id || !newStudent.name || !newStudent.class) return
    onAddStudent({ ...newStudent, photo: null, descriptor: null })
    setNewStudent({ id: '', name: '', class: '' })
    setShowAddForm(false)
  }

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportLoading(true)
    try {
      const count = await importStudentsFromExcel(file)
      await onImportExcel(count)
    } catch (err) {
      alert('ນຳເຂົ້າບໍ່ສຳເລັດ: ' + err.message)
    }
    setImportLoading(false)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Excel toolbar */}
      <div className="flex gap-2 bg-slate-800 border border-slate-700 rounded-2xl p-3">
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">ນຳເຂົ້າລາຍຊື່ Excel</p>
          <p className="text-slate-500 text-xs mt-0.5">ໄຟລ໌ .xlsx ຕ້ອງມີ: ລະຫັດ, ຊື່, ຫ້ອງ</p>
        </div>
        <button
          onClick={() => downloadExcelTemplate()}
          className="bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-300 hover:text-white text-xs px-3 py-2 rounded-xl transition-all font-medium shrink-0"
        >
          📄 Template
        </button>
        <button
          onClick={() => excelRef.current?.click()}
          disabled={importLoading}
          className="bg-green-700 hover:bg-green-600 active:scale-95 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs px-3 py-2 rounded-xl transition-all font-medium shrink-0"
        >
          {importLoading ? '⏳...' : '📥 Import'}
        </button>
        <input ref={excelRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelImport} />
      </div>

      {/* Sub-tabs: ລາຍຊື່ / ກວດຊື່ດ້ວຍມື */}
      <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
        {[['list', '👥 ລາຍຊື່'], ['manual', '✏️ ກວດຊື່ດ້ວຍມື']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="ຄົ້ນຫາຊື່ ຫຼື ລະຫັດ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
        {activeTab === 'list' && (
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            + ເພີ່ມ
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && activeTab === 'list' && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex flex-col gap-3">
          <h3 className="text-white font-bold">ເພີ່ມນັກຮຽນໃໝ່</h3>
          <input
            type="text"
            placeholder="ລະຫັດນັກຮຽນ (ເຊັ່ນ: 006)"
            value={newStudent.id}
            onChange={e => setNewStudent(p => ({ ...p, id: e.target.value }))}
            className="bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="ຊື່-ນາມສະກຸນ"
            value={newStudent.name}
            onChange={e => setNewStudent(p => ({ ...p, name: e.target.value }))}
            className="bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            placeholder="ຫ້ອງຮຽນ (ເຊັ່ນ: 10A)"
            value={newStudent.class}
            onChange={e => setNewStudent(p => ({ ...p, class: e.target.value }))}
            className="bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddStudent}
              className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              ✓ ບັນທຶກ
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              ຍົກເລີກ
            </button>
          </div>
        </div>
      )}

      <div className="text-slate-500 text-xs px-1">
        ທັງໝົດ {students.length} ຄົນ · ລົງທະບຽນໃບໜ້າ {students.filter(s => s.descriptor).length} ຄົນ
        {activeTab === 'manual' && <span className="ml-2 text-yellow-500">· ວັນທີ {todayStr}</span>}
      </div>

      {/* ---- LIST TAB ---- */}
      {activeTab === 'list' && (
        <div className="flex flex-col gap-2 max-h-[768px] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="text-slate-500 text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm">ບໍ່ພົບຂໍ້ມູນ</p>
            </div>
          )}
          {filtered.map(student => {
            const log = logMap[student.id]
            const hasDescriptor = !!student.descriptor
            const statusLabel = log?.status || (log ? 'ມາ' : null)
            const statusColor =
              statusLabel === 'ມາ' ? 'bg-green-900/50 text-green-300 border-green-800/50' :
              statusLabel === 'ຂາດ' ? 'bg-red-900/50 text-red-300 border-red-800/50' :
              statusLabel === 'ຄອບ' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-800/50' :
              'bg-slate-700 text-slate-500 border-transparent'
            return (
              <div key={student.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 flex items-center gap-3 hover:border-slate-600 transition-colors">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center border-2 border-slate-600">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 text-xl">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{student.name}</p>
                  <p className="text-slate-500 text-xs mb-1.5">{student.id} · {student.class}</p>
                  <div className="flex gap-1 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                      hasDescriptor ? 'bg-blue-900/50 text-blue-300 border-blue-800/50' : 'bg-slate-700 text-slate-500 border-transparent'
                    }`}>
                      {hasDescriptor ? '✓ ລົງທະບຽນ' : '✗ ຍັງບໍ່ລົງທະບຽນ'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${statusColor}`}>
                      {statusLabel ? `${statusLabel === 'ມາ' ? '✓' : statusLabel === 'ຂາດ' ? '✗' : '~'} ${statusLabel}` : '— ຍັງບໍ່ກວດ'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button
                    onClick={() => setRegisterTarget(student)}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                  >
                    📸 ລົງທະບຽນ
                  </button>
                  <button
                    onClick={() => onDeleteStudent(student.id)}
                    className="bg-slate-700 hover:bg-red-900/60 text-slate-400 hover:text-red-300 text-xs px-3 py-1.5 rounded-lg transition-all font-medium"
                  >
                    🗑 ລຶບ
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ---- MANUAL ATTENDANCE TAB ---- */}
      {activeTab === 'manual' && (
        <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="text-slate-500 text-center py-10 bg-slate-800/50 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-2">🔍</div>
              <p className="text-sm">ບໍ່ພົບຂໍ້ມູນ</p>
            </div>
          )}
          {filtered.map((student, idx) => {
            const log = logMap[student.id]
            const currentStatus = log?.status || (log ? 'ມາ' : null)
            return (
              <div key={student.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-3 flex items-center gap-3">
                <div className="text-slate-600 text-xs font-mono w-5 text-center shrink-0">{idx + 1}</div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 shrink-0 flex items-center justify-center border border-slate-600">
                  {student.photo ? (
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-slate-500 text-sm">👤</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm truncate">{student.name}</p>
                  <p className="text-slate-500 text-xs">{student.id} · {student.class}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                    const isActive = currentStatus === status
                    return (
                      <button
                        key={status}
                        onClick={() => onManualAttendance(student.id, status)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all active:scale-95 ${
                          isActive ? cfg.active + ' ' + cfg.text : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {registerTarget && (
        <RegisterFace
          student={registerTarget}
          onSave={handleSaveFace}
          onClose={() => setRegisterTarget(null)}
        />
      )}
    </div>
  )
}
