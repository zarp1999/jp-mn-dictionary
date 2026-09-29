package expo.modules.digitalink

import com.google.mlkit.vision.digitalink.*
import com.google.mlkit.common.model.RemoteModelManager
import com.google.mlkit.common.model.DownloadConditions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DigitalInkModule : Module() {
  private val model by lazy { DigitalInkRecognitionModel.builder(
    DigitalInkRecognitionModelIdentifier.fromLanguageTag("ja")!!).build() }
  private val manager by lazy { RemoteModelManager.getInstance() }
  @Volatile private var downloadError: String? = null
  override fun definition() = ModuleDefinition {
    Name("DigitalInk")
    AsyncFunction("isReady") { promise: Promise ->
      manager.isModelDownloaded(model).addOnSuccessListener { promise.resolve(it) }
        .addOnFailureListener { promise.reject("MODEL_STATUS", it.message, it) }
    }
    AsyncFunction("startDownload") {
      downloadError = null
      manager.download(model, DownloadConditions.Builder().build())
        .addOnFailureListener { downloadError = it.message ?: "Download failed" }
      true
    }
    AsyncFunction("downloadError") { downloadError }
    AsyncFunction("recognize") { strokes: List<List<Map<String, Double>>>, promise: Promise ->
      if (strokes.isEmpty() || strokes.size > 100 || strokes.sumOf { it.size } > 20000) {
        promise.reject("INVALID_INK", "Invalid stroke count", null)
      } else {
        manager.isModelDownloaded(model).addOnSuccessListener { ready ->
          if (!ready) { promise.reject("MODEL_MISSING", "Download Japanese model first", null) }
          else {
            val ink = Ink.builder()
            strokes.forEach { points ->
              val stroke = Ink.Stroke.builder()
              points.forEach { p -> stroke.addPoint(Ink.Point.create(
                (p["x"] ?: 0.0).toFloat(), (p["y"] ?: 0.0).toFloat(), (p["t"] ?: 0.0).toLong())) }
              ink.addStroke(stroke.build())
            }
            val client = DigitalInkRecognition.getClient(DigitalInkRecognizerOptions.builder(model).build())
            client.recognize(ink.build()).addOnSuccessListener { result ->
              promise.resolve(result.candidates.take(10).map { it.text }); client.close()
            }.addOnFailureListener { promise.reject("RECOGNITION", it.message, it); client.close() }
          }
        }.addOnFailureListener { promise.reject("MODEL_STATUS", it.message, it) }
      }
    }
  }
}
