import Dexie from 'dexie'
import * as XLSX from 'xlsx'

export const db = new Dexie('AttendanceDB')

db.version(1).stores({
  students: 'id, name, class',
  logs: '++id, studentId, date',
})

db.version(2).stores({
  students: 'id, name, class',
  logs: '++id, studentId, date, [studentId+date]',
})

// ---- Students ----

export async function loadStudents() {
  const rows = await db.students.toArray()
  return rows.map(s => ({
    ...s,
    descriptor: s.descriptor ? new Float32Array(s.descriptor) : null,
  }))
}

export async function saveStudent(student) {
  await db.students.put({
    ...student,
    descriptor: student.descriptor ? Array.from(student.descriptor) : null,
  })
}

export async function deleteStudent(id) {
  await db.students.delete(id)
  await db.logs.where('studentId').equals(id).delete()
}

export async function bulkPutStudents(students) {
  const toSave = students.map(s => ({
    ...s,
    descriptor: s.descriptor ? Array.from(s.descriptor) : null,
  }))
  await db.students.bulkPut(toSave)
}

// ---- Logs ----

export async function loadLogs() {
  return db.logs.toArray()
}

export async function addLog(entry) {
  await db.logs.add(entry)
}

export async function upsertLog(studentId, date, status, time) {
  const existing = await db.logs.where('[studentId+date]').equals([studentId, date]).first()
  if (existing) {
    await db.logs.update(existing.id, { status, time })
  } else {
    await db.logs.add({ studentId, date, time, status })
  }
}

export async function deleteLog(studentId, date) {
  await db.logs.where('[studentId+date]').equals([studentId, date]).delete()
}

export async function clearLogs() {
  await db.logs.clear()
}

// ---- Import / Export JSON ----

export async function exportJSON() {
  const students = await db.students.toArray()
  const logs = await db.logs.toArray()
  return JSON.stringify({ students, logs }, null, 2)
}

export async function importJSON(jsonStr) {
  const data = JSON.parse(jsonStr)
  if (data.students) await db.students.bulkPut(data.students)
  if (data.logs) await db.logs.bulkPut(data.logs)
}

// ---- Excel Template ----

export function downloadExcelTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['ລະຫັດນັກຮຽນ', 'ຊື່-ນາມສະກຸນ', 'ຫ້ອງຮຽນ'],
    ['001', 'ສົມຊາຍ ວົງສະຫວັນ', '10A'],
    ['002', 'ນາງ ມາລີ ພົມມະວົງ', '10A'],
    ['003', 'ທອງໄລ ສີທິດາ', '10B'],
  ])
  ws['!cols'] = [{ wch: 18 }, { wch: 30 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ນັກຮຽນ')
  XLSX.writeFile(wb, 'student_template.xlsx')
}

// ---- Excel Import Students ----

export async function importStudentsFromExcel(file) {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

  const students = []
  for (let i = 1; i < rows.length; i++) {
    const [id, name, cls] = rows[i]
    const sid = String(id).trim()
    const sname = String(name).trim()
    const scls = String(cls).trim()
    if (!sid || !sname) continue
    students.push({ id: sid, name: sname, class: scls || '', photo: null, descriptor: null })
  }
  if (students.length === 0) throw new Error('ບໍ່ພົບຂໍ້ມູນໃນໄຟລ໌')
  await db.students.bulkPut(students)
  return students.length
}

// ---- Export Attendance Excel ----

export async function exportAttendanceExcel(students, logs, date) {
  const logMap = {}
  logs.filter(l => l.date === date).forEach(l => { logMap[l.studentId] = l })

  const rows = [['ລະຫັດ', 'ຊື່ນັກຮຽນ', 'ຫ້ອງ', 'ວັນທີ', 'ເວລາ', 'ສະຖານະ']]
  students.forEach(s => {
    const log = logMap[s.id]
    rows.push([
      s.id, s.name, s.class, date,
      log?.time || '-',
      log?.status || (log ? 'ມາ' : 'ຂາດ'),
    ])
  })

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 14 }, { wch: 10 }, { wch: 10 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ການເຂົ້າຫ້ອງ')
  XLSX.writeFile(wb, `attendance_${date}.xlsx`)
}
