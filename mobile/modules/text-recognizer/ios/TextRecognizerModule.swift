/**
 * 【ネイティブ・機能】iOS の文字認識（Apple Vision）
 *
 * JS から modules/text-recognizer/index.js → この Swift が呼ばれる。
 * 画面は持たない。画像 URI を受け取り、認識した文字と位置（blocks）を返す。
 *
 * Expo Go には含まれない。EAS の iOS ビルドが必要。
 */
import ExpoModulesCore
import ImageIO
import UIKit
import Vision

/// 日本語認識は Vision revision 3（iOS 16+）が必要。英語はそれ以前でも可。
private let PREFERRED_LANGUAGES = ["ja-JP", "en-US"]

/// JS の recognize(uri, options) から渡されるオプション
struct RecognizeOptions: Record {
  @Field var languages: [String] = PREFERRED_LANGUAGES
  /// 言語補正は日本語を壊しやすいのでデフォルト OFF
  @Field var useLanguageCorrection: Bool = false
  @Field var writingMode: String = "auto"
}

public class TextRecognizerModule: Module {
  public func definition() -> ModuleDefinition {
    // JS の requireOptionalNativeModule('TextRecognizer') と一致させる名前
    Name("TextRecognizer")

    AsyncFunction("getSupportedLanguages") { () -> [String] in
      TextRecognizerModule.supportedLanguages()
    }

    /// メイン API: 画像 URI → 認識結果（text / blocks など）
    AsyncFunction("recognize") { (uri: String, options: RecognizeOptions) -> [String: Any] in
      try TextRecognizerModule.recognize(uri: uri, options: options)
    }
  }

  private static func makeRequest(useLanguageCorrection: Bool) -> VNRecognizeTextRequest {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = useLanguageCorrection
    return request
  }

  private static func supportedLanguages() -> [String] {
    let request = makeRequest(useLanguageCorrection: false)
    return (try? request.supportedRecognitionLanguages()) ?? []
  }

  /// 画像を読み込み、Vision で文字認識する。
  /// 読み順の本確定とふりがな除去は JS（textRecognitionLayout.js）側。
  private static func recognize(uri: String, options: RecognizeOptions) throws -> [String: Any] {
    let image = try loadImage(uri: uri)

    guard let cgImage = image.cgImage else {
      throw ImageDecodeException()
    }

    let request = makeRequest(useLanguageCorrection: options.useLanguageCorrection)

    let supported = Set((try? request.supportedRecognitionLanguages()) ?? [])
    let selected = options.languages.filter { supported.contains($0) }
    if !selected.isEmpty {
      request.recognitionLanguages = selected
    }

    let handler = VNImageRequestHandler(
      cgImage: cgImage,
      orientation: cgOrientation(from: image.imageOrientation),
      options: [:]
    )

    try handler.perform([request])

    let observations = (request.results as? [VNRecognizedTextObservation]) ?? []
    var blocks: [[String: Any]] = []

    for observation in observations {
      guard let candidate = observation.topCandidates(1).first else {
        continue
      }
      let text = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
      if text.isEmpty {
        continue
      }

      let box = observation.boundingBox
      blocks.append([
        "text": text,
        "confidence": Double(candidate.confidence),
        // Vision は左下が原点。JS（画面）向けに左上原点へ変換する。
        "x": Double(box.origin.x),
        "y": Double(1.0 - (box.origin.y + box.height)),
        "width": Double(box.width),
        "height": Double(box.height),
      ])
    }

    // Keep normal OCR unchanged. Retry locally for explicitly vertical input or no detections.
    var usedVerticalFallback = false
    if options.writingMode == "vertical" || (options.writingMode == "auto" && blocks.isEmpty) {
      if let upright = VerticalTextPreparation.upright(image) {
        let strips = VerticalTextPreparation.strips(upright)
        var recovered: [[String: Any]] = []
        for strip in strips {
          let retry = makeRequest(useLanguageCorrection: false)
          if !selected.isEmpty { retry.recognitionLanguages = selected }
          retry.minimumTextHeight = 0.01
          // One horizontal line made of upright glyphs, not a rotated page.
          do {
            try VNImageRequestHandler(cgImage: strip.image, orientation: .up).perform([retry])
            let observations = (retry.results ?? []).sorted { $0.boundingBox.minX < $1.boundingBox.minX }
            let candidates = observations.compactMap { $0.topCandidates(1).first }
            let text = candidates.map { $0.string }.joined().trimmingCharacters(in: .whitespacesAndNewlines)
            if !text.isEmpty {
              recovered.append(["text": text, "x": strip.bounds.minX, "y": strip.bounds.minY,
                "width": strip.bounds.width, "height": strip.bounds.height,
                "confidence": candidates.map { Double($0.confidence) }.reduce(0, +) / Double(candidates.count)])
            }
          } catch {
            // A failed optional retry must not discard the original OCR result.
            continue
          }
        }
        let oldCount = blocks.compactMap { $0["text"] as? String }.joined().count
        let newCount = recovered.compactMap { $0["text"] as? String }.joined().count
        if !recovered.isEmpty && newCount >= oldCount {
          blocks = recovered
          usedVerticalFallback = true
        }
      }
    }
    // 読み順・縦横判定は JS 側。列を復元した場合は列単位のまま渡す。
    let lines = blocks.compactMap { $0["text"] as? String }

    return [
      "text": lines.joined(separator: "\n"),
      "blocks": blocks,
      "usedVerticalFallback": usedVerticalFallback,
      "languages": selected.isEmpty ? Array(supported) : selected,
      "supportsJapanese": supported.contains("ja-JP"),
      "imageWidth": Double(image.size.width * image.scale),
      "imageHeight": Double(image.size.height * image.scale),
    ]
  }

