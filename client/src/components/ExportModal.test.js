import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExportModal from './ExportModal';

describe('ExportModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    projectId: 'proj-123',
    labelOptions: [
      { id: 'l1', name: 'Nodule' },
      { id: 'l2', name: 'Effusion' }
    ]
  };

  test('renders nothing when isOpen is false', () => {
    const { container } = render(<ExportModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  test('renders options and toggles when open', () => {
    render(<ExportModal {...defaultProps} />);
    expect(screen.getByText('Export Dataset')).toBeInTheDocument();
    expect(screen.getByLabelText('Export Format')).toBeInTheDocument();
    expect(screen.getByLabelText('Include Raw Medical Images')).toBeInTheDocument();
    expect(screen.getByLabelText('Sync Export to Google Drive')).toBeInTheDocument();
  });

  test('enables template input only when CUSTOM is selected', () => {
    render(<ExportModal {...defaultProps} />);
    const formatSelect = screen.getByLabelText('Export Format');
    const templateInput = screen.getByPlaceholderText(/e\.g\. \{\{filename\}\}/);

    expect(templateInput).toBeDisabled();

    fireEvent.change(formatSelect, { target: { value: 'CUSTOM' } });
    expect(templateInput).not.toBeDisabled();
  });

  test('calls onClose when close button or Cancel is clicked', () => {
    render(<ExportModal {...defaultProps} />);
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
