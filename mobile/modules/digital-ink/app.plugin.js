const { withPodfileProperties, withXcodeProject } = require('expo/config-plugins');
const atLeast155 = value => {
  const [major, minor] = String(value || '0').replace(/"/g, '').split('.').map(Number);
  return major > 15 || (major === 15 && minor >= 5);
};
module.exports = config => {
  config = withPodfileProperties(config, config => {
    if (!atLeast155(config.modResults['ios.deploymentTarget'])) config.modResults['ios.deploymentTarget'] = '15.5';
    return config;
  });
  return withXcodeProject(config, config => {
    for (const item of Object.values(config.modResults.pbxXCBuildConfigurationSection())) {
      if (item?.buildSettings?.IPHONEOS_DEPLOYMENT_TARGET && !atLeast155(item.buildSettings.IPHONEOS_DEPLOYMENT_TARGET)) {
        item.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = '15.5';
      }
    }
    return config;
  });
};
