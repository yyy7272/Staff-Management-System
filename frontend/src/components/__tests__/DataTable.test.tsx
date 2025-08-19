import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable } from '../common/DataTable';

// Mock data for testing
const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
];

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'status', label: 'Status', sortable: false },
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 3,
  totalPages: 1,
};

describe('DataTable', () => {
  const defaultProps = {
    data: mockData,
    columns: mockColumns,
    pagination: mockPagination,
    onSort: vi.fn(),
    onPageChange: vi.fn(),
    onPageSizeChange: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with data correctly', () => {
    render(<DataTable {...defaultProps} />);
    
    // Check headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Check data rows
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    render(<DataTable {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows empty state when no data', () => {
    render(<DataTable {...defaultProps} data={[]} />);
    
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });

  it('handles sorting when column header is clicked', async () => {
    const user = userEvent.setup();
    render(<DataTable {...defaultProps} />);
    
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('toggles sort direction on subsequent clicks', async () => {
    const user = userEvent.setup();
    const props = {
      ...defaultProps,
      sortColumn: 'name',
      sortDirection: 'asc' as const,
    };
    
    render(<DataTable {...props} />);
    
    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('name', 'desc');
  });

  it('does not sort when column is not sortable', async () => {
    const user = userEvent.setup();
    render(<DataTable {...defaultProps} />);
    
    const statusHeader = screen.getByText('Status');
    await user.click(statusHeader);
    
    expect(defaultProps.onSort).not.toHaveBeenCalled();
  });

  it('renders pagination controls', () => {
    const propsWithMultiplePages = {
      ...defaultProps,
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    };
    
    render(<DataTable {...propsWithMultiplePages} />);
    
    expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('handles page navigation', async () => {
    const user = userEvent.setup();
    const propsWithMultiplePages = {
      ...defaultProps,
      pagination: {
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    };
    
    render(<DataTable {...propsWithMultiplePages} />);
    
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(3);
    
    const prevButton = screen.getByText('Previous');
    await user.click(prevButton);
    
    expect(defaultProps.onPageChange).toHaveBeenCalledWith(1);
  });

  it('disables navigation buttons appropriately', () => {
    const propsOnFirstPage = {
      ...defaultProps,
      pagination: {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      },
    };
    
    render(<DataTable {...propsOnFirstPage} />);
    
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
    
    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  it('handles page size change', async () => {
    const user = userEvent.setup();
    render(<DataTable {...defaultProps} showPageSizeSelector={true} />);
    
    const pageSizeSelect = screen.getByDisplayValue('10');
    await user.selectOptions(pageSizeSelect, '25');
    
    expect(defaultProps.onPageSizeChange).toHaveBeenCalledWith(25);
  });

  it('shows selection controls when selectable is true', () => {
    const propsWithSelection = {
      ...defaultProps,
      selectable: true,
      selectedIds: ['1'],
      onSelectionChange: vi.fn(),
    };
    
    render(<DataTable {...propsWithSelection} />);
    
    // Check for select all checkbox
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    expect(selectAllCheckbox).toBeInTheDocument();
    
    // Check for individual row checkboxes
    const rowCheckboxes = screen.getAllByRole('checkbox');
    expect(rowCheckboxes).toHaveLength(4); // 1 select all + 3 rows
  });

  it('handles row selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const propsWithSelection = {
      ...defaultProps,
      selectable: true,
      selectedIds: [],
      onSelectionChange,
    };
    
    render(<DataTable {...propsWithSelection} />);
    
    const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; // Skip select all
    await user.click(firstRowCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('handles select all functionality', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();
    const propsWithSelection = {
      ...defaultProps,
      selectable: true,
      selectedIds: [],
      onSelectionChange,
    };
    
    render(<DataTable {...propsWithSelection} />);
    
    const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
    await user.click(selectAllCheckbox);
    
    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
  });

  it('renders action buttons when provided', () => {
    const actions = [
      { label: 'Edit', onClick: vi.fn(), variant: 'outline' as const },
      { label: 'Delete', onClick: vi.fn(), variant: 'destructive' as const },
    ];
    
    const propsWithActions = {
      ...defaultProps,
      actions: (row: any) => actions,
    };
    
    render(<DataTable {...propsWithActions} />);
    
    // Should have Edit and Delete buttons for each row
    expect(screen.getAllByText('Edit')).toHaveLength(3);
    expect(screen.getAllByText('Delete')).toHaveLength(3);
  });

  it('calls action handlers when buttons are clicked', async () => {
    const user = userEvent.setup();
    const editHandler = vi.fn();
    const deleteHandler = vi.fn();
    
    const actions = [
      { label: 'Edit', onClick: editHandler, variant: 'outline' as const },
      { label: 'Delete', onClick: deleteHandler, variant: 'destructive' as const },
    ];
    
    const propsWithActions = {
      ...defaultProps,
      actions: (row: any) => actions,
    };
    
    render(<DataTable {...propsWithActions} />);
    
    const firstEditButton = screen.getAllByText('Edit')[0];
    await user.click(firstEditButton);
    
    expect(editHandler).toHaveBeenCalledWith(mockData[0]);
  });
});