  private static func number(_ block: [String: Any], _ key: String) -> Double {
    block[key] as? Double ?? 0
  }

  private static func centerX(_ block: [String: Any]) -> Double {
    number(block, "x") + number(block, "width") / 2
  }

  /// ブロック形状から縦書きかどうかをざっくり判定する。
  /// 正方形に近い断片は JS 側の配置判定に任せる。
  private static func isVerticalWriting(_ blocks: [[String: Any]]) -> Bool {
    let ratios = blocks.compactMap { block -> Double? in
      let width = number(block, "width")
      let height = number(block, "height")
      guard width > 0 else { return nil }
      return height / width
    }
    guard !ratios.isEmpty else { return false }

    let sorted = ratios.sorted()
    let middle = sorted.count / 2
    let median = sorted.count.isMultiple(of: 2)
      ? (sorted[middle - 1] + sorted[middle]) / 2
      : sorted[middle]
    return median >= 1.3
  }

  private static func sortByReadingOrder(_ blocks: [[String: Any]]) -> [[String: Any]] {
    if isVerticalWriting(blocks) {
      return sortVertical(blocks)
    }
    return blocks.sorted(by: isEarlierHorizontal)
  }

  /// 縦書き: 右の列から左へ、列の中は上から下
  private static func sortVertical(_ blocks: [[String: Any]]) -> [[String: Any]] {
    let widths = blocks.map { number($0, "width") }.filter { $0 > 0 }.sorted()
    let medianWidth: Double
    if widths.isEmpty {
      medianWidth = 0.05
    } else {
      let middle = widths.count / 2
      medianWidth = widths.count.isMultiple(of: 2)
        ? (widths[middle - 1] + widths[middle]) / 2
        : widths[middle]
    }
    let threshold = max(medianWidth * 1.4, 0.015)

    var columns: [(center: Double, blocks: [[String: Any]])] = []
    let rightToLeft = blocks.sorted { centerX($0) > centerX($1) }

    for block in rightToLeft {
      let cx = centerX(block)
      if let index = columns.enumerated()
        .filter({ abs($0.element.center - cx) <= threshold })
        .min(by: { abs($0.element.center - cx) < abs($1.element.center - cx) })?
        .offset
      {
        columns[index].blocks.append(block)
        let items = columns[index].blocks
        columns[index].center = items.reduce(0) { $0 + centerX($1) } / Double(items.count)
      } else {
        columns.append((center: cx, blocks: [block]))
      }
    }

    columns.sort { $0.center > $1.center }
    return columns.flatMap { column in
      column.blocks.sorted { number($0, "y") < number($1, "y") }
    }
  }

  /// 横書き: 上→下、同じ行なら左→右
  private static func isEarlierHorizontal(_ a: [String: Any], _ b: [String: Any]) -> Bool {
    let aY = number(a, "y")
    let bY = number(b, "y")
    let aX = number(a, "x")
    let bX = number(b, "x")
    let aH = number(a, "height")
    let bH = number(b, "height")

    let tolerance = max(min(aH, bH) * 0.5, 0.005)
    if abs(aY - bY) <= tolerance {
      return aX < bX
    }
    return aY < bY
  }

  private static func loadImage(uri: String) throws -> UIImage {
    let url: URL
    if let parsed = URL(string: uri), parsed.scheme != nil {
      guard parsed.isFileURL else {
        throw UnsupportedUriException(uri)
      }
      url = parsed
    } else {
      url = URL(fileURLWithPath: uri)
    }

    guard FileManager.default.fileExists(atPath: url.path) else {
      throw FileNotFoundException(url.path)
    }

    let data = try Data(contentsOf: url)
    guard let image = UIImage(data: data) else {
      throw ImageDecodeException()
    }
    return image
  }

  private static func cgOrientation(
    from orientation: UIImage.Orientation
  ) -> CGImagePropertyOrientation {
    switch orientation {
    case .up: return .up
    case .upMirrored: return .upMirrored
    case .down: return .down
    case .downMirrored: return .downMirrored
    case .left: return .left
    case .leftMirrored: return .leftMirrored
    case .right: return .right
    case .rightMirrored: return .rightMirrored
    @unknown default: return .up
    }
  }
}

internal class UnsupportedUriException: GenericException<String> {
  override var reason: String {
    "Only local file URIs are supported, received: \(param)"
  }
}

internal class FileNotFoundException: GenericException<String> {
  override var reason: String {
    "Image file was not found at: \(param)"
  }
}

internal class ImageDecodeException: Exception {
  override var reason: String {
    "Failed to decode the selected image"
  }
}
