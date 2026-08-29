package expo.modules.japanesetokenizer

import com.atilika.kuromoji.ipadic.Tokenizer
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class JapaneseTokenizerModule : Module() {
  private val tokenizer by lazy { Tokenizer() }

  override fun definition() = ModuleDefinition {
    Name("JapaneseTokenizer")

    AsyncFunction("tokenize") { text: String ->
      synchronized(tokenizer) {
        tokenizer.tokenize(text).map { token ->
          val baseForm = token.baseForm
          val resolvedBase = if (baseForm.isNullOrBlank() || baseForm == "*") {
            token.surface
          } else {
            baseForm
          }
          mapOf(
            "surface_form" to token.surface,
            "pos" to token.partOfSpeechLevel1,
            "pos_detail_1" to token.partOfSpeechLevel2,
            "basic_form" to resolvedBase,
            "reading" to (token.reading ?: ""),
          )
        }
      }
    }
  }
}
