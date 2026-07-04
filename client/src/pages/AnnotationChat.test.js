import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import Annotation from './Annotation';

jest.mock('axios', () => {
  const mockAxios = {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    create: jest.fn(() => mockAxios),
    defaults: { headers: { common: {} } }
  };
  return mockAxios;
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { language: 'en', changeLanguage: jest.fn() }
  }),
  initReactI18next: {
    type: '3rdParty',
    init: () => {}
  }
}));

jest.mock('../AuthContext', () => ({
  useAuth: () => ({
    token: 'test-token',
    isAuthenticated: true,
    authLoading: false,
    user: { id: 'user-1' }
  })
}));

jest.mock('../useTaskData', () => () => ({
  isLoading: false,
  error: null,
  taskData: { _id: 'task-123', status: 'new', files: [], project: { labelOptions: [] } },
  uploadedFiles: [{ originalName: 'image.png', filename: 'image.png', type: 'png', url: 'http://test/image.png' }],
  setTaskData: jest.fn(),
  setUploadedFiles: jest.fn(),
  fetchTask: jest.fn()
}));

jest.mock('../components/MainViewer', () => () => <div data-testid="mock-main-viewer" />);

// Mock AnnotationCanvas to avoid Canvas API issues in Jest/jsdom
jest.mock('../AnnotationCanvas', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({
      clearAnnotations: jest.fn(),
      addAIAnnotation: jest.fn()
    }));
    return <div data-testid="mock-canvas" />;
  });
});

describe('Annotation Page AI Assistant integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('submits user message and receives chatbot reply', async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes('/api/ai/chat')) {
        return Promise.resolve({
          data: { reply: 'AI response content here' }
        });
      }
      return Promise.reject(new Error('Unknown POST url'));
    });

    render(<Annotation />);

    // Switch RightPanel tab to assistant
    const assistantTab = await screen.findByRole('button', { name: 'AI Assistant Chat' });
    fireEvent.click(assistantTab);

    // Input chat query
    const input = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(input, { target: { value: 'Guideline question' } });

    // Click Send
    const sendButton = screen.getByRole('button', { name: 'Send' });
    fireEvent.click(sendButton);

    // Assert that Axios called /api/ai/chat
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/chat'),
        { message: 'Guideline question' },
        expect.any(Object)
      );
    });

    // Check message history renders the reply
    expect(await screen.findByText('AI response content here')).toBeInTheDocument();
  });

  test('submits developer ticket successfully', async () => {
    axios.post.mockImplementation((url) => {
      if (url.includes('/api/tickets/create')) {
        return Promise.resolve({
          data: { ticketId: 'ticket-789' }
        });
      }
      return Promise.reject(new Error('Unknown POST url'));
    });

    render(<Annotation />);

    // Open tab
    const assistantTab = await screen.findByRole('button', { name: 'AI Assistant Chat' });
    fireEvent.click(assistantTab);

    // Switch to ticket form
    const ticketToggleBtn = screen.getByRole('button', { name: 'Log Dev Ticket' });
    fireEvent.click(ticketToggleBtn);

    // Enter title & desc
    const titleInput = screen.getByPlaceholderText('e.g. Overlapping right panel');
    const descInput = screen.getByPlaceholderText('Describe the issue...');
    const submitBtn = screen.getByRole('button', { name: 'Submit Ticket' });

    fireEvent.change(titleInput, { target: { value: 'Crash on save' } });
    fireEvent.change(descInput, { target: { value: 'Saving throws 500 error' } });
    fireEvent.click(submitBtn);

    // Assert Axios post
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/tickets/create'),
        expect.objectContaining({
          title: 'Crash on save',
          description: 'Saving throws 500 error'
        }),
        expect.any(Object)
      );
    });
  });
});
