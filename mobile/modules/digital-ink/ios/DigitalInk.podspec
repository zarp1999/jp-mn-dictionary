require 'json'
package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
Pod::Spec.new do |s|
  s.name = 'DigitalInk'
  s.version = package['version']
  s.summary = package['description']
  s.description = package['description']
  s.license = 'UNLICENSED'
  s.author = 'NichiMo'
  s.homepage = 'https://developers.google.com/ml-kit/vision/digital-ink-recognition'
  s.platforms = { :ios => '15.5' }
  s.swift_version = '5.9'
  s.source = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.dependency 'GoogleMLKit/DigitalInkRecognition', '8.0.0'
  s.source_files = '**/*.{h,m,mm,swift}'
end
