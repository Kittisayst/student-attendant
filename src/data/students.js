export const INITIAL_STUDENTS = [
  { id: '001', name: 'ສົມຊາຍ ວົງສະຫວັນ', class: '10A', photo: null, descriptor: null },
  { id: '002', name: 'ນາງ ມາລີ ພົມມະວົງ', class: '10A', photo: null, descriptor: null },
  { id: '003', name: 'ທອງໄລ ສີທິດາ', class: '10A', photo: null, descriptor: null },
  { id: '004', name: 'ນາງ ຄຳຜົງ ລາດສະໄໝ', class: '10A', photo: null, descriptor: null },
  { id: '005', name: 'ວິໄລ ບຸນທະວີ', class: '10A', photo: null, descriptor: null },
]

export const STORAGE_KEY_STUDENTS = 'attendance_students'
export const STORAGE_KEY_LOGS = 'attendance_logs'

export function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STUDENTS)
    if (!raw) return INITIAL_STUDENTS
    const parsed = JSON.parse(raw)
    return parsed.map(s => ({
      ...s,
      descriptor: s.descriptor ? new Float32Array(Object.values(s.descriptor)) : null,
    }))
  } catch {
    return INITIAL_STUDENTS
  }
}

export function saveStudents(students) {
  const toSave = students.map(s => ({
    ...s,
    descriptor: s.descriptor ? Array.from(s.descriptor) : null,
  }))
  localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(toSave))
}

export function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs))
}
