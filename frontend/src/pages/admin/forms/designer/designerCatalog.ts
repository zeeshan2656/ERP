import { FormControlType, FormControl } from '../../../../types/index.ts';
import {
  Type,
  AlignLeft,
  Hash,
  DollarSign,
  Percent,
  Calendar,
  Clock,
  CheckSquare,
  ToggleLeft,
  ListFilter,
  ChevronDown,
  Search,
  Mail,
  Phone,
  Key,
  Globe,
  EyeOff,
  Lock,
  Heading,
  FileText,
  Minus,
  Maximize2,
  Box,
  FolderPlus,
  Table,
  Sliders,
  Play,
  Calculator,
  Upload,
  ArrowRightLeft,
  Navigation,
  Image,
  Sparkles,
  Code,
} from 'lucide-react';

export interface ToolboxItemDef {
  type: FormControlType;
  label: string;
  category: 'data_entry' | 'layout' | 'advanced';
  icon: any;
  description: string;
  defaultColSpan: number;
  defaultHeight?: string;
  defaultLabel: string;
}

export const TOOLBOX_CATALOG: ToolboxItemDef[] = [
  // A. Data Entry Controls
  { type: 'text', label: 'Text Input', category: 'data_entry', icon: Type, description: 'Single-line text entry', defaultColSpan: 6, defaultLabel: 'Text Field' },
  { type: 'textarea', label: 'Text Area', category: 'data_entry', icon: AlignLeft, description: 'Multi-line text input', defaultColSpan: 12, defaultHeight: '90px', defaultLabel: 'Notes / Description' },
  { type: 'number', label: 'Number Input', category: 'data_entry', icon: Hash, description: 'Integer numerical input', defaultColSpan: 4, defaultLabel: 'Quantity' },
  { type: 'decimal', label: 'Decimal Input', category: 'data_entry', icon: Hash, description: 'Precise floating point number', defaultColSpan: 4, defaultLabel: 'Decimal Value' },
  { type: 'currency', label: 'Currency Input', category: 'data_entry', icon: DollarSign, description: 'Monetary amount with currency symbol', defaultColSpan: 4, defaultLabel: 'Amount ($)' },
  { type: 'percentage', label: 'Percentage Input', category: 'data_entry', icon: Percent, description: 'Rate or ratio percentage', defaultColSpan: 4, defaultLabel: 'Discount %' },
  { type: 'date', label: 'Date Picker', category: 'data_entry', icon: Calendar, description: 'Calendar date selection', defaultColSpan: 4, defaultLabel: 'Date' },
  { type: 'time', label: 'Time Picker', category: 'data_entry', icon: Clock, description: 'Time of day selection', defaultColSpan: 4, defaultLabel: 'Time' },
  { type: 'datetime', label: 'Date-Time Picker', category: 'data_entry', icon: Calendar, description: 'Combined date and time timestamp', defaultColSpan: 6, defaultLabel: 'Timestamp' },
  { type: 'checkbox', label: 'Checkbox', category: 'data_entry', icon: CheckSquare, description: 'Boolean checkbox toggle', defaultColSpan: 4, defaultLabel: 'Confirm Selection' },
  { type: 'switch', label: 'Switch', category: 'data_entry', icon: ToggleLeft, description: 'Modern on/off boolean toggle', defaultColSpan: 4, defaultLabel: 'Enable Option' },
  { type: 'radio', label: 'Radio Group', category: 'data_entry', icon: ListFilter, description: 'Mutually exclusive options', defaultColSpan: 6, defaultLabel: 'Select Option' },
  { type: 'select', label: 'Dropdown / Select', category: 'data_entry', icon: ChevronDown, description: 'Selectable dropdown list of values', defaultColSpan: 6, defaultLabel: 'Choose Category' },
  { type: 'lookup', label: 'Lookup Field', category: 'data_entry', icon: Search, description: 'Foreign-key lookup from table or query', defaultColSpan: 6, defaultLabel: 'Lookup Record' },
  { type: 'lov', label: 'LOV (List of Values)', category: 'data_entry', icon: ListFilter, description: 'Predefined or dynamic list of values', defaultColSpan: 6, defaultLabel: 'Select Value' },
  { type: 'autocomplete', label: 'Autocomplete', category: 'data_entry', icon: Search, description: 'Dynamic searchable autocomplete list', defaultColSpan: 6, defaultLabel: 'Search / Select' },
  { type: 'email', label: 'Email Input', category: 'data_entry', icon: Mail, description: 'Validated email address input', defaultColSpan: 6, defaultLabel: 'Email Address' },
  { type: 'phone', label: 'Phone Input', category: 'data_entry', icon: Phone, description: 'Telephone contact input', defaultColSpan: 6, defaultLabel: 'Phone Number' },
  { type: 'password', label: 'Password', category: 'data_entry', icon: Key, description: 'Masked password entry', defaultColSpan: 6, defaultLabel: 'Password' },
  { type: 'url', label: 'Web URL', category: 'data_entry', icon: Globe, description: 'Web address URL field', defaultColSpan: 6, defaultLabel: 'Website URL' },
  { type: 'hidden', label: 'Hidden Field', category: 'data_entry', icon: EyeOff, description: 'Hidden state or foreign key value', defaultColSpan: 12, defaultLabel: 'Hidden Param' },
  { type: 'readonly', label: 'Read-Only Field', category: 'data_entry', icon: Lock, description: 'Non-editable display field', defaultColSpan: 6, defaultLabel: 'System Code' },

  // B. Display and Layout Controls
  { type: 'section', label: 'Section Header', category: 'layout', icon: FolderPlus, description: 'Collapsible visual section with title', defaultColSpan: 12, defaultLabel: 'Section Title' },
  { type: 'heading', label: 'Heading Text', category: 'layout', icon: Heading, description: 'Large section heading text', defaultColSpan: 12, defaultLabel: 'Heading' },
  { type: 'label', label: 'Text Label', category: 'layout', icon: Type, description: 'Informational static text label', defaultColSpan: 6, defaultLabel: 'Label Text' },
  { type: 'description', label: 'Description / Help', category: 'layout', icon: FileText, description: 'Multi-line guidance help text', defaultColSpan: 12, defaultLabel: 'Instructions and helpful guidelines for this form.' },
  { type: 'divider', label: 'Divider Line', category: 'layout', icon: Minus, description: 'Horizontal dividing separator rule', defaultColSpan: 12, defaultLabel: '' },
  { type: 'spacer', label: 'Spacer', category: 'layout', icon: Maximize2, description: 'Vertical whitespace gap', defaultColSpan: 12, defaultHeight: '24px', defaultLabel: '' },
  { type: 'container', label: 'Container Box', category: 'layout', icon: Box, description: 'Framed card or panel container', defaultColSpan: 12, defaultHeight: '120px', defaultLabel: 'Panel Container' },
  { type: 'columns', label: '2-Column Split', category: 'layout', icon: Sliders, description: 'Side-by-side two column container', defaultColSpan: 12, defaultLabel: 'Two Columns' },
  { type: 'image', label: 'Image', category: 'layout', icon: Image, description: 'Static logo or product image display', defaultColSpan: 4, defaultHeight: '120px', defaultLabel: 'Image' },
  { type: 'icon', label: 'Icon Display', category: 'layout', icon: Sparkles, description: 'Decorative accent icon', defaultColSpan: 2, defaultLabel: 'Icon' },
  { type: 'html', label: 'Sanitized HTML', category: 'layout', icon: Code, description: 'Safe HTML formatted snippet', defaultColSpan: 12, defaultLabel: 'HTML Snippet' },

  // C. Advanced Data Controls
  { type: 'datagrid', label: 'Data Grid (Master-Detail)', category: 'advanced', icon: Table, description: 'Child continuous records grid connected to detail table', defaultColSpan: 12, defaultHeight: '260px', defaultLabel: 'Detail Line Items' },
  { type: 'master_detail', label: 'Master-Detail Container', category: 'advanced', icon: ArrowRightLeft, description: 'Dedicated master-to-detail relationship grid', defaultColSpan: 12, defaultHeight: '280px', defaultLabel: 'Related Detail Records' },
  { type: 'record_nav', label: 'Record Navigation Bar', category: 'advanced', icon: Navigation, description: 'First, Prev, Next, Last, New record controls', defaultColSpan: 12, defaultLabel: 'Record Navigator' },
  { type: 'calculated', label: 'Calculated Field', category: 'advanced', icon: Calculator, description: 'Automatic formula calculated total', defaultColSpan: 4, defaultLabel: 'Calculated Total ($)' },
  { type: 'button', label: 'Action Button', category: 'advanced', icon: Play, description: 'Submit, Reset, Calculate, or Custom action', defaultColSpan: 3, defaultLabel: 'Save Record' },
  { type: 'file_upload', label: 'Attachment Upload', category: 'advanced', icon: Upload, description: 'Upload file attachment to media files', defaultColSpan: 6, defaultLabel: 'Upload Attachment' },
];

