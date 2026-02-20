import * as faceapi from 'face-api.js'

const MODEL_URL = import.meta.env.BASE_URL + 'models'

let modelsLoaded = false

export async function loadModels() {
  if (modelsLoaded) return
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
  modelsLoaded = true
}

export async function getDescriptorFromVideo(videoEl) {
  const detection = await faceapi
    .detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  return detection ? detection.descriptor : null
}

export async function getDescriptorFromImage(imageEl) {
  const detection = await faceapi
    .detectSingleFace(imageEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor()
  return detection ? detection.descriptor : null
}

export function findBestMatch(descriptor, students) {
  const registered = students.filter(s => s.descriptor !== null)
  if (registered.length === 0) return null

  const labeledDescriptors = registered.map(
    s => new faceapi.LabeledFaceDescriptors(s.id, [s.descriptor])
  )
  const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.5)
  const match = matcher.findBestMatch(descriptor)

  if (match.label === 'unknown') return null
  return registered.find(s => s.id === match.label) || null
}

export async function detectFacesOnCanvas(videoEl, canvas) {
  const displaySize = { width: videoEl.videoWidth, height: videoEl.videoHeight }
  faceapi.matchDimensions(canvas, displaySize)

  const detections = await faceapi
    .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()

  const resized = faceapi.resizeResults(detections, displaySize)
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  faceapi.draw.drawDetections(canvas, resized)
  faceapi.draw.drawFaceLandmarks(canvas, resized)
  return detections.length
}
