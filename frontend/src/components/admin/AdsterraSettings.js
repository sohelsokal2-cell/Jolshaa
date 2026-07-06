import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

const AdsterraSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    API.get('/adsterra/settings')
      .then(res => setSettings(res.data))
      .catch(() => setSettings({
        enabled: false,
        publisherId: '',
        popunder: { enabled: false, script: '' },
        socialBar: { enabled: false, script: '' },
        nativeBanner: { enabled: false, script: '' },
        video: { enabled: false, script: '' },
        adFrequency: 3,
        videoAdFrequency: 1,
        allowedPages: [],
        blockedPages: [],
      }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await API.put('/adsterra/settings', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateFormat = (format, field, value) => {
    setSettings(prev => ({
      ...prev,
      [format]: { ...prev[format], [field]: value },
    }));
  };

  if (loading) {
    return <div className="text-center py-8 text-jolshaa-on-surface-variant">Loading...</div>;
  }

  const tabs = [
    { key: 'general', label: 'General' },
    { key: 'popunder', label: 'Popunder' },
    { key: 'socialbar', label: 'Social Bar' },
    { key: 'native', label: 'Native Banner' },
    { key: 'video', label: 'Video' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-jolshaa-on-surface">Adsterra Ad Network</h2>
        <div className="flex items-center gap-3">
          {message && (
            <span className={`text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-jolshaa-outline-variant">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-jolshaa-teal text-jolshaa-teal'
                : 'border-transparent text-jolshaa-on-surface-variant hover:text-jolshaa-on-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-medium text-jolshaa-on-surface">Enable Adsterra Ads</h3>
              <p className="text-sm text-jolshaa-on-surface-variant">Turn on/off all Adsterra ads</p>
            </div>
            <button
              onClick={() => setSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-12 h-6 rounded-full transition-colors ${settings.enabled ? 'bg-green-500' : 'bg-jolshaa-surface-container-high'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <Input
            label="Publisher ID"
            value={settings.publisherId}
            onChange={e => setSettings(prev => ({ ...prev, publisherId: e.target.value }))}
            placeholder="Your Adsterra Publisher ID"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad Frequency (Feed)"
              type="number"
              min="1"
              max="10"
              value={settings.adFrequency}
              onChange={e => setSettings(prev => ({ ...prev, adFrequency: parseInt(e.target.value) || 3 }))}
              helperText="Show ad every N posts"
            />
            <Input
              label="Video Ad Frequency"
              type="number"
              min="1"
              max="10"
              value={settings.videoAdFrequency}
              onChange={e => setSettings(prev => ({ ...prev, videoAdFrequency: parseInt(e.target.value) || 1 }))}
              helperText="Show ad every N videos"
            />
          </div>
        </Card>
      )}

      {/* Popunder Settings */}
      {activeTab === 'popunder' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-medium text-jolshaa-on-surface">Popunder Ads</h3>
              <p className="text-sm text-jolshaa-on-surface-variant">Full page ads that open in a new tab on first click</p>
            </div>
            <button
              onClick={() => updateFormat('popunder', 'enabled', !settings.popunder?.enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${settings.popunder?.enabled ? 'bg-green-500' : 'bg-jolshaa-surface-container-high'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.popunder?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">
              Script Tag (from Adsterra)
            </label>
            <textarea
              value={settings.popunder?.script || ''}
              onChange={e => updateFormat('popunder', 'script', e.target.value)}
              placeholder='<script src="https://..." data-cfasync="false" type="text/javascript"></script>'
              rows={4}
              className="w-full px-3 py-2 border border-jolshaa-outline-variant rounded-lg bg-jolshaa-surface-container-lowest text-sm font-mono"
            />
            <p className="text-xs text-jolshaa-on-surface-variant/60 mt-1">
              Get this from Adsterra Dashboard → Websites → Get Code → Popunder
            </p>
          </div>
        </Card>
      )}

      {/* Social Bar Settings */}
      {activeTab === 'socialbar' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-medium text-jolshaa-on-surface">Social Bar Ads</h3>
              <p className="text-sm text-jolshaa-on-surface-variant">Push notification style floating ads</p>
            </div>
            <button
              onClick={() => updateFormat('socialBar', 'enabled', !settings.socialBar?.enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${settings.socialBar?.enabled ? 'bg-green-500' : 'bg-jolshaa-surface-container-high'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.socialBar?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">
              Script Tag (from Adsterra)
            </label>
            <textarea
              value={settings.socialBar?.script || ''}
              onChange={e => updateFormat('socialBar', 'script', e.target.value)}
              placeholder='<script src="https://..." data-cfasync="false" type="text/javascript"></script>'
              rows={4}
              className="w-full px-3 py-2 border border-jolshaa-outline-variant rounded-lg bg-jolshaa-surface-container-lowest text-sm font-mono"
            />
            <p className="text-xs text-jolshaa-on-surface-variant/60 mt-1">
              Get this from Adsterra Dashboard → Websites → Get Code → Social Bar
            </p>
          </div>
        </Card>
      )}

      {/* Native Banner Settings */}
      {activeTab === 'native' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-medium text-jolshaa-on-surface">Native Banner Ads</h3>
              <p className="text-sm text-jolshaa-on-surface-variant">Content-style ads that blend with feed</p>
            </div>
            <button
              onClick={() => updateFormat('nativeBanner', 'enabled', !settings.nativeBanner?.enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${settings.nativeBanner?.enabled ? 'bg-green-500' : 'bg-jolshaa-surface-container-high'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.nativeBanner?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">
              Script Tag (from Adsterra)
            </label>
            <textarea
              value={settings.nativeBanner?.script || ''}
              onChange={e => updateFormat('nativeBanner', 'script', e.target.value)}
              placeholder='<script src="https://..." data-cfasync="false" type="text/javascript"></script>'
              rows={4}
              className="w-full px-3 py-2 border border-jolshaa-outline-variant rounded-lg bg-jolshaa-surface-container-lowest text-sm font-mono"
            />
            <p className="text-xs text-jolshaa-on-surface-variant/60 mt-1">
              Get this from Adsterra Dashboard → Websites → Get Code → Native Banner
            </p>
          </div>
        </Card>
      )}

      {/* Video Settings */}
      {activeTab === 'video' && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-medium text-jolshaa-on-surface">Video Ads</h3>
              <p className="text-sm text-jolshaa-on-surface-variant">Pre-roll or mid-roll video advertisements</p>
            </div>
            <button
              onClick={() => updateFormat('video', 'enabled', !settings.video?.enabled)}
              className={`w-12 h-6 rounded-full transition-colors ${settings.video?.enabled ? 'bg-green-500' : 'bg-jolshaa-surface-container-high'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.video?.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-jolshaa-on-surface-variant mb-1">
              Script Tag (from Adsterra)
            </label>
            <textarea
              value={settings.video?.script || ''}
              onChange={e => updateFormat('video', 'script', e.target.value)}
              placeholder='<script src="https://..." data-cfasync="false" type="text/javascript"></script>'
              rows={4}
              className="w-full px-3 py-2 border border-jolshaa-outline-variant rounded-lg bg-jolshaa-surface-container-lowest text-sm font-mono"
            />
            <p className="text-xs text-jolshaa-on-surface-variant/60 mt-1">
              Get this from Adsterra Dashboard → Websites → Get Code → Video
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AdsterraSettings;
