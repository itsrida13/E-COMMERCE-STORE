import React, { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Store,
  Bell,
  Package,
  FileText,
  Palette,
  Save,
  RotateCcw,
} from "lucide-react";
import { getSettings, updateSettings } from "../services/api";

const defaultSettings = {
  storeName: "Glamour Beauty",
  storeEmail: "admin@glamourbeauty.com",
  storePhone: "",
  storeAddress: "",
  currency: "USD",

  defaultReorderLevel: 10,
  defaultMaxStockLevel: 100,
  expiryAlertDays: 30,
  lowStockAlerts: true,
  expiryAlerts: true,
  overstockAlerts: true,

  defaultReportFormat: "csv",
  includeInventoryValue: true,
  includeAIInsights: true,

  themeMode: "light",
  accentColor: "pink",

  emailNotifications: true,
  salesAlerts: true,
  inventoryAlerts: true,
  customerAlerts: false,
};

const SectionCard = ({ icon, title, description, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>

    <div className="p-6">{children}</div>
  </div>
);

const InputField = ({ label, name, type = "text", placeholder, value, onChange }) => (
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-1">
      {label}
    </label>

    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
    />
  </div>
);

const ToggleField = ({ label, name, description, checked, onChange }) => (
  <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-100 last:border-b-0">
    <div>
      <p className="text-sm font-semibold text-gray-800">{label}</p>
      {description && (
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      )}
    </div>

    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        name={name}
        checked={Boolean(checked)}
        onChange={onChange}
        className="sr-only peer"
      />

      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-pink-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-5 after:h-5 after:rounded-full after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
  </div>
);

export default function Settings() {
  const [settings, setSettings] = useState(defaultSettings);
  const [savedMessage, setSavedMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await getSettings();
        if (response.data) {
          // Merge with defaultSettings to ensure all keys exist
          setSettings({
            ...defaultSettings,
            ...response.data,
          });
        }
      } catch (err) {
        console.error("Error loading settings from backend:", err);
        setError("Failed to load settings from server. Using local settings.");
        
        // Local storage fallback
        const savedSettings = localStorage.getItem("glamourBeautySettings");
        if (savedSettings) {
          setSettings({
            ...defaultSettings,
            ...JSON.parse(savedSettings),
          });
        }
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    try {
      setSavedMessage("Saving settings to server...");
      const response = await updateSettings(settings);
      if (response.data) {
        setSettings({
          ...defaultSettings,
          ...response.data,
        });
      }
      
      // Also cache in localStorage
      localStorage.setItem("glamourBeautySettings", JSON.stringify(settings));
      setSavedMessage("Settings saved successfully.");
    } catch (err) {
      console.error("Error saving settings to backend:", err);
      setSavedMessage("Error saving to server. Saved locally.");
      localStorage.setItem("glamourBeautySettings", JSON.stringify(settings));
    }

    setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  };

  const handleReset = async () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all settings to default?"
    );

    if (!confirmReset) return;

    try {
      setSavedMessage("Resetting settings...");
      const response = await updateSettings(defaultSettings);
      if (response.data) {
        setSettings({
          ...defaultSettings,
          ...response.data,
        });
      } else {
        setSettings(defaultSettings);
      }

      localStorage.setItem(
        "glamourBeautySettings",
        JSON.stringify(defaultSettings)
      );

      setSavedMessage("Settings reset to default.");
    } catch (err) {
      console.error("Error resetting settings on backend:", err);
      setSettings(defaultSettings);
      localStorage.setItem(
        "glamourBeautySettings",
        JSON.stringify(defaultSettings)
      );
      setSavedMessage("Settings reset locally.");
    }

    setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-800">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold">Loading settings from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-pink-900 tracking-tight flex items-center gap-2">
              <SettingsIcon className="text-pink-600" size={30} />
              Admin Settings
            </h1>

            <p className="text-gray-500 mt-1">
              Configure store profile, inventory rules, reports, theme, and
              notifications.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
            >
              <RotateCcw size={17} />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-700 shadow-sm transition"
            >
              <Save size={17} />
              Save Settings
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {savedMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium">
            {savedMessage}
          </div>
        )}

        <form
          onSubmit={handleSave}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          <SectionCard
            icon={<Store size={21} />}
            title="Store Profile"
            description="Basic information shown in reports and admin tools."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="Store Name"
                name="storeName"
                value={settings.storeName}
                onChange={handleChange}
              />
              <InputField
                label="Store Email"
                name="storeEmail"
                type="email"
                value={settings.storeEmail}
                onChange={handleChange}
              />
              <InputField
                label="Phone Number"
                name="storePhone"
                placeholder="+92..."
                value={settings.storePhone}
                onChange={handleChange}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Currency
                </label>

                <select
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none bg-white"
                >
                  <option value="USD">USD - Dollar</option>
                  <option value="PKR">PKR - Pakistani Rupee</option>
                  <option value="KRW">KRW - Korean Won</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - Pound</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Store Address
                </label>

                <textarea
                  name="storeAddress"
                  value={settings.storeAddress}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Enter store address..."
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Package size={21} />}
            title="Inventory Settings"
            description="Default rules for stock monitoring and expiry alerts."
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
              <InputField
                label="Default Reorder Level"
                name="defaultReorderLevel"
                type="number"
                value={settings.defaultReorderLevel}
                onChange={handleChange}
              />

              <InputField
                label="Default Max Stock Level"
                name="defaultMaxStockLevel"
                type="number"
                value={settings.defaultMaxStockLevel}
                onChange={handleChange}
              />

              <InputField
                label="Expiry Alert Days"
                name="expiryAlertDays"
                type="number"
                value={settings.expiryAlertDays}
                onChange={handleChange}
              />
            </div>

            <ToggleField
              label="Low Stock Alerts"
              name="lowStockAlerts"
              description="Show warnings when products go below reorder level."
              checked={settings.lowStockAlerts}
              onChange={handleChange}
            />

            <ToggleField
              label="Expiry Alerts"
              name="expiryAlerts"
              description="Show alerts for makeup products expiring soon."
              checked={settings.expiryAlerts}
              onChange={handleChange}
            />

            <ToggleField
              label="Overstock Alerts"
              name="overstockAlerts"
              description="Detect products above maximum stock level."
              checked={settings.overstockAlerts}
              onChange={handleChange}
            />
          </SectionCard>

          <SectionCard
            icon={<FileText size={21} />}
            title="Report Settings"
            description="Configure how admin reports are generated."
          >
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Default Report Format
              </label>

              <select
                name="defaultReportFormat"
                value={settings.defaultReportFormat}
                onChange={handleChange}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none bg-white"
              >
                <option value="csv">CSV</option>
                <option value="excel" disabled>
                  Excel Coming Soon
                </option>
                <option value="pdf" disabled>
                  PDF Coming Soon
                </option>
              </select>
            </div>

            <ToggleField
              label="Include Inventory Value"
              name="includeInventoryValue"
              description="Add stock value calculation in inventory reports."
              checked={settings.includeInventoryValue}
              onChange={handleChange}
            />

            <ToggleField
              label="Include AI Insights"
              name="includeAIInsights"
              description="Add AI recommendation and warning summaries in reports."
              checked={settings.includeAIInsights}
              onChange={handleChange}
            />
          </SectionCard>

          <SectionCard
            icon={<Palette size={21} />}
            title="Theme Settings"
            description="Control the appearance of the admin dashboard."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Theme Mode
                </label>

                <select
                  name="themeMode"
                  value={settings.themeMode}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none bg-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark Coming Soon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Accent Color
                </label>

                <select
                  name="accentColor"
                  value={settings.accentColor}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none bg-white"
                >
                  <option value="pink">Pink Beauty Theme</option>
                  <option value="purple">Purple</option>
                  <option value="rose">Rose</option>
                </select>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={<Bell size={21} />}
            title="Notification Settings"
            description="Choose which admin alerts should be enabled."
          >
            <ToggleField
              label="Email Notifications"
              name="emailNotifications"
              description="Receive important store alerts by email."
              checked={settings.emailNotifications}
              onChange={handleChange}
            />

            <ToggleField
              label="Sales Alerts"
              name="salesAlerts"
              description="Notify admin when sales change significantly."
              checked={settings.salesAlerts}
              onChange={handleChange}
            />

            <ToggleField
              label="Inventory Alerts"
              name="inventoryAlerts"
              description="Notify admin about stock risks and restock needs."
              checked={settings.inventoryAlerts}
              onChange={handleChange}
            />

            <ToggleField
              label="Customer Alerts"
              name="customerAlerts"
              description="Notify admin about customer activity and retention issues."
              checked={settings.customerAlerts}
              onChange={handleChange}
            />
          </SectionCard>
        </form>
      </div>
    </div>
  );
}