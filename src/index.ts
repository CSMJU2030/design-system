/**
 * @csmju2030/design-system
 * UI Kit มาตรฐานกลางของโครงการ CSMJU2030 — ใช้ร่วมกันทุกระบบย่อย
 *
 * มาตรฐานอ้างอิง: docs/ui-design-system.md · csmju2030-standards v1.3.0
 * (auth-contract.md, api-conventions.md, data-dictionary.md)
 */

export const CSMJU_DESIGN_SYSTEM_VERSION = "1.3.0";
/** เวอร์ชันของ csmju2030-standards ที่ package นี้ implement — ต้องตรงกับ .standards-version ของระบบย่อย */
export const CSMJU_STANDARDS_VERSION = "1.3.0";

/* ---------- Layout (§5) ---------- */
export { CsmjuAppShell, type CsmjuAppShellProps, type CsmjuNavItem } from "./components/layout/AppShell";
export {
  Container, type ContainerProps,
  Card, type CardProps,
  Section, type SectionProps,
  Stack,
  PageHeader, type PageHeaderProps,
  Grid, type GridProps,
  Divider, type DividerProps,
} from "./components/layout/primitives";
export { Breadcrumb, type BreadcrumbItem, type BreadcrumbProps } from "./components/layout/Breadcrumb";
export { CsmjuErrorBoundary } from "./components/layout/ErrorBoundary";

/* ---------- Action (§7) ---------- */
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./components/action/Button";
export { IconButton, type IconButtonProps } from "./components/action/IconButton";
export { Link, type LinkProps } from "./components/action/Link";
export { ButtonGroup, type ButtonGroupProps } from "./components/action/ButtonGroup";
export {
  DropdownMenu, type DropdownMenuProps,
  DropdownItem, type DropdownItemProps,
  DropdownLabel,
  DropdownSeparator,
} from "./components/action/DropdownMenu";

/* ---------- Form (§8.1) ---------- */
export {
  FormField, type FormFieldProps, type FormFieldRenderProps,
  FieldGroup, FormRow, FormActions,
} from "./components/form/FormField";
export {
  TextInput, type TextInputProps,
  TextArea, type TextAreaProps,
  NumberInput, type NumberInputProps,
  Select, type SelectProps, type SelectOption,
  SearchInput, type SearchInputProps,
  Checkbox, Radio, RadioGroup, type ChoiceProps,
  Switch, type SwitchProps,
  DatePicker, type DatePickerProps,
  TimePicker, type TimePickerProps,
  FileUpload, type FileUploadProps,
} from "./components/form/inputs";
export { MultiSelect, type MultiSelectProps } from "./components/form/MultiSelect";

/* ---------- Data display (§8.2) ---------- */
export {
  DataTable, type DataTableProps, type DataTableColumn, type SortDirection,
} from "./components/data/DataTable";
export { Pagination, type PaginationProps } from "./components/data/Pagination";
export {
  Badge, type BadgeProps, type Tone,
  CountBadge,
  StatusDot, type StatusDotProps,
  Tag, type TagProps,
  Avatar, type AvatarProps,
  StatCard, type StatCardProps,
  DescriptionList, type DescriptionListProps, type DescriptionListItem,
  Timeline, type TimelineItem,
} from "./components/data/display";
export { EmptyState, type EmptyStateProps } from "./components/data/EmptyState";
export { Tabs, type TabsProps, type TabItem } from "./components/data/Tabs";
export { Accordion, type AccordionProps, type AccordionItem } from "./components/data/Accordion";

/* ---------- Feedback (§8.4, §9) ---------- */
export { Alert, type AlertProps, type AlertTone } from "./components/feedback/Alert";
export {
  ToastProvider, useToast, type ToastApi, type ToastOptions, type ToastTone,
} from "./components/feedback/Toast";
export { Modal, type ModalProps } from "./components/feedback/Modal";
export { ConfirmDialog, type ConfirmDialogProps } from "./components/feedback/ConfirmDialog";
export { Drawer, type DrawerProps } from "./components/feedback/Drawer";
export { Skeleton, SkeletonText, SkeletonTable, type SkeletonProps } from "./components/feedback/Skeleton";
export { Spinner, type SpinnerProps } from "./components/feedback/Spinner";
export { ProgressBar, type ProgressBarProps } from "./components/feedback/ProgressBar";
export { Tooltip, type TooltipProps } from "./components/feedback/Tooltip";
export { ErrorState, type ErrorStateProps } from "./components/feedback/ErrorState";

/* ---------- Auth / Permission (§10) ---------- */
export { Can, type CanProps, RequireRole, type RequireRoleProps, RoleBadge, type RoleBadgeProps } from "./components/auth";
export {
  CsmjuUserProvider, useCsmjuUser, layer1RoleLabel, LAYER1_ROLE_LABEL, userFromClaims,
  type CsmjuUser, type Layer1Role, type CsmjuUserContextValue,
} from "./lib/user";

/* ---------- Utility บังคับใช้ (§7.1, §11.3) ---------- */
export {
  formatDate, formatDateTime, formatTime, formatRelative,
  formatMoney, formatNumber, formatPhone, formatFileSize,
  toIsoDate, toBuddhistYear, thaiMonthNames,
  CSMJU_TIMEZONE, EMPTY_VALUE, type DateInput,
} from "./lib/format";
export { csmjuTitle, createCsmjuTitle, type CsmjuTitleOptions } from "./lib/metadata";

/* ---------- API + error mapping (§9.3, §16.1.2) ---------- */
export { csmjuFetch, csmjuFetchEnvelope, type CsmjuFetchOptions } from "./lib/api";
export { useApi, useMutation, type UseApiState, type UseApiOptions, type UseMutationResult } from "./lib/useApi";
export {
  mapApiError, codeFromStatus, isCsmjuApiError, CsmjuApiError,
  type CsmjuErrorCode, type CsmjuClientErrorCode, type AnyErrorCode,
  type CsmjuErrorUi, type CsmjuErrorPresentation,
  type CsmjuEnvelope, type CsmjuSuccessEnvelope, type CsmjuFailureEnvelope, type CsmjuApiErrorBody,
} from "./lib/errors";
export { registerUnauthorizedHandler } from "./lib/auth-bridge";
/* access token อยู่ใน memory เท่านั้น (auth-contract §7 + SEC-03)
   🔴 ระบบย่อยไม่ต้องเรียกเอง — AppShell กับ csmjuFetch จัดการให้แล้ว
   เปิด export ไว้เพื่อใช้ทดสอบและ debug */
export {
  getAccessToken, getJwtClaims, isAccessTokenExpiring, decodeJwtClaims,
  type CsmjuJwtClaims,
} from "./lib/token-store";

/* ---------- Hook ระดับ DOM (สำหรับ local component ที่ได้รับอนุมัติตาม §17.4) ---------- */
export { useFocusTrap, useEscapeKey, useScrollLock, useClickOutside } from "./lib/dom";
export { cn } from "./lib/cn";
