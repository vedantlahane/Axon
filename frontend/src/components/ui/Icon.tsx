import React from 'react';
import * as LucideIcons from 'lucide-react';

const ICON_ALIASES: Record<string, string> = {
  arrow_forward: 'ArrowRight',
  auto_awesome: 'Wand2',
  description: 'FileText',
  cloud_upload: 'CloudUpload',
  cloud_download: 'CloudDownload',
  folder_open: 'FolderOpen',
  visibility: 'Eye',
  visibility_off: 'EyeOff',
  thumb_up: 'ThumbsUp',
  thumb_down: 'ThumbsDown',
  content_copy: 'Copy',
  person: 'User',
  account_tree: 'GitBranch',
  add: 'Plus',
  upload: 'Upload',
  download: 'Download',
  refresh: 'RefreshCw',
  settings: 'Settings',
  smart_toy: 'Bot',
  schema: 'Database',
  help: 'HelpCircle',
  home: 'Home',
  search: 'Search',
  close: 'X',
  check: 'Check',
  check_circle: 'CheckCircle',
  warning: 'AlertTriangle',
  error: 'AlertCircle',
  error_outline: 'AlertCircle',
  info: 'Info',
  terminal: 'Terminal',
  attach_file: 'Paperclip',
  table_chart: 'Table2',
  keyboard_double_arrow_down: 'ChevronsDown',
  play_arrow: 'Play',
  chevron_right: 'ChevronRight',
  auto_stories: 'BookOpen',
  push_pin: 'Pin',
  chat_bubble_outline: 'MessageCircle',
  search_off: 'SearchX',
  inbox: 'Inbox',
  progress_activity: 'Loader',
  pending: 'Clock',
  code: 'Code2',
  database: 'Database',
  attachment: 'Paperclip',
  history: 'History',
  menu: 'Menu',
  bolt: 'Zap',
  delete: 'Trash2',
  person_remove: 'UserX',
  arrow_backward: 'ArrowLeft',
  arrow_back: 'ArrowLeft',
  palette: 'Palette',
  dark_mode: 'Moon',
  delete_sweep: 'Trash2',
  edit: 'Edit2',
  fullscreen: 'Maximize',
  arrow_upward: 'ArrowUp',
};

function normalizeIconName(name: string): string {
  if (!name) return 'HelpCircle';
  const raw = name.trim();
  const alias = ICON_ALIASES[raw];
  if (alias) return alias;
  return raw
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

interface IconProps extends React.SVGAttributes<SVGSVGElement> {
  name: string;
  size?: number | string;
  strokeWidth?: number;
}

const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 20, 
  strokeWidth = 2,
  ...props 
}) => {
  const iconName = normalizeIconName(name);
  const IconComponent = (LucideIcons as any)[iconName];
  
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in lucide-react`);
    return <LucideIcons.HelpCircle size={size} strokeWidth={strokeWidth} {...props} />;
  }
  
  return <IconComponent size={size} strokeWidth={strokeWidth} {...props} />;
};

export default Icon;
