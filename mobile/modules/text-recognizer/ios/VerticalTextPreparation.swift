import UIKit

/// Offline fallback for dark printed vertical text on a light background.
/// Projection separates columns/glyphs; glyphs stay upright in the horizontal strip.
/// Bounded work avoids unbounded OCR calls for noisy photos. Not a general page segmenter.
enum VerticalTextPreparation {
  struct Strip {
    let image: CGImage
    let bounds: CGRect // top-left normalized coordinates in the upright source
  }

  static func upright(_ image: UIImage) -> CGImage? {
    let longest = max(image.size.width, image.size.height)
    guard longest > 0 else { return nil }
    let scale = min(4, 1600 / longest)
    let size = CGSize(width: max(1, (image.size.width * scale).rounded()),
                      height: max(1, (image.size.height * scale).rounded()))
    let format = UIGraphicsImageRendererFormat()
    format.scale = 1
    format.opaque = true
    return UIGraphicsImageRenderer(size: size, format: format).image { context in
      UIColor.white.setFill()
      context.fill(CGRect(origin: .zero, size: size))
      image.draw(in: CGRect(origin: .zero, size: size))
    }.cgImage
  }

  private static func runs(_ values: [Int], threshold: Int, gap: Int) -> [Range<Int>] {
    var result: [Range<Int>] = []
    var start: Int? = nil
    var last = 0
    for (i, value) in values.enumerated() where value > threshold {
      if let first = start, i - last > gap + 1 {
        result.append(first..<(last + 1))
        start = i
      } else if start == nil { start = i }
      last = i
    }
    if let first = start { result.append(first..<(last + 1)) }
    return result
  }

  static func strips(_ image: CGImage) -> [Strip] {
    let w = image.width, h = image.height
    guard w > 0, h > 0, w <= 1600, h <= 1600 else { return [] }
    var pixels = [UInt8](repeating: 255, count: w * h)
    let drawn = pixels.withUnsafeMutableBytes { buffer -> Bool in
      guard let context = CGContext(data: buffer.baseAddress, width: w, height: h,
        bitsPerComponent: 8, bytesPerRow: w, space: CGColorSpaceCreateDeviceGray(),
        bitmapInfo: CGImageAlphaInfo.none.rawValue) else { return false }
      context.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
      return true
    }
    guard drawn else { return [] }
    var projection = [Int](repeating: 0, count: w)
    for y in 0..<h {
      for x in 0..<w where pixels[y * w + x] < 160 { projection[x] += 1 }
    }
    let columns = runs(projection, threshold: max(1, h / 200), gap: max(1, w / 250))
      .filter { $0.count >= 4 }
    guard !columns.isEmpty, columns.count <= 32 else { return [] }
    let widths = columns.map { $0.count }.sorted()
    let bodyWidth = widths[widths.count / 2]
    var output: [Strip] = []
    for column in columns.reversed() {
      // Narrow adjacent ruby is not reliable input to dictionary tokenization.
      guard Double(column.count) >= Double(bodyWidth) * 0.6 else { continue }
      var rows = [Int](repeating: 0, count: h)
      for y in 0..<h {
        for x in column where pixels[y * w + x] < 160 { rows[y] += 1 }
      }
      let glyphs = runs(rows, threshold: 0, gap: max(1, column.count / 10))
      guard glyphs.count >= 3, glyphs.count <= 100,
        let first = glyphs.first, let last = glyphs.last,
        last.upperBound - first.lowerBound > column.count * 3 else { continue }
      // Reject touching multi-character runs rather than fabricate character cuts.
      guard glyphs.allSatisfy({ $0.count <= column.count * 2 }) else { continue }
      let cell = 48, margin = 12
      let size = CGSize(width: glyphs.count * cell + margin * 2, height: cell + margin * 2)
      let format = UIGraphicsImageRendererFormat()
      format.scale = 1; format.opaque = true
      let strip = UIGraphicsImageRenderer(size: size, format: format).image { context in
        UIColor.white.setFill(); context.fill(CGRect(origin: .zero, size: size))
        for (index, glyph) in glyphs.enumerated() {
          let rect = CGRect(x: column.lowerBound, y: glyph.lowerBound,
                            width: column.count, height: glyph.count)
          guard let crop = image.cropping(to: rect) else { continue }
          // Uniform scale preserves the relative size of small kana and punctuation.
          let ratio = CGFloat(cell - 6) / CGFloat(column.count)
          let width = CGFloat(crop.width) * ratio
          let height = min(CGFloat(cell - 2), CGFloat(crop.height) * ratio)
          UIImage(cgImage: crop).draw(in: CGRect(x: CGFloat(margin + index * cell),
            y: CGFloat(margin) + (CGFloat(cell) - height) / 2, width: width, height: height))
        }
      }
      if let cg = strip.cgImage {
        output.append(Strip(image: cg, bounds: CGRect(
          x: Double(column.lowerBound) / Double(w), y: Double(first.lowerBound) / Double(h),
          width: Double(column.count) / Double(w),
          height: Double(last.upperBound - first.lowerBound) / Double(h))))
      }
    }
    return output
  }
}
