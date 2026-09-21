/**
 * SwiftLink UI kit.
 *
 * Two rules for anything added here (`docs/01-DESIGN-SYSTEM.md` §12):
 *  1. Colors, radii, shadows and durations come from tokens — no hex literals and
 *     no `!important`. Enforced by the `components/ui/**` overrides in
 *     `.eslintrc.json`.
 *  2. Every control is keyboard operable and labelled. If a component needs a
 *     pointer to work, it is not finished.
 *
 * Screens should import from `@/components/ui` rather than deep paths, so the
 * kit's internal file layout stays free to change.
 */

export { Icon, ICON_SIZES, type IconProps, type IconSize } from "./icon";
export { Button, buttonVariants, type ButtonProps } from "./button";
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./card";
export { Badge, badgeVariants, type BadgeProps } from "./badge";
export { Label, Field, Input, Textarea, Select, type FieldProps } from "./field";
export { Switch, Checkbox, SwitchField, type SwitchFieldProps } from "./switch";
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";
export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
  type TooltipProps,
} from "./tooltip";
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "./menu";
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  ConfirmDialog,
  PromptDialog,
  type ConfirmDialogProps,
  type PromptDialogProps,
} from "./dialog";
export {
  Spinner,
  PanelLoader,
  Skeleton,
  SkeletonRows,
  EmptyState,
  type EmptyStateProps,
} from "./feedback";
export {
  Avatar,
  AvatarGroup,
  AVATAR_SIZES,
  type AvatarProps,
  type AvatarSize,
  type AvatarStatus,
} from "./avatar";
