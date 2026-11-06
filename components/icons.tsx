import type { ReactNode, SVGProps } from "react";
import type { CATEGORIES } from "@/lib/constants";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const MenuIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon strokeWidth={2.2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M3 9.5h18M8 3v3M16 3v3" />
  </Icon>
);

export const LayoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </Icon>
);

export const ListIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </Icon>
);

export const EyeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Icon>
);

export const EyeOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.9 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2" />
    <path d="M6.6 6.6A17.4 17.4 0 0 0 2 12s3.5 7 10 7c1.9 0 3.6-.5 5-1.3" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="m3 3 18 18" />
  </Icon>
);

export const ChevronLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m15 18-6-6 6-6" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m9 18 6-6-6-6" />
  </Icon>
);

export const PencilIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 20h4L19.2 8.8a2.1 2.1 0 0 0-3-3L5 17v3Z" />
    <path d="m14.5 7.5 3 3" />
  </Icon>
);

export const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="m6 6 1 14h10l1-14" />
    <path d="M10 11v5M14 11v5" />
  </Icon>
);

export const LogoutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </Icon>
);

export const DownloadIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </Icon>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Icon width={13} height={13} strokeWidth={2.2} {...p}>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
);

export const ArrowDownIcon = (p: IconProps) => (
  <Icon width={13} height={13} strokeWidth={2.2} {...p}>
    <path d="M12 5v14M19 12l-7 7-7-7" />
  </Icon>
);

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a5b4fc" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#logo-grad)" />
      <rect x="8" y="16" width="3.6" height="8" rx="1.8" fill="#0b0b10" />
      <rect x="14.2" y="11" width="3.6" height="13" rx="1.8" fill="#0b0b10" />
      <rect x="20.4" y="7" width="3.6" height="17" rx="1.8" fill="#0b0b10" />
    </svg>
  );
}

// ---------- Category doodles ----------
// One simple line icon per entry in CATEGORIES. Typing the record on the union means adding a category to
// lib/constants.ts without drawing it here is a compile error.
type CategoryName = (typeof CATEGORIES)[number];

const CATEGORY_ICONS: Record<CategoryName, ReactNode> = {
  // fork + knife
  Food: (
    <>
      <path d="M6 3v6a2.5 2.5 0 0 0 5 0V3" />
      <path d="M8.5 3v18" />
      <path d="M17 21V3c-2.4 1.2-3.5 3.6-3.5 6.5V13H17" />
    </>
  ),
  // shopping basket
  Groceries: (
    <>
      <path d="M3 10h18l-1.6 9a2 2 0 0 1-2 1.7H6.6a2 2 0 0 1-2-1.7L3 10Z" />
      <path d="m8 10 3-6.5M16 10l-3-6.5" />
      <path d="M9 14v3M12 14v3M15 14v3" />
    </>
  ),
  // bus
  Transport: (
    <>
      <path d="M6 3.5h12a2 2 0 0 1 2 2V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2Z" />
      <path d="M4 10.5h16" />
      <path d="M8 14.2h.01M16 14.2h.01" />
      <path d="M7 18v2.5M17 18v2.5" />
    </>
  ),
  // house
  Rent: (
    <>
      <path d="m3.5 11 8.5-7 8.5 7" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  // receipt
  Bills: (
    <>
      <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
      <path d="M9 8h6M9 12h6" />
    </>
  ),
  // shopping bag
  Shopping: (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V7a3 3 0 0 1 6 0v1" />
    </>
  ),
  // medical cross
  Health: <path d="M9 3.5h6V9h5.5v6H15v5.5H9V15H3.5V9H9V3.5Z" />,
  // screen with play button
  Entertainment: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <path d="M10.5 9.5v5l4.2-2.5-4.2-2.5Z" />
    </>
  ),
  // suitcase
  Travel: (
    <>
      <rect x="4" y="8" width="16" height="12" rx="2" />
      <path d="M9 8V6.5A1.5 1.5 0 0 1 10.5 5h3A1.5 1.5 0 0 1 15 6.5V8" />
      <path d="M4 13h16" />
    </>
  ),
  // circle with three dots
  Other: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h.01M12 12h.01M16 12h.01" strokeWidth={2.4} />
    </>
  ),
};

// Unknown or legacy categories get a plain tag.
const FALLBACK_ICON: ReactNode = (
  <>
    <path d="M3.5 3.5h8.6l8.4 8.4a1.5 1.5 0 0 1 0 2.1L14 20.5a1.5 1.5 0 0 1-2.1 0L3.5 12.1V3.5Z" />
    <path d="M7.5 7.5h.01" strokeWidth={2.4} />
  </>
);

/** Decorative icon for an expense category (the colour comes from the surrounding element via currentColor). */
export function CategoryIcon({ name, ...props }: IconProps & { name: string }) {
  const icon = (CATEGORY_ICONS as Record<string, ReactNode | undefined>)[name];
  return (
    <Icon strokeWidth={1.75} {...props}>
      {icon ?? FALLBACK_ICON}
    </Icon>
  );
}
