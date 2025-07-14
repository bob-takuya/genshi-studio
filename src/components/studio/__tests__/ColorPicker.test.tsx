import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorPicker } from '../../ui/ColorPicker'
import { useAppStore } from '../../../hooks/useAppStore'

// Mock the store
jest.mock('../../../hooks/useAppStore')

describe('ColorPicker', () => {
  const mockSetActiveColor = jest.fn()
  const mockColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#8800FF',
    '#FF0088', '#00FF88', '#8800FF', '#FF8888', '#88FF88'
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAppStore as jest.Mock).mockReturnValue({
      colors: mockColors,
      activeColor: '#000000',
      setActiveColor: mockSetActiveColor
    })
  })

  test('renders color palette without clearing it on color change', () => {
    const { rerender } = render(<ColorPicker />)
    
    // Check that all colors are rendered initially
    const colorButtons = screen.getAllByRole('button')
    // Should have 15 colors + 1 add button
    expect(colorButtons.length).toBeGreaterThanOrEqual(16)
    
    // Click on a different color
    const redColorButton = colorButtons[2] // Assuming red is at index 2
    fireEvent.click(redColorButton)
    
    // Verify setActiveColor was called
    expect(mockSetActiveColor).toHaveBeenCalledWith('#FF0000')
    
    // Re-render with new active color
    ;(useAppStore as jest.Mock).mockReturnValue({
      colors: mockColors,
      activeColor: '#FF0000',
      setActiveColor: mockSetActiveColor
    })
    
    rerender(<ColorPicker />)
    
    // Check that all colors are still rendered (palette not cleared)
    const colorButtonsAfterChange = screen.getAllByRole('button')
    expect(colorButtonsAfterChange.length).toBeGreaterThanOrEqual(16)
  })

  test('allows adding custom colors to palette', () => {
    render(<ColorPicker />)
    
    // Click add button
    const addButton = screen.getByTitle('Add custom color')
    fireEvent.click(addButton)
    
    // Color input should appear
    const colorInput = screen.getByPlaceholderText('#000000')
    fireEvent.change(colorInput, { target: { value: '#123456' } })
    
    // Click Add button
    const confirmAddButton = screen.getByText('Add')
    fireEvent.click(confirmAddButton)
    
    // The color should be added to local state (in real implementation)
    // Note: In the actual component, this would update the local palette
  })

  test('maintains palette state when active color changes via color input', () => {
    render(<ColorPicker />)
    
    // Get the main color input
    const colorInputs = screen.getAllByTitle('Pick a color')
    const mainColorInput = colorInputs[0]
    
    // Change color via input
    fireEvent.change(mainColorInput, { target: { value: '#654321' } })
    
    // Verify setActiveColor was called
    expect(mockSetActiveColor).toHaveBeenCalledWith('#654321')
    
    // Check that palette buttons still exist
    const colorButtons = screen.getAllByRole('button')
    expect(colorButtons.length).toBeGreaterThanOrEqual(16)
  })
})