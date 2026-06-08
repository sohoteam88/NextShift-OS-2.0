'use client';

import { useEffect } from 'react';

type TenantBrandingProps = {
  primaryColor?: string | null;
};

function deriveHoverColor(hexColor: string) {
  const match = hexColor.trim().match(/^#?([a-f\d]{6})$/i);
  if (!match) return null;

  const value = match[1];
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  const scale = 0.88;
  const nextRed = Math.max(0, Math.min(255, Math.round(red * scale)));
  const nextGreen = Math.max(0, Math.min(255, Math.round(green * scale)));
  const nextBlue = Math.max(0, Math.min(255, Math.round(blue * scale)));

  return `#${[nextRed, nextGreen, nextBlue]
    .map((component) => component.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function TenantBranding({ primaryColor }: TenantBrandingProps) {
  useEffect(() => {
    const root = document.documentElement;
    const previousPrimary = root.style.getPropertyValue('--color-primary');
    const previousHover = root.style.getPropertyValue('--color-primary-hover');

    if (primaryColor) {
      root.style.setProperty('--color-primary', primaryColor);
      const hoverColor = deriveHoverColor(primaryColor);
      if (hoverColor) {
        root.style.setProperty('--color-primary-hover', hoverColor);
      }
    }

    return () => {
      if (previousPrimary) {
        root.style.setProperty('--color-primary', previousPrimary);
      } else {
        root.style.removeProperty('--color-primary');
      }

      if (previousHover) {
        root.style.setProperty('--color-primary-hover', previousHover);
      } else {
        root.style.removeProperty('--color-primary-hover');
      }
    };
  }, [primaryColor]);

  return null;
}

