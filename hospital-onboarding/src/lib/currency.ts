// Currency formatting utility
export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: 'before' | 'after';
  decimal_places: number;
  thousands_separator: string;
  decimal_separator: string;
}

// Get currency config from localStorage or use default
export function getCurrencyConfig(): CurrencyConfig {
  if (typeof window !== 'undefined') {
    const savedConfig = localStorage.getItem('systemConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.currency) {
          return config.currency;
        }
      } catch (error) {
        console.error('Error loading currency config:', error);
      }
    }
  }
  
  // Default to Nigerian Naira
  return {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    position: 'before',
    decimal_places: 2,
    thousands_separator: ',',
    decimal_separator: '.'
  };
}

// Format amount according to currency settings
export function formatCurrency(amount: number | string): string {
  const config = getCurrencyConfig();
  
  // Convert to number if string
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount)) {
    return config.position === 'before' 
      ? `${config.symbol}0.00`
      : `0.00 ${config.symbol}`;
  }
  
  // Format the number
  const formatted = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: config.decimal_places,
    maximumFractionDigits: config.decimal_places
  });
  
  // Apply custom separators
  let result = formatted
    .replace(/,/g, '{{THOUSAND}}')
    .replace(/\./g, config.decimal_separator)
    .replace(/{{THOUSAND}}/g, config.thousands_separator);
  
  // Add currency symbol
  if (config.position === 'before') {
    return `${config.symbol}${result}`;
  } else {
    return `${result} ${config.symbol}`;
  }
}

// Parse currency string to number
export function parseCurrency(value: string): number {
  const config = getCurrencyConfig();
  
  // Remove currency symbol and spaces
  let cleanValue = value
    .replace(config.symbol, '')
    .replace(/\s/g, '');
  
  // Replace custom separators with standard ones
  cleanValue = cleanValue
    .replace(new RegExp('\\' + config.thousands_separator, 'g'), '')
    .replace(config.decimal_separator, '.');
  
  return parseFloat(cleanValue) || 0;
}

// Get currency symbol only
export function getCurrencySymbol(): string {
  return getCurrencyConfig().symbol;
}

// Get currency code only
export function getCurrencyCode(): string {
  return getCurrencyConfig().code;
}

// Format with code instead of symbol
export function formatCurrencyWithCode(amount: number | string): string {
  const config = getCurrencyConfig();
  const formatted = formatCurrency(amount);
  return formatted.replace(config.symbol, config.code + ' ');
}
