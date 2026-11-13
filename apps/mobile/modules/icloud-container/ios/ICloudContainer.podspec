Pod::Spec.new do |s|
  s.name           = 'ICloudContainer'
  s.version        = '1.0.0'
  s.summary        = "The app's iCloud Drive folder (ubiquity container) for my finance health"
  s.description    = s.summary
  s.license        = 'UNLICENSED'
  s.author         = 'my finance health'
  s.homepage       = 'https://github.com/expo/expo'
  s.platforms      = { :ios => '16.4' }
  s.swift_version  = '5.9'
  s.source         = { :git => '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES'
  }

  s.source_files = "**/*.{h,m,swift}"
end
