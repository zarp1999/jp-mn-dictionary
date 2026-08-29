import ExpoModulesCore
import mecab_ko

public class JapaneseTokenizerModule: Module {
  private var mecab: Mecab?

  public func definition() -> ModuleDefinition {
    Name("JapaneseTokenizer")

    AsyncFunction("tokenize") { (text: String) -> [[String: String]] in
      let analyzer = try self.getMecab()
      let nodes = analyzer.parseToNode(with: text, calculateTrailingWhitespace: false) ?? []
      return nodes.compactMap { Self.mapNode($0) }
    }
  }

  private func getMecab() throws -> Mecab {
    if let mecab {
      return mecab
    }

    guard let dicDirPath = Self.findDictionaryPath() else {
      throw DictionaryNotFoundException()
    }

    guard let instance = Mecab(dicDirPath: dicDirPath) else {
      throw MecabInitException()
    }

    mecab = instance
    return instance
  }

  private static func findDictionaryPath() -> String? {
    var names = ["mecab-naist-jdic", "mecab-naist-jdic-utf-8"]
    names.insert(DEFAULT_JAPANESE_RESOURCES_BUNDLE_NAME, at: 0)

    let bundles = [Bundle.main] + Bundle.allBundles + Bundle.allFrameworks
    for bundle in bundles {
      for name in names {
        guard let bundlePath = bundle.path(forResource: name, ofType: "bundle") else {
          continue
        }
        if let resourcePath = Bundle(path: bundlePath)?.resourcePath {
          return resourcePath
        }
      }
    }

    return nil
  }

  private static func mapNode(_ node: MecabNode) -> [String: String]? {
    let surface = node.surface
    if surface.isEmpty {
      return nil
    }

    let features = node.features ?? []
    if features.first == "BOS/EOS" {
      return nil
    }

    let pos = feature(features, 0)
    let posDetail1 = feature(features, 1)
    let basicForm = feature(features, 6)
    let reading = feature(features, 7)

    return [
      "surface_form": surface,
      "pos": pos,
      "pos_detail_1": posDetail1,
      "basic_form": basicForm == "*" ? surface : basicForm,
      "reading": reading == "*" ? "" : reading,
    ]
  }

  private static func feature(_ features: [String], _ index: Int) -> String {
    guard index < features.count else {
      return "*"
    }
    let value = features[index]
    return value.isEmpty ? "*" : value
  }
}

internal class DictionaryNotFoundException: Exception {
  override var reason: String {
    "MeCab dictionary bundle was not found in the app"
  }
}

internal class MecabInitException: Exception {
  override var reason: String {
    "Failed to initialize MeCab"
  }
}
