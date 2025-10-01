'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Globe, DollarSign, Clock, Palette, Building, 
  Shield, Bell, Database, Save, RefreshCw, Check, X,
  Sun, Moon, Monitor, Languages, Mail, Phone, Volume2,
  AlertTriangle
} from 'lucide-react';

interface SystemConfig {
  // Localization
  currency: {
    code: string;
    symbol: string;
    name: string;
    position: 'before' | 'after';
    decimal_places: number;
    thousands_separator: string;
    decimal_separator: string;
  };
  timezone: {
    zone: string;
    offset: string;
    name: string;
  };
  language: {
    code: string;
    name: string;
    direction: 'ltr' | 'rtl';
  };
  dateFormat: string;
  timeFormat: '12h' | '24h';
  
  // Appearance
  theme: {
    mode: 'light' | 'dark' | 'auto';
    primaryColor: string;
    accentColor: string;
    fontFamily: string;
    fontSize: 'small' | 'medium' | 'large';
  };
  
  // Organization
  organization: {
    name: string;
    logo: string;
    tagline: string;
    headquarters: string;
    contact_email: string;
    contact_phone: string;
    tax_id: string;
    registration_number: string;
  };
  
  // Operations
  operations: {
    fiscal_year_start: string;
    working_days: string[];
    working_hours: {
      start: string;
      end: string;
    };
    emergency_contact: string;
    auto_refresh_interval: number;
    data_retention_days: number;
    session_timeout_minutes: number;
  };
  
  // Notifications
  notifications: {
    email_enabled: boolean;
    sms_enabled: boolean;
    push_enabled: boolean;
    alert_sound: boolean;
    critical_alerts_email: string;
    daily_reports: boolean;
    weekly_summaries: boolean;
  };
  
  // Features
  features: {
    enable_telemedicine: boolean;
    enable_online_payments: boolean;
    enable_patient_portal: boolean;
    enable_mobile_app: boolean;
    enable_api_access: boolean;
    enable_data_export: boolean;
    enable_audit_logs: boolean;
    multi_language_support: boolean;
  };
}

const CURRENCIES = [
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', position: 'before' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', position: 'before' },
  { code: 'USD', symbol: '$', name: 'US Dollar', position: 'before' },
  { code: 'EUR', symbol: '€', name: 'Euro', position: 'before' },
  { code: 'GBP', symbol: '£', name: 'British Pound', position: 'before' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', position: 'before' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', position: 'before' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', position: 'before' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', position: 'before' },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', position: 'before' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', position: 'after' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', position: 'after' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', position: 'after' }
];

const TIMEZONES = [
  { zone: 'Africa/Lagos', offset: '+01:00', name: 'West Africa Time (Lagos)' },
  { zone: 'Africa/Accra', offset: '+00:00', name: 'Greenwich Mean Time (Accra)' },
  { zone: 'Africa/Johannesburg', offset: '+02:00', name: 'South Africa Time' },
  { zone: 'Africa/Cairo', offset: '+02:00', name: 'Egypt Time' },
  { zone: 'Africa/Nairobi', offset: '+03:00', name: 'East Africa Time' },
  { zone: 'Africa/Algiers', offset: '+01:00', name: 'Central European Time' },
  { zone: 'Africa/Casablanca', offset: '+01:00', name: 'Western European Time' },
  { zone: 'Europe/London', offset: '+00:00', name: 'Greenwich Mean Time' },
  { zone: 'America/New_York', offset: '-05:00', name: 'Eastern Time' },
  { zone: 'Asia/Dubai', offset: '+04:00', name: 'Gulf Standard Time' }
];

const LANGUAGES = [
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'fr', name: 'Français', direction: 'ltr' },
  { code: 'ar', name: 'العربية', direction: 'rtl' },
  { code: 'sw', name: 'Kiswahili', direction: 'ltr' },
  { code: 'yo', name: 'Yorùbá', direction: 'ltr' },
  { code: 'ha', name: 'Hausa', direction: 'ltr' },
  { code: 'ig', name: 'Igbo', direction: 'ltr' },
  { code: 'pt', name: 'Português', direction: 'ltr' },
  { code: 'es', name: 'Español', direction: 'ltr' }
];

