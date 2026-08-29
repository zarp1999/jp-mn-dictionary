const { withPodfile, createRunOncePlugin } = require('expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const pkg = require('./package.json');

const POST_INSTALL_SNIPPET = `
    installer.pods_project.targets.each do |target|
      next unless target.name.include?('mecab')
      target.build_configurations.each do |config|
        config.build_settings['CLANG_CXX_LANGUAGE_STANDARD'] = 'gnu++14'
        config.build_settings['GCC_TREAT_WARNINGS_AS_ERRORS'] = 'NO'
        flags = Array(config.build_settings['OTHER_CPLUSPLUSFLAGS'] || ['$(inherited)'])
        flags = ['$(inherited)'] if flags.is_a?(String)
        %w[
          -Wno-register
          -Wno-deprecated-register
          -Wno-shorten-64-to-32
          -D_LIBCPP_ENABLE_CXX17_REMOVED_UNARY_BINARY_FUNCTION
          -D_LIBCPP_ENABLE_CXX17_REMOVED_FEATURES
        ].each do |flag|
          flags << flag unless flags.include?(flag)
        end
        config.build_settings['OTHER_CPLUSPLUSFLAGS'] = flags
        cflags = Array(config.build_settings['OTHER_CFLAGS'] || ['$(inherited)'])
        cflags = ['$(inherited)'] if cflags.is_a?(String)
        %w[-Wno-register -Wno-deprecated-register].each do |flag|
          cflags << flag unless cflags.include?(flag)
        end
        config.build_settings['OTHER_CFLAGS'] = cflags
      end
    end
`;

function withMecabCompilerFlags(config) {
  return withPodfile(config, (config) => {
    const result = mergeContents({
      src: config.modResults.contents,
      newSrc: POST_INSTALL_SNIPPET,
      tag: 'mecab-register-flags',
      anchor: /post_install do \|installer\|/,
      offset: 1,
      comment: '#',
    });

    if (!result.didMerge) {
      throw new Error(
        '[japanese-tokenizer] Could not find `post_install do |installer|` in the iOS Podfile',
      );
    }

    config.modResults.contents = result.contents;
    return config;
  });
}

module.exports = createRunOncePlugin(
  withMecabCompilerFlags,
  pkg.name,
  pkg.version,
);
