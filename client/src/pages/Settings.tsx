import { useEffect, useState } from 'react';
import { getSettings, updateSettings, Settings as SettingsType } from '@/api/settings';
import { useSnackbar } from 'notistack';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Settings as SettingsIcon, Bell, Globe, Shield, CreditCard, Users } from 'lucide-react'
import { PageContainer } from '@/components/PageContainer'
import { useTranslation } from 'react-i18next';
import { navigation } from '@/components/Sidebar';

export function Settings() {
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch settings on mount
  useEffect(() => {
    setLoading(true);
    getSettings()
      .then((data) => {
        // Eğer defaultLanguage yoksa Türkçe olarak ayarla
        if (!data.defaultLanguage) data.defaultLanguage = 'tr';
        setSettings(data);
      })
      .catch(() => enqueueSnackbar('Ayarlar yüklenemedi', { variant: 'error' }))
      .finally(() => setLoading(false));
  }, [enqueueSnackbar]);

  // Handlers for each field
  const handleChange = (field: keyof SettingsType, value: any) => {
    setSettings((prev) => prev ? { ...prev, [field]: value } : prev);
  };
  const handleNestedChange = (section: keyof SettingsType, field: string, value: any) => {
    setSettings((prev) => prev ? { ...prev, [section]: { ...((prev as any)[section]), [field]: value } } : prev);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      enqueueSnackbar('Ayarlar kaydedildi', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar('Ayarlar kaydedilemedi', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-lg">Yükleniyor...</div>;
  }

  return (
    <PageContainer title={t('settings.title')} description={t('settings.description')}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('settings.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t('settings.description')}
          </p>
        </div>
        <div className="grid gap-6">
          {/* General Settings */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5" />
                <span>{t('settings.general')}</span>
              </CardTitle>
              <CardDescription>{t('settings.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">{t('settings.businessName')}</Label>
                  <Input id="businessName" value={settings.businessName} onChange={e => handleChange('businessName', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessPhone">{t('settings.businessPhone')}</Label>
                  <Input id="businessPhone" value={settings.businessPhone} onChange={e => handleChange('businessPhone', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessEmail">{t('settings.businessEmail')}</Label>
                  <Input id="businessEmail" type="email" value={settings.businessEmail} onChange={e => handleChange('businessEmail', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                  <Select value={settings.timezone} onValueChange={v => handleChange('timezone', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="america/new_york">Eastern Time (ET)</SelectItem>
                      <SelectItem value="america/chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="america/denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="america/los_angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="europe/london">London (GMT)</SelectItem>
                      <SelectItem value="europe/berlin">Berlin (CET)</SelectItem>
                      <SelectItem value="europe/istanbul">Istanbul (TRT)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessAddress">{t('settings.businessAddress')}</Label>
                <Input id="businessAddress" value={settings.businessAddress} onChange={e => handleChange('businessAddress', e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Language & Localization */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="w-5 h-5" />
                <span>{t('settings.language')}</span>
              </CardTitle>
              <CardDescription>{t('settings.language')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('settings.language')}</Label>
                  <Select value={settings.defaultLanguage || 'tr'} onValueChange={v => handleChange('defaultLanguage', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="tr">🇹🇷 Türkçe</SelectItem>
                      <SelectItem value="de">🇩🇪 Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('settings.currency')}</Label>
                  <Select value={settings.defaultCurrency} onValueChange={v => handleChange('defaultCurrency', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="try">TRY (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-detect customer language</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Automatically set customer language based on phone country code
                    </p>
                  </div>
                  <Switch checked={settings.autoDetectCustomerLanguage} onCheckedChange={v => handleChange('autoDetectCustomerLanguage', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show language flags</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Display country flags next to language options
                    </p>
                  </div>
                  <Switch checked={settings.showLanguageFlags} onCheckedChange={v => handleChange('showLanguageFlags', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>Configure how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch checked={settings.notifications.email} onCheckedChange={v => handleNestedChange('notifications', 'email', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Receive critical alerts via SMS
                    </p>
                  </div>
                  <Switch checked={settings.notifications.sms} onCheckedChange={v => handleNestedChange('notifications', 'sms', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Get notified when inventory is running low
                    </p>
                  </div>
                  <Switch checked={settings.notifications.lowStock} onCheckedChange={v => handleNestedChange('notifications', 'lowStock', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Order Status Updates</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Notify when order status changes
                    </p>
                  </div>
                  <Switch checked={settings.notifications.orderStatus} onCheckedChange={v => handleNestedChange('notifications', 'orderStatus', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security</span>
              </CardTitle>
              <CardDescription>Manage security settings and access controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Switch checked={settings.security.twoFactorAuth} onCheckedChange={v => handleNestedChange('security', 'twoFactorAuth', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Timeout</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Automatically log out after inactivity
                    </p>
                  </div>
                  <Select value={settings.security.sessionTimeout} onValueChange={v => handleNestedChange('security', 'sessionTimeout', v)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Change Password</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input type="password" placeholder="Current password" disabled />
                  <Input type="password" placeholder="New password" disabled />
                </div>
                <Button size="sm" className="mt-2" disabled>Update Password</Button>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>User Management</span>
              </CardTitle>
              <CardDescription>Manage team members and their access levels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Default User Role</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Default role assigned to new users
                    </p>
                  </div>
                  <Select value={settings.userManagement.defaultUserRole} onValueChange={v => handleNestedChange('userManagement', 'defaultUserRole', v)}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technician">Technician</SelectItem>
                      <SelectItem value="staff">Branch Staff</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      New users must verify their email address
                    </p>
                  </div>
                  <Switch checked={settings.userManagement.requireEmailVerification} onCheckedChange={v => handleNestedChange('userManagement', 'requireEmailVerification', v)} className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Visibility */}
          <Card className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl border-slate-200/50 dark:border-slate-700/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>{t('settings.sidebarVisibility', 'Sidebar Visibility')}</span>
              </CardTitle>
              <CardDescription>{t('settings.sidebarVisibilityDesc', 'Control which pages are visible in the sidebar for admins.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {navigation.map((item, idx) => {
                if ('items' in item) {
                  return (
                    <div key={item.title} className="mb-2">
                      <div className="font-semibold text-sm mb-1">{t(`sidebar.${item.title}`)}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.items.map(subItem => (
                          <div key={subItem.href} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                            <div className="flex items-center gap-2">
                              <subItem.icon className="w-4 h-4" />
                              <span>{t(`sidebar.${subItem.title}`)}</span>
                            </div>
                            <Switch
                              checked={settings.sidebarVisibility?.[subItem.href] !== false}
                              onCheckedChange={v => handleChange('sidebarVisibility', { ...settings.sidebarVisibility, [subItem.href]: v })}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                } else {
                  return (
                    <div key={item.href} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 rounded">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4" />
                        <span>{t(`sidebar.${item.title}`)}</span>
                      </div>
                      <Switch
                        checked={settings.sidebarVisibility?.[item.href] !== false}
                        onCheckedChange={v => handleChange('sidebarVisibility', { ...settings.sidebarVisibility, [item.href]: v })}
                      />
                    </div>
                  )
                }
              })}
            </CardContent>
          </Card>

          {/* Save Settings */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" disabled={saving || loading}>{t('settings.reset')}</Button>
            <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700" onClick={handleSave} disabled={saving || loading}>
              {saving ? t('settings.save') + '...' : t('settings.save')}
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}