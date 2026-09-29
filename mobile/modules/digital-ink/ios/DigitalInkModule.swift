import ExpoModulesCore
import MLKitDigitalInkRecognition
import MLKitCommon

public class DigitalInkModule: Module {
  private lazy var model = DigitalInkRecognitionModel(modelIdentifier:
    DigitalInkRecognitionModelIdentifier(forLanguageTag: "ja")!)
  private lazy var recognizer = DigitalInkRecognizer.digitalInkRecognizer(
    options: DigitalInkRecognizerOptions(model: model))
  public func definition() -> ModuleDefinition {
    Name("DigitalInk")
    AsyncFunction("isReady") { () -> Bool in
      ModelManager.modelManager().isModelDownloaded(self.model)
    }
    AsyncFunction("startDownload") { () -> Bool in
      ModelManager.modelManager().download(self.model, conditions:
        ModelDownloadConditions(allowsCellularAccess: true, allowsBackgroundDownloading: false))
      return true
    }
    AsyncFunction("downloadError") { () -> String? in nil }
    AsyncFunction("recognize") { (data: [[[String: Double]]], promise: Promise) in
      guard !data.isEmpty, data.count <= 100, data.reduce(0, { $0 + $1.count }) <= 20000 else {
        promise.reject("INVALID_INK", "Invalid stroke count"); return
      }
      guard ModelManager.modelManager().isModelDownloaded(self.model) else {
        promise.reject("MODEL_MISSING", "Download Japanese model first"); return
      }
      let strokes = data.map { points in Stroke(points: points.map { p in
        StrokePoint(x: Float(p["x"] ?? 0), y: Float(p["y"] ?? 0), t: Int(p["t"] ?? 0))
      }) }
      self.recognizer.recognize(ink: Ink(strokes: strokes)) { result, error in
        if let error = error { promise.reject("RECOGNITION", error.localizedDescription); return }
        promise.resolve(result?.candidates.prefix(10).map { $0.text } ?? [])
      }
    }
  }
}
