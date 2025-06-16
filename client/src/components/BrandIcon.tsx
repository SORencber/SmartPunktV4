import React from 'react';
import type { Brand } from '@/api/brands';

interface BrandIconProps {
  brand?: string | Brand;
  className?: string;
  size?: number;
}

const BRAND_ICONS: Record<string, string> = {
  // Premium Brands
  "Apple": "/brands/apple.svg",
  "Samsung": "/brands/samsung.svg",
  "Google": "/brands/google.svg",
  "Sony": "/brands/sony.svg",
  "Microsoft": "/brands/microsoft.svg",
  "BlackBerry": "/brands/blackberry.svg",
  "Nothing": "/brands/nothing.svg",

  // Major Chinese Brands
  "Xiaomi": "/brands/xiaomi.svg",
  "Huawei": "/brands/huawei.svg",
  "OPPO": "/brands/oppo.svg",
  "Vivo": "/brands/vivo.svg",
  "Realme": "/brands/realme.svg",
  "OnePlus": "/brands/oneplus.svg",
  "Honor": "/brands/honor.svg",
  "Meizu": "/brands/meizu.svg",
  "iQOO": "/brands/iqoo.svg",
  "POCO": "/brands/poco.svg",
  "Nubia": "/brands/nubia.svg",
  "ZTE": "/brands/zte.svg",

  // Traditional Brands
  "Motorola": "/brands/motorola.svg",
  "Nokia": "/brands/nokia.svg",
  "LG": "/brands/lg.svg",
  "HTC": "/brands/htc.svg",
  "Asus": "/brands/asus.svg",
  "Lenovo": "/brands/lenovo.svg",
  "Sharp": "/brands/sharp.svg",
  "Panasonic": "/brands/panasonic.svg",
  "Alcatel": "/brands/alcatel.svg",

  // Budget Brands
  "Tecno": "/brands/tecno.svg",
  "Infinix": "/brands/infinix.svg",
  "iTel": "/brands/itel.svg",
  "UMIDIGI": "/brands/umidigi.svg",
  "Unihertz": "/brands/unihertz.svg",
  "Wiko": "/brands/wiko.svg",
  "Ulefone": "/brands/ulefone.svg",
  "Blackview": "/brands/blackview.svg",
  "Cubot": "/brands/cubot.svg",
  "Elephone": "/brands/elephone.svg",
  "Gionee": "/brands/gionee.svg",
  "Leagoo": "/brands/leagoo.svg",
  "LeEco": "/brands/leeco.svg",
  "Meitu": "/brands/meitu.svg",
  "Oukitel": "/brands/oukitel.svg",
  "Vernee": "/brands/vernee.svg",
  "TCL": "/brands/tcl.svg",
  "Roku": "/brands/roku.svg"
};

const BRAND_EMOJIS: Record<string, string> = {
  // Premium Brands
  "Apple": "🍎",
  "Samsung": "📱",
  "Google": "🔍",
  "Sony": "🎮",
  "Microsoft": "🪟",
  "BlackBerry": "📱",
  "Nothing": "📱",

  // Major Chinese Brands
  "Xiaomi": "📱",
  "Huawei": "📱",
  "OPPO": "📱",
  "Vivo": "📱",
  "Realme": "📱",
  "OnePlus": "📱",
  "Honor": "📱",
  "Meizu": "📱",
  "iQOO": "📱",
  "POCO": "📱",
  "Nubia": "📱",
  "ZTE": "📱",

  // Traditional Brands
  "Motorola": "📱",
  "Nokia": "📱",
  "LG": "��",
  "HTC": "📱",
  "Asus": "💻",
  "Lenovo": "💻",
  "Sharp": "📺",
  "Panasonic": "📺",
  "Alcatel": "📱",

  // Budget Brands
  "Tecno": "📱",
  "Infinix": "📱",
  "iTel": "📱",
  "UMIDIGI": "📱",
  "Unihertz": "📱",
  "Wiko": "📱",
  "Ulefone": "📱",
  "Blackview": "📱",
  "Cubot": "📱",
  "Elephone": "📱",
  "Gionee": "📱",
  "Leagoo": "📱",
  "LeEco": "📱",
  "Meitu": "📱",
  "Oukitel": "📱",
  "Vernee": "📱",
  "TCL": "📺",
  "Roku": "📺"
};

// List of brands that have SVG files
const AVAILABLE_SVG_BRANDS = new Set([
  'Apple', 'Samsung', 'Google', 'Sony', 'Microsoft', 'BlackBerry', 'Nothing',
  'Xiaomi', 'Huawei', 'OPPO', 'Vivo', 'Realme', 'OnePlus', 'Honor', 'Meizu',
  'iQOO', 'Motorola', 'Nokia', 'LG', 'HTC', 'Asus', 'Lenovo'
]);

export const BrandIcon: React.FC<BrandIconProps> = ({ brand, className = '', size = 24 }) => {
  // Get brand name and icon safely
  const getBrandInfo = (brandVal: string | Brand | undefined) => {
    if (!brandVal) return { name: '', icon: '' };

    if (typeof brandVal === 'string') {
      return { name: brandVal, icon: brandVal };
    }
    
    const br = brandVal as Brand as any;
    const name = typeof br.name === 'string'
      ? br.name
      : (br.name?.tr || br.name?.en || br.name?.de || '');

    return {
      name,
      icon: br.icon || name
    };
  };

  const { name, icon } = getBrandInfo(brand);

  // Safely handle undefined brand
  if (!name) {
    return (
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
        title="Unknown Brand"
      >
        📱
      </div>
    );
  }

  // Normalize brand name to match file paths
  const normalizedBrand = icon.toLowerCase();
  const iconPath = `/brands/${normalizedBrand}.svg`;
  const emoji = BRAND_EMOJIS[name] || BRAND_EMOJIS[name.toLowerCase()];
  const hasSvg = AVAILABLE_SVG_BRANDS.has(name) || AVAILABLE_SVG_BRANDS.has(name.toLowerCase());

  if (!hasSvg) {
    return (
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
        title={name}
      >
        {emoji || name.charAt(0).toUpperCase()}
      </div>
    );
  }

  const fullPath = new URL(iconPath, window.location.origin).href;

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
      title={name}
    >
      <img 
        src={fullPath}
        alt={`${name} icon`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain'
        }}
        onError={(e) => {
          // If image fails to load, replace with fallback
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.parentElement!.innerHTML = `
            <div style="
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: #f3f4f6;
              border-radius: 4px;
              color: #374151;
              font-size: ${size * 0.6}px;
            ">
              ${emoji || name.charAt(0).toUpperCase()}
            </div>
          `;
        }}
      />
    </div>
  );
};

export { BRAND_ICONS, BRAND_EMOJIS }; 