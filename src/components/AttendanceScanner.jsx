import { useRef, useState, useEffect, useCallback } from 'react'
import Webcam from 'react-webcam'
import { getDescriptorFromVideo, findBestMatch } from '../utils/faceApi'
import { format } from 'date-fns'

const SCAN_INTERVAL = 2000

export default function AttendanceScanner({ students, logs, onCheckin, modelsReady }) {
  const webcamRef = useRef(null)
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const [faceCount, setFaceCount] = useState(0)
  const [camError, setCamError] = useState(false)
  const intervalRef = useRef(null)

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLogs = logs.filter(l => l.date === todayStr)
  const checkedInIds = new Set(todayLogs.map(l => l.studentId))

  const scan = useCallback(async () => {
    const video = webcamRef.current?.video
    if (!video || video.readyState !== 4) return

    try {
      const descriptor = await getDescriptorFromVideo(video)
      if (!descriptor) {
        setFaceCount(0)
        setLastResult(null)
        return
      }
      setFaceCount(1)

      const matched = findBestMatch(descriptor, students)
      if (!matched) {
        setLastResult({ type: 'unknown' })
        return
      }

      const alreadyIn = checkedInIds.has(matched.id)
      setLastResult({ type: alreadyIn ? 'already' : 'success', student: matched })

      if (!alreadyIn) {
        onCheckin(matched)
      }
    } catch {
      // silent
    }
  }, [students, checkedInIds, onCheckin])

  useEffect(() => {
    if (scanning && modelsReady) {
      intervalRef.current = setInterval(scan, SCAN_INTERVAL)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [scanning, modelsReady, scan])

  const toggleScanning = () => {
    setScanning(prev => !prev)
    setLastResult(null)
    setFaceCount(0)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-2xl border border-slate-700">
        {camError ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
            <span className="text-4xl">📷</span>
            <p className="text-sm">ບໍ່ສາມາດເຂົ້າເຖິງກ້ອງໄດ້</p>
            <p className="text-xs text-slate-500">ກວດສອບການອະນຸຍາດ camera</p>
          </div>
        ) : (
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover"
            mirrored
            onUserMediaError={() => setCamError(true)}
          />
        )}

        {scanning && (
          <div className="absolute inset-0 border-4 border-blue-500/50 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 border-4 border-blue-400/20 rounded-2xl animate-ping" />
          </div>
        )}

        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${
            scanning ? 'bg-green-500/90 text-white' : 'bg-slate-800/80 text-slate-300'
          }`}>
            {scanning ? '● ກຳລັງສະແກນ' : '○ ຢຸດ'}
          </span>
          {faceCount > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white backdrop-blur-sm">
              ພົບໃບໜ້າ {faceCount}
            </span>
          )}
        </div>

        {lastResult && (
          <div className={`absolute bottom-3 left-3 right-3 p-3 rounded-xl text-sm font-semibold text-center backdrop-blur-md border ${
            lastResult.type === 'success' ? 'bg-green-600/90 border-green-500/50 text-white' :
            lastResult.type === 'already' ? 'bg-yellow-600/90 border-yellow-500/50 text-white' :
            'bg-red-600/90 border-red-500/50 text-white'
          }`}>
            {lastResult.type === 'success' && `✅ ${lastResult.student.name} — ເຂົ້າຫ້ອງແລ້ວ!`}
            {lastResult.type === 'already' && `⚠️ ${lastResult.student.name} — ລົງທະບຽນໄວ້ແລ້ວ`}
            {lastResult.type === 'unknown' && '❓ ບໍ່ຮູ້ຈັກໃບໜ້ານີ້'}
          </div>
        )}
      </div>

      <button
        onClick={toggleScanning}
        disabled={!modelsReady || camError}
        className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
          !modelsReady || camError ? 'bg-slate-700 text-slate-400 cursor-not-allowed' :
          scanning
            ? 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-lg shadow-red-900/40'
            : 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg shadow-blue-900/40'
        }`}
      >
        {!modelsReady ? '⏳ ກຳລັງໂຫຼດ AI Models...' :
         camError ? '📷 ກ້ອງບໍ່ພ້ອມ' :
         scanning ? '⏹ ຢຸດການສະແກນ' : '▶ ເລີ່ມສະແກນໃບໜ້າ'}
      </button>

      <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
        <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">ສະຖິຕິວັນນີ້ · {todayStr}</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-700/60 rounded-xl p-3">
            <div className="text-2xl font-bold text-white">{students.length}</div>
            <div className="text-slate-400 text-xs mt-1">ທັງໝົດ</div>
          </div>
          <div className="bg-green-900/30 border border-green-800/40 rounded-xl p-3">
            <div className="text-2xl font-bold text-green-400">{checkedInIds.size}</div>
            <div className="text-slate-400 text-xs mt-1">ເຂົ້າຫ້ອງ</div>
          </div>
          <div className="bg-red-900/30 border border-red-800/40 rounded-xl p-3">
            <div className="text-2xl font-bold text-red-400">{students.length - checkedInIds.size}</div>
            <div className="text-slate-400 text-xs mt-1">ຂາດ</div>
          </div>
        </div>
      </div>
    </div>
  )
}
