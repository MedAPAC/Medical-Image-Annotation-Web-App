import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LeftDrawer from './LeftDrawer';

describe('LeftDrawer AI settings panel', () => {
  const defaultProps = {
    openSection: 'ai',
    setOpenSection: jest.fn(),
    windowCenter: 40,
    windowWidth: 400,
    setWindowCenter: jest.fn(),
    setWindowWidth: jest.fn(),
    annotationOpacity: 0.5,
    setAnnotationOpacity: jest.fn(),
    selectedShape: 'ai-point',
    brushColor: '#ff0000',
    setBrushColor: jest.fn(),
    brushSize: 10,
    setBrushSize: jest.fn(),
    selectedLabel: 'lesion',
    setSelectedLabel: jest.fn(),
    labelOptions: [],
    t: (key) => key,
    activeAIModel: 'mock',
    setActiveAIModel: jest.fn(),
    enabledAIPromptTypes: ['point', 'text'],
    setEnabledAIPromptTypes: jest.fn(),
    aiTextPrompt: 'nodule',
    setAiTextPrompt: jest.fn(),
    aiPromptIsPositive: true,
    setAiPromptIsPositive: jest.fn(),
    onRunAIInference: jest.fn(),
    onClearAIPrompts: jest.fn(),
  };

  test('renders active model selector and triggers setActiveAIModel', () => {
    render(<LeftDrawer {...defaultProps} />);
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('mock');

    fireEvent.change(select, { target: { value: 'sam' } });
    expect(defaultProps.setActiveAIModel).toHaveBeenCalledWith('sam');
  });

  test('renders configured prompt modes and toggles check state', () => {
    render(<LeftDrawer {...defaultProps} />);
    const pointsCheckbox = screen.getByLabelText('point prompt');
    expect(pointsCheckbox.checked).toBe(true);

    const boxCheckbox = screen.getByLabelText('box prompt');
    expect(boxCheckbox.checked).toBe(false);

    fireEvent.click(boxCheckbox);
    expect(defaultProps.setEnabledAIPromptTypes).toHaveBeenCalled();
  });

  test('renders text prompt input if text prompt mode is enabled', () => {
    render(<LeftDrawer {...defaultProps} />);
    const input = screen.getByPlaceholderText('e.g. lung nodule');
    expect(input.value).toBe('nodule');

    fireEvent.change(input, { target: { value: 'fracture' } });
    expect(defaultProps.setAiTextPrompt).toHaveBeenCalledWith('fracture');
  });

  test('triggers run inference and clear prompts callbacks', () => {
    render(<LeftDrawer {...defaultProps} />);
    const runBtn = screen.getByRole('button', { name: 'Run AI Inference' });
    const clearBtn = screen.getByRole('button', { name: 'Clear AI Prompts' });

    fireEvent.click(runBtn);
    expect(defaultProps.onRunAIInference).toHaveBeenCalled();

    fireEvent.click(clearBtn);
    expect(defaultProps.onClearAIPrompts).toHaveBeenCalled();
  });
});