const THEME_COLORS = [
  { name: 'Blue', primary: '#3b82f6', accent: '#60a5fa' },
  { name: 'Green', primary: '#10b981', accent: '#34d399' },
  { name: 'Purple', primary: '#8b5cf6', accent: '#a78bfa' },
  { name: 'Red', primary: '#ef4444', accent: '#f87171' },
  { name: 'Orange', primary: '#f97316', accent: '#fb923c' },
  { name: 'Teal', primary: '#14b8a6', accent: '#2dd4bf' },
  { name: 'Indigo', primary: '#6366f1', accent: '#818cf8' },
  { name: 'Pink', primary: '#ec4899', accent: '#f472b6' }
];

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'organization' | 'operations' | 'notifications' | 'features'>('general');
  const [config, setConfig] = useState<SystemConfig>({
    currency: {
      code: 'NGN',
      symbol: '₦',
      name: 'Nigerian Naira',
      position: 'before',
      decimal_places: 2,
      thousands_separator: ',',
      decimal_separator: '.'
    },
    timezone: {
      zone: 'Africa/Lagos',
      offset: '+01:00',
      name: 'West Africa Time (Lagos)'
    },
    language: {
      code: 'en',
      name: 'English',
      direction: 'ltr'
    },
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    theme: {
      mode: 'light',
      primaryColor: '#3b82f6',
      accentColor: '#60a5fa',
      fontFamily: 'Inter',
      fontSize: 'medium'
    },
    organization: {
      name: 'GrandPro HMSO',
      logo: '/logo.png',
      tagline: 'Hospital Management Service Organization',
      headquarters: 'Lagos, Nigeria',
      contact_email: 'info@grandprohmso.com',
      contact_phone: '+234 800 123 4567',
      tax_id: 'TIN123456789',
      registration_number: 'RC1234567'
    },
    operations: {
      fiscal_year_start: 'January',
      working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      working_hours: {
        start: '08:00',
        end: '17:00'
      },
      emergency_contact: '+234 800 911 911',
      auto_refresh_interval: 30,
      data_retention_days: 365,
      session_timeout_minutes: 30
    },
    notifications: {
      email_enabled: true,
      sms_enabled: true,
      push_enabled: false,
      alert_sound: true,
      critical_alerts_email: 'alerts@grandprohmso.com',
      daily_reports: true,
      weekly_summaries: true
    },
    features: {
      enable_telemedicine: true,
      enable_online_payments: true,
      enable_patient_portal: true,
      enable_mobile_app: false,
      enable_api_access: true,
      enable_data_export: true,
      enable_audit_logs: true,
      multi_language_support: true
    }
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load saved configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem('systemConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig(parsedConfig);
      } catch (error) {
        console.error('Error loading saved configuration:', error);
      }
    }
  }, []);

  const handleConfigChange = (section: keyof SystemConfig, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' 
        ? { ...prev[section], [key]: value }
        : value
    }));
    setUnsavedChanges(true);
  };

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = CURRENCIES.find(c => c.code === currencyCode);
    if (currency) {
      setConfig(prev => ({
        ...prev,
        currency: {
          ...prev.currency,
          code: currency.code,
          symbol: currency.symbol,
          name: currency.name,
          position: currency.position as 'before' | 'after'
        }
      }));
      setUnsavedChanges(true);
    }
  };

  const handleTimezoneChange = (zone: string) => {
    const timezone = TIMEZONES.find(t => t.zone === zone);
    if (timezone) {
      setConfig(prev => ({
        ...prev,
        timezone: timezone
      }));
      setUnsavedChanges(true);
    }
  };

  const handleLanguageChange = (code: string) => {
    const language = LANGUAGES.find(l => l.code === code);
    if (language) {
      setConfig(prev => ({
        ...prev,
        language: {
          code: language.code,
          name: language.name,
          direction: language.direction as 'ltr' | 'rtl'
        }
      }));
      setUnsavedChanges(true);
    }
  };

  const handleThemeColorChange = (colorName: string) => {
    const theme = THEME_COLORS.find(t => t.name === colorName);
    if (theme) {
      setConfig(prev => ({
        ...prev,
        theme: {
          ...prev.theme,
          primaryColor: theme.primary,
          accentColor: theme.accent
        }
      }));
      setUnsavedChanges(true);
    }
  };

  const saveConfiguration = async () => {
    setSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('systemConfig', JSON.stringify(config));
      
      // In a real app, this would save to the backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Apply theme changes
      if (config.theme.mode === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      // Apply primary color as CSS variable
      document.documentElement.style.setProperty('--primary-color', config.theme.primaryColor);
      document.documentElement.style.setProperty('--accent-color', config.theme.accentColor);
      
      setSaveMessage('Configuration saved successfully!');
      setUnsavedChanges(false);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving configuration');
      console.error('Error saving configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      localStorage.removeItem('systemConfig');
      window.location.reload();
    }
  };

  const formatCurrency = (amount: number) => {
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: config.currency.decimal_places,
      maximumFractionDigits: config.currency.decimal_places
    });
    
    if (config.currency.position === 'before') {
      return `${config.currency.symbol}${formatted}`;
    } else {
      return `${formatted} ${config.currency.symbol}`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8 text-blue-600" />
          System Settings
        </h1>
        <p className="text-gray-600 mt-2">Configure global system preferences and organizational settings</p>
      </div>

      {/* Save Bar */}
      {unsavedChanges && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">You have unsaved changes</span>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-yellow-600 text-yellow-600"
            >
              Discard Changes
            </Button>
            <Button 
              onClick={saveConfiguration}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${
          saveMessage.includes('success') 
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {saveMessage.includes('success') ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          {saveMessage}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 border-b">
        {[
          { id: 'general', label: 'General', icon: Globe },
          { id: 'appearance', label: 'Appearance', icon: Palette },
          { id: 'organization', label: 'Organization', icon: Building },
          { id: 'operations', label: 'Operations', icon: Clock },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'features', label: 'Features', icon: Shield }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Currency Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={config.currency.code}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Decimal Places</label>
                  <input
                    type="number"
                    min="0"
                    max="4"
                    value={config.currency.decimal_places}
                    onChange={(e) => handleConfigChange('currency', 'decimal_places', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Symbol Position</label>
                  <select
                    value={config.currency.position}
                    onChange={(e) => handleConfigChange('currency', 'position', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="before">Before Amount</option>
                    <option value="after">After Amount</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Example:</p>
                <p className="text-lg font-semibold">{formatCurrency(1234567.89)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time & Date Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={config.timezone.zone}
                  onChange={(e) => handleTimezoneChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.zone} value={tz.zone}>
                      {tz.name} ({tz.offset})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Date Format</label>
                  <select
                    value={config.dateFormat}
                    onChange={(e) => setConfig(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time Format</label>
                  <select
                    value={config.timeFormat}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeFormat: e.target.value as '12h' | '24h' }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Current Time:</p>
                <p className="text-lg font-semibold">
                  {new Date().toLocaleString('en-US', { 
                    timeZone: config.timezone.zone,
                    dateStyle: 'medium',
                    timeStyle: 'medium'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Language Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Language</label>
                <select
                  value={config.language.code}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="multiLang"
                  checked={config.features.multi_language_support}
                  onChange={(e) => handleConfigChange('features', 'multi_language_support', e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="multiLang" className="text-sm">
                  Enable multi-language support
                </label>
              </div>
              {config.language.direction === 'rtl' && (
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                  <p className="text-sm text-yellow-800">
                    RTL (Right-to-Left) layout will be applied for {config.language.name}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Appearance Settings */}
      {activeTab === 'appearance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Theme Mode</label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', icon: Sun, label: 'Light' },
                    { value: 'dark', icon: Moon, label: 'Dark' },
                    { value: 'auto', icon: Monitor, label: 'System' }
                  ].map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => handleConfigChange('theme', 'mode', mode.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                        config.theme.mode === mode.value
                          ? 'bg-blue-50 border-blue-600 text-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <mode.icon className="h-4 w-4" />
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Color Scheme</label>
                <div className="grid grid-cols-4 gap-2">
                  {THEME_COLORS.map(color => (
                    <button
                      key={color.name}
                      onClick={() => handleThemeColorChange(color.name)}
                      className={`p-3 rounded-md border-2 transition-all ${
                        config.theme.primaryColor === color.primary
                          ? 'border-gray-900 shadow-lg scale-105'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div 
                        className="w-full h-8 rounded"
                        style={{ backgroundColor: color.primary }}
                      />
                      <p className="text-xs mt-1">{color.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <select
                  value={config.theme.fontSize}
                  onChange={(e) => handleConfigChange('theme', 'fontSize', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium (Default)</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: config.theme.mode === 'dark' ? '#1f2937' : '#ffffff',
                  color: config.theme.mode === 'dark' ? '#ffffff' : '#000000'
                }}
              >
                <h3 
                  className="text-lg font-semibold mb-2"
                  style={{ color: config.theme.primaryColor }}
                >
                  Sample Dashboard View
                </h3>
                <p className={`text-${config.theme.fontSize === 'small' ? 'sm' : config.theme.fontSize === 'large' ? 'lg' : 'base'}`}>
                  This is how your content will appear with the selected theme settings.
                </p>
                <div className="mt-4 flex gap-2">
                  <button 
                    className="px-4 py-2 rounded text-white"
                    style={{ backgroundColor: config.theme.primaryColor }}
                  >
                    Primary Button
                  </button>
                  <button 
                    className="px-4 py-2 rounded"
                    style={{ 
                      backgroundColor: config.theme.accentColor,
                      color: '#ffffff'
                    }}
                  >
                    Accent Button
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Organization Settings */}
      {activeTab === 'organization' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Organization Name</label>
                  <input
                    type="text"
                    value={config.organization.name}
                    onChange={(e) => handleConfigChange('organization', 'name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tagline</label>
                  <input
                    type="text"
                    value={config.organization.tagline}
                    onChange={(e) => handleConfigChange('organization', 'tagline', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Headquarters</label>
                  <input
                    type="text"
                    value={config.organization.headquarters}
                    onChange={(e) => handleConfigChange('organization', 'headquarters', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={config.organization.contact_email}
                    onChange={(e) => handleConfigChange('organization', 'contact_email', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={config.organization.contact_phone}
                    onChange={(e) => handleConfigChange('organization', 'contact_phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tax ID</label>
                  <input
                    type="text"
                    value={config.organization.tax_id}
                    onChange={(e) => handleConfigChange('organization', 'tax_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={config.organization.registration_number}
                    onChange={(e) => handleConfigChange('organization', 'registration_number', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Logo URL</label>
                  <input
                    type="text"
                    value={config.organization.logo}
                    onChange={(e) => handleConfigChange('organization', 'logo', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="/logo.png"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Operations Settings */}
      {activeTab === 'operations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Hours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Working Days</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                    <label key={day} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.operations.working_days.includes(day)}
                        onChange={(e) => {
                          const days = e.target.checked
                            ? [...config.operations.working_days, day]
                            : config.operations.working_days.filter(d => d !== day);
                          handleConfigChange('operations', 'working_days', days);
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time</label>
                  <input
                    type="time"
                    value={config.operations.working_hours.start}
                    onChange={(e) => handleConfigChange('operations', 'working_hours', {
                      ...config.operations.working_hours,
                      start: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Time</label>
                  <input
                    type="time"
                    value={config.operations.working_hours.end}
                    onChange={(e) => handleConfigChange('operations', 'working_hours', {
                      ...config.operations.working_hours,
                      end: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fiscal Year Start</label>
                <select
                  value={config.operations.fiscal_year_start}
                  onChange={(e) => handleConfigChange('operations', 'fiscal_year_start', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Operations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Auto-Refresh Interval (seconds)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={config.operations.auto_refresh_interval}
                  onChange={(e) => handleConfigChange('operations', 'auto_refresh_interval', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={config.operations.session_timeout_minutes}
                  onChange={(e) => handleConfigChange('operations', 'session_timeout_minutes', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="3650"
                  value={config.operations.data_retention_days}
                  onChange={(e) => handleConfigChange('operations', 'data_retention_days', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  value={config.operations.emergency_contact}
                  onChange={(e) => handleConfigChange('operations', 'emergency_contact', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Settings */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={config.notifications.email_enabled}
                    onChange={(e) => handleConfigChange('notifications', 'email_enabled', e.target.checked)}
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    SMS Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={config.notifications.sms_enabled}
                    onChange={(e) => handleConfigChange('notifications', 'sms_enabled', e.target.checked)}
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Push Notifications
                  </span>
                  <input
                    type="checkbox"
                    checked={config.notifications.push_enabled}
                    onChange={(e) => handleConfigChange('notifications', 'push_enabled', e.target.checked)}
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    Alert Sounds
                  </span>
                  <input
                    type="checkbox"
                    checked={config.notifications.alert_sound}
                    onChange={(e) => handleConfigChange('notifications', 'alert_sound', e.target.checked)}
                    className="toggle"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Critical Alerts Email
                </label>
                <input
                  type="email"
                  value={config.notifications.critical_alerts_email}
                  onChange={(e) => handleConfigChange('notifications', 'critical_alerts_email', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="alerts@example.com"
                />
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.notifications.daily_reports}
                    onChange={(e) => handleConfigChange('notifications', 'daily_reports', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Send daily reports</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.notifications.weekly_summaries}
                    onChange={(e) => handleConfigChange('notifications', 'weekly_summaries', e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Send weekly summaries</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features Settings */}
      {activeTab === 'features' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Services</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'enable_telemedicine', label: 'Telemedicine Services' },
                { key: 'enable_online_payments', label: 'Online Payments' },
                { key: 'enable_patient_portal', label: 'Patient Portal' },
                { key: 'enable_mobile_app', label: 'Mobile App Support' }
              ].map(feature => (
                <label key={feature.key} className="flex items-center justify-between">
                  <span className="text-sm">{feature.label}</span>
                  <input
                    type="checkbox"
                    checked={config.features[feature.key as keyof typeof config.features]}
                    onChange={(e) => handleConfigChange('features', feature.key, e.target.checked)}
                    className="toggle"
                  />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'enable_api_access', label: 'API Access' },
                { key: 'enable_data_export', label: 'Data Export' },
                { key: 'enable_audit_logs', label: 'Audit Logs' },
                { key: 'multi_language_support', label: 'Multi-Language Support' }
              ].map(feature => (
                <label key={feature.key} className="flex items-center justify-between">
                  <span className="text-sm">{feature.label}</span>
                  <input
                    type="checkbox"
                    checked={config.features[feature.key as keyof typeof config.features]}
                    onChange={(e) => handleConfigChange('features', feature.key, e.target.checked)}
                    className="toggle"
                  />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Feature Status Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(config.features).map(([key, enabled]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className="text-sm capitalize">
                      {key.replace(/_/g, ' ').replace('enable ', '')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Button */}
      <div className="mt-8 flex justify-end">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="text-red-600 border-red-600 hover:bg-red-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
}
