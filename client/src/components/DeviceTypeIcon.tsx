import React, { useState } from 'react';

interface DeviceTypeIconProps {
  icon: string;
  className?: string;
  size?: number;
}

export const DEVICE_TYPE_ICONS: Record<string, string> = {
  // Mobile Devices
  "Cep Telefonu": "/device-types/smartphone.svg",
  "Tablet": "/device-types/tablet.svg",
  "Basit Telefon": "/device-types/feature-phone.svg",
  "Katlanabilir Telefon": "/device-types/foldable.svg",

  // Computers
  "Dizüstü Bilgisayar": "/device-types/laptop.svg",
  "Masaüstü Bilgisayar": "/device-types/desktop.svg",
  "Tümü Bir Arada": "/device-types/all-in-one.svg",
  "Sunucu": "/device-types/server.svg",
  "İş İstasyonu": "/device-types/workstation.svg",

  // Wearables
  "Akıllı Saat": "/device-types/smartwatch.svg",
  "Fitness Takipçi": "/device-types/fitness-tracker.svg",
  "Akıllı Bileklik": "/device-types/smart-band.svg",

  // Audio
  "Kablosuz Kulaklık": "/device-types/earbuds.svg",
  "Kulaklık": "/device-types/headphones.svg",
  "Hoparlör": "/device-types/speaker.svg",
  "Ses Sistemi": "/device-types/soundbar.svg",

  // TV & Display
  "Akıllı TV": "/device-types/smart-tv.svg",
  "Monitör": "/device-types/monitor.svg",
  "Projeksiyon": "/device-types/projector.svg",

  // Gaming
  "Oyun Konsolu": "/device-types/gaming-console.svg",
  "Oyun Bilgisayarı": "/device-types/gaming-pc.svg",
  "Oyun Dizüstü": "/device-types/gaming-laptop.svg",
  "Oyun Monitörü": "/device-types/gaming-monitor.svg",
  "Oyun Kulaklığı": "/device-types/gaming-headset.svg",

  // Networking
  "Router": "/device-types/router.svg",
  "Modem": "/device-types/modem.svg",
  "Switch": "/device-types/switch.svg",
  "Erişim Noktası": "/device-types/access-point.svg",

  // Storage
  "Harici Disk": "/device-types/external-hdd.svg",
  "Harici SSD": "/device-types/external-ssd.svg",
  "Ağ Depolama": "/device-types/nas.svg",
  "USB Bellek": "/device-types/usb-drive.svg",

  // Printers & Scanners
  "Yazıcı": "/device-types/printer.svg",
  "Tarayıcı": "/device-types/scanner.svg",
  "Çok Fonksiyonlu Yazıcı": "/device-types/all-in-one-printer.svg",

  // Other
  "Kamera": "/device-types/camera.svg",
  "Drone": "/device-types/drone.svg",
  "Akıllı Ev Merkezi": "/device-types/smart-home-hub.svg",
  "Akıllı Ekran": "/device-types/smart-display.svg",
  "Akıllı Hoparlör": "/device-types/smart-speaker.svg",
  "Akıllı Kilit": "/device-types/smart-lock.svg",
  "Akıllı Termostat": "/device-types/smart-thermostat.svg",
  "Akıllı Ampul": "/device-types/smart-bulb.svg",
  "Akıllı Priz": "/device-types/smart-plug.svg",
  "Akıllı Sensör": "/device-types/smart-sensor.svg"
};

const DEVICE_TYPE_EMOJIS: Record<string, string> = {
  // Mobile Devices
  "Cep Telefonu": "📱",
  "Tablet": "📱",
  "Basit Telefon": "📱",
  "Katlanabilir Telefon": "📱",

  // Computers
  "Dizüstü Bilgisayar": "💻",
  "Masaüstü Bilgisayar": "🖥️",
  "Tümü Bir Arada": "🖥️",
  "Sunucu": "🖥️",
  "İş İstasyonu": "💻",

  // Wearables
  "Akıllı Saat": "⌚",
  "Fitness Takipçi": "⌚",
  "Akıllı Bileklik": "⌚",

  // Audio
  "Kablosuz Kulaklık": "🎧",
  "Kulaklık": "🎧",
  "Hoparlör": "🔊",
  "Ses Sistemi": "🔊",

  // TV & Display
  "Akıllı TV": "📺",
  "Monitör": "🖥️",
  "Projeksiyon": "📽️",

  // Gaming
  "Oyun Konsolu": "🎮",
  "Oyun Bilgisayarı": "🖥️",
  "Oyun Dizüstü": "💻",
  "Oyun Monitörü": "🖥️",
  "Oyun Kulaklığı": "🎧",

  // Networking
  "Router": "📡",
  "Modem": "📡",
  "Switch": "📡",
  "Erişim Noktası": "📡",

  // Storage
  "Harici Disk": "💾",
  "Harici SSD": "💾",
  "Ağ Depolama": "💾",
  "USB Bellek": "💾",

  // Printers & Scanners
  "Yazıcı": "🖨️",
  "Tarayıcı": "📷",
  "Çok Fonksiyonlu Yazıcı": "🖨️",

  // Other
  "Kamera": "📷",
  "Drone": "🚁",
  "Akıllı Ev Merkezi": "🏠",
  "Akıllı Ekran": "🖥️",
  "Akıllı Hoparlör": "🔊",
  "Akıllı Kilit": "🔒",
  "Akıllı Termostat": "🌡️",
  "Akıllı Ampul": "💡",
  "Akıllı Priz": "🔌",
  "Akıllı Sensör": "📡"
};

// List of device types that have SVG files
const AVAILABLE_SVG_DEVICE_TYPES = new Set([
  'Cep Telefonu', 'Tablet', 'Dizüstü Bilgisayar', 'Masaüstü Bilgisayar', 'Akıllı Saat', 'Kablosuz Kulaklık',
  'Kulaklık', 'Akıllı TV', 'Monitör', 'Oyun Konsolu', 'Router', 'Yazıcı',
  'Kamera', 'Akıllı Ev Merkezi', 'Akıllı Ekran', 'Akıllı Hoparlör'
]);

export const DeviceTypeIcon: React.FC<DeviceTypeIconProps> = ({ icon, className = '', size = 24 }) => {
  const [imageError, setImageError] = useState(false);
  
  const iconPath = DEVICE_TYPE_ICONS[icon];
  const emoji = DEVICE_TYPE_EMOJIS[icon];
  const hasSvg = iconPath && AVAILABLE_SVG_DEVICE_TYPES.has(icon);

  // Fallback component for when image fails or SVG not available
  const FallbackIcon = () => (
    <div 
      className={`inline-flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
      style={{ 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: `${size * 0.6}px`,
        backgroundColor: '#f3f4f6',
        borderRadius: '4px',
        color: '#374151'
      }}
      title={icon}
    >
      {emoji || icon.charAt(0).toUpperCase()}
    </div>
  );

  if (!hasSvg || imageError) {
    return <FallbackIcon />;
  }

  return (
    <div 
      className={`inline-flex items-center justify-center ${className}`}
      style={{ 
        width: size, 
        height: size,
        minWidth: size,
        minHeight: size,
        backgroundColor: '#ffffff',
        borderRadius: '4px',
        padding: '2px'
      }}
      title={icon}
    >
      <img 
        src={iconPath}
        alt={`${icon} icon`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onError={() => {
          // Use React state instead of direct DOM manipulation
          setImageError(true);
        }}
      />
    </div>
  );
}; 