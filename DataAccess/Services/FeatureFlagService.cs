using System;
using System.Collections.Generic;

namespace DataAccess.Services
{
    public class FeatureFlagService
    {
        private readonly Dictionary<string, bool> _flags = new(StringComparer.OrdinalIgnoreCase)
        {
            ["SmartShuffle"] = true,
            ["NewAudioEngine"] = false
        };

        public bool IsEnabled(string featureKey)
        {
            return _flags.TryGetValue(featureKey, out var enabled) && enabled;
        }

        public void SetFeature(string featureKey, bool enabled)
        {
            _flags[featureKey] = enabled;
        }
    }
}
