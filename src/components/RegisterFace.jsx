import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { getDescriptorFromVideo } from '../utils/faceApi'

export default function RegisterFace({ student, onSave, onClose }) {
  const webcamRef = useRef(null)
  const [capturing, setCapturing] = useState(false)
  const [status, setStatus] = useState('')
  const [photoSrc, setPhotoSrc] = useState(null)
  const [descriptor, setDescriptor] = useState(null)

  const capture = useCallback(async () => {
    setCapturing(true)
    setStatus('ກຳລັງກວດຈັບໃບໜ້າ...')
    try {
      const video = webcamRef.current?.video
      if (!video) throw new Error('ບໍ່ພົບ webcam')

      const desc = await getDescriptorFromVideo(video)
      if (!desc) {
        setStatus('❌ ບໍ່ພົບໃບໜ້າ ກະລຸນາລອງໃໝ່')
        setCapturing(false)
        return
      }

      const imageSrc = webcamRef.current.getScreenshot()
      setPhotoSrc(imageSrc)
      setDescriptor(desc)
      setStatus('✅ ກວດຈັບໃບໜ້າສຳເລັດ! ກົດ "ບັນທຶກ" ເພື່ອຢືນຢັນ')
    } catch (err) {
      setStatus('❌ ເກີດຂໍ້ຜິດພາດ: ' + err.message)
    }
    setCapturing(false)
  }, [])

  const handleSave = () => {
    if (!descriptor) return
    onSave(student.id, descriptor, photoSrc)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-md shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">📸 ລົງທະບຽນໃບໜ້າ</h2>
            <p className="text-slate-500 text-xs mt-0.5">ຖ່າຍຮູບໃບໜ້ານັກຮຽນໃຫ້ຊັດເຈນ</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-lg transition-colors"
          >&times;</button>
        </div>

        <div className="mb-4 p-3 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-600/40 flex items-center justify-center text-lg shrink-0">
            👤
          </div>
          <div>
            <p className="text-white font-semibold text-sm">{student.name}</p>
            <p className="text-slate-500 text-xs">{student.id} · ຫ້ອງ {student.class}</p>
          </div>
        </div>

        <div className="relative rounded-2xl overflow-hidden mb-4 bg-slate-950 aspect-video border border-slate-700">
          {photoSrc ? (
            <img src={photoSrc} alt="captured" className="w-full h-full object-cover" />
          ) : (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full h-full object-cover"
              mirrored
            />
          )}
          {capturing && (
            <div className="absolute inset-0 bg-white/10 flex items-center justify-center">
              <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {status && (
          <div className={`mb-4 p-3 rounded-xl text-sm text-center font-medium border ${
            status.startsWith('✅') ? 'bg-green-900/30 border-green-800/50 text-green-300' :
            status.startsWith('❌') ? 'bg-red-900/30 border-red-800/50 text-red-300' :
            'bg-blue-900/30 border-blue-800/50 text-blue-300'
          }`}>
            {status}
          </div>
        )}

        <div className="flex gap-3">
          {!photoSrc ? (
            <button
              onClick={capture}
              disabled={capturing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-500 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all"
            >
              {capturing ? 'ກຳລັງກວດໃບໜ້າ...' : '📸 ຖ່າຍຮູບ'}
            </button>
          ) : (
            <>
              <button
                onClick={() => { setPhotoSrc(null); setDescriptor(null); setStatus('') }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all"
              >
                🔄 ຖ່າຍໃໝ່
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-green-900/40"
              >
                ✓ ບັນທຶກ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
