import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AssistantPanel from './AssistantPanel';

describe('AssistantPanel Component', () => {
  const defaultProps = {
    t: (key) => key,
    messages: [
      { sender: 'ai', text: 'Hello, how can I help you annotate?' },
      { sender: 'user', text: 'What is a ground glass opacity?' }
    ],
    onSubmitMessage: jest.fn(),
    onCreateTicket: jest.fn()
  };

  test('renders chat messages history', () => {
    render(<AssistantPanel {...defaultProps} />);
    expect(screen.getByText('Hello, how can I help you annotate?')).toBeInTheDocument();
    expect(screen.getByText('What is a ground glass opacity?')).toBeInTheDocument();
  });

  test('triggers onSubmitMessage on send button click', () => {
    render(<AssistantPanel {...defaultProps} />);
    const input = screen.getByPlaceholderText('Type your message...');
    const sendButton = screen.getByRole('button', { name: 'Send' });

    fireEvent.change(input, { target: { value: 'How do I draw a polygon?' } });
    fireEvent.click(sendButton);

    expect(defaultProps.onSubmitMessage).toHaveBeenCalledWith('How do I draw a polygon?');
  });

  test('shows ticket form and submits developer ticket', () => {
    render(<AssistantPanel {...defaultProps} />);
    
    // Switch to ticket form
    const ticketToggleBtn = screen.getByRole('button', { name: 'Log Dev Ticket' });
    fireEvent.click(ticketToggleBtn);

    // Assert ticket form inputs are visible
    expect(screen.getByPlaceholderText('e.g. Overlapping right panel')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Describe the issue...')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('e.g. Overlapping right panel');
    const descInput = screen.getByPlaceholderText('Describe the issue...');
    const submitBtn = screen.getByRole('button', { name: 'Submit Ticket' });

    fireEvent.change(titleInput, { target: { value: 'UI Overlap' } });
    fireEvent.change(descInput, { target: { value: 'The panel overlaps' } });
    fireEvent.click(submitBtn);

    expect(defaultProps.onCreateTicket).toHaveBeenCalledWith({
      title: 'UI Overlap',
      description: 'The panel overlaps'
    });
  });
});