export function createDefaultControl(type: FormControlType, customLabel?: string, fieldBinding?: string): FormControl {
  const itemDef = TOOLBOX_CATALOG.find((i) => i.type === type) || {
    type,
    label: customLabel || 'Field',
    category: 'data_entry' as const,
    defaultColSpan: 6,
    defaultHeight: undefined as string | undefined,
    defaultLabel: customLabel || 'Field',
  };

  const id = `ctrl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const label = customLabel || itemDef.defaultLabel;
  const name = fieldBinding || label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field';

  const baseControl: FormControl = {
    id,
    type,
    name,
    label,
    fieldBinding: fieldBinding || null,
    placeholder: type === 'text' || type === 'email' || type === 'phone' ? `Enter ${label.toLowerCase()}...` : null,
    defaultValue: type === 'checkbox' || type === 'switch' ? false : null,
    helpText: null,
    tooltip: null,
    col: 1,
    row: 1,
    colSpan: itemDef.defaultColSpan,
    height: itemDef.defaultHeight || null,
    alignment: 'left',
    visibility: 'always',
    disabled: false,
    readOnly: type === 'readonly',
    styling: {
      labelPosition: type === 'section' || type === 'divider' || type === 'spacer' ? 'hidden' : 'above',
    },
    validation: {
      required: false,
    },
  };

  if (type === 'datagrid' || type === 'master_detail') {
    baseControl.detailGridConfig = {
      detailTable: '',
      foreignKeyColumn: '',
      masterKeyColumn: 'id',
      gridTitle: label,
      columns: [],
      allowAdd: true,
      allowEdit: true,
      allowDelete: true,
      defaultPageSize: 10,
      defaultVisibleRows: 5,
      enableTotals: true,
      summaryFields: [
        {
          id: `sum_${Date.now()}_1`,
          label: 'Grand Total',
          sourceColumn: 'line_total',
          calculationType: 'SUM',
          format: 'currency',
          decimalPlaces: 2,
          prefix: '$',
          targetFieldBinding: 'total_amount',
        },
      ],
      cascadeDelete: true,
    };
  }

  if (type === 'button') {
    baseControl.buttonAction = {
      actionType: 'submit',
      message: 'Record saved successfully.',
    };
  }

  if (type === 'calculated') {
    baseControl.calculatedConfig = {
      formula: 'quantity * unit_price',
      targetFields: ['quantity', 'unit_price'],
    };
  }

  return baseControl;
}
