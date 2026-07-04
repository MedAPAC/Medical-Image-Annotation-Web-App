import React from 'react';
import { render, screen } from '@testing-library/react';
import RightPanel from './RightPanel';

describe('RightPanel Component', () => {
  const defaultProps = {
    rightPanelOpen: 'assistant',
    setRightPanelOpen: jest.fn(),
    t: (key) => key,
    viewType: 'axial',
    setViewType: jest.fn(),
    selectedFileName: 'scan.png',
    currentSlice: 0,
    setCurrentSlice: jest.fn(),
    classificationByFileAndSlice: {},
    setClassificationByFileAndSlice: jest.fn(),
    inputsByFileAndSlice: {},
    setInputsByFileAndSlice: jest.fn(),
    totalSlices: 10,
    isZoomMode: false,
    setIsZoomMode: jest.fn(),
    zoomLevel: 1.0,
    setZoomLevel: jest.fn(),
    zoomRegion: null,
    setZoomRegion: jest.fn(),
    projectAttributes: [],
    aiChatMessages: [{ sender: 'ai', text: 'Hello, bot here!' }],
    handleSendAiChatMessage: jest.fn(),
    handleCreateDeveloperTicket: jest.fn()
  };

  test('renders AssistantPanel when rightPanelOpen is assistant', () => {
    render(<RightPanel {...defaultProps} />);
    expect(screen.getByText('Hello, bot here!')).toBeInTheDocument();
  });
});
