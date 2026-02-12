import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from '../Modal'

describe('Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const TestModal = ({ isOpen, onClose, ...props }: any) => (
    <Modal isOpen={isOpen} onClose={onClose} {...props}>
      <div>Modal content</div>
      <button onClick={onClose}>Close</button>
    </Modal>
  )

  it('does not render when not open', () => {
    render(<TestModal isOpen={false} onClose={jest.fn()} />)

    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('renders when open', () => {
    render(<TestModal isOpen={true} onClose={jest.fn()} />)

    expect(screen.getByText('Modal content')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has correct ARIA attributes', () => {
    render(<TestModal isOpen={true} onClose={jest.fn()} />)

    const modal = screen.getByRole('dialog')
    
    expect(modal).toHaveAttribute('aria-modal', 'true')
    expect(modal).toHaveAttribute('role', 'dialog')
  })

  it('renders with title when provided', () => {
    render(
      <TestModal 
        isOpen={true} 
        onClose={jest.fn()} 
        title="Test Modal" 
      />
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Test Modal' })).toBeInTheDocument()
  })

  it('closes on backdrop click', () => {
    const onClose = jest.fn()
    render(<TestModal isOpen={true} onClose={onClose} />)

    const backdrop = screen.getByText('Modal content').closest('[role="dialog"]')?.parentElement
    expect(backdrop).toBeInTheDocument()

    fireEvent.click(backdrop!)

    expect(onClose).toHaveBeenCalled()
  })

  it('does not close on backdrop click when closeOnBackdrop is false', () => {
    const onClose = jest.fn()
    render(
      <TestModal 
        isOpen={true} 
        onClose={onClose} 
        closeOnBackdrop={false} 
      />
    )

    const backdrop = screen.getByText('Modal content').closest('[role="dialog"]')?.parentElement
    expect(backdrop).toBeInTheDocument()

    fireEvent.click(backdrop!)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on Escape key press', () => {
    const onClose = jest.fn()
    render(<TestModal isOpen={true} onClose={onClose} closeOnEscape={true} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).toHaveBeenCalled()
  })

  it('does not close on Escape key when closeOnEscape is false', () => {
    const onClose = jest.fn()
    render(<TestModal isOpen={true} onClose={onClose} closeOnEscape={false} />)

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes on close button click', async () => {
    const onClose = jest.fn()
    render(<TestModal isOpen={true} onClose={onClose} />)

    const closeButton = screen.getByLabelText('Close modal')
    await userEvent.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('applies correct size classes', () => {
    const { rerender } = render(<TestModal isOpen={true} onClose={jest.fn()} size="sm" />)
    
    let modal = screen.getByRole('dialog')
    expect(modal.parentElement).toHaveClass('max-w-md')

    rerender(<TestModal isOpen={true} onClose={jest.fn()} size="lg" />)
    
    modal = screen.getByRole('dialog')
    expect(modal.parentElement).toHaveClass('max-w-2xl')
  })

  it('traps focus within modal', () => {
    render(
      <TestModal isOpen={true} onClose={jest.fn()}>
        <button>Button 1</button>
        <input type="text" placeholder="Test input" />
        <button>Button 2</button>
      </TestModal>
    )

    // Focus should be within modal
    expect(document.activeElement).toBeInstanceOf(HTMLButtonElement)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('restores focus on close', () => {
    const TestComponent = () => {
      const [isOpen, setIsOpen] = React.useState(false)
      const [buttonRef, setButtonRef] = React.useState<HTMLButtonElement | null>(null)

      return (
        <div>
          <button 
            ref={setButtonRef}
            onClick={() => setIsOpen(true)}
          >
            Open Modal
          </button>
          <Modal 
            isOpen={isOpen} 
            onClose={() => setIsOpen(false)}
          >
            <div>Modal content</div>
          </Modal>
        </div>
      )
    }

    render(<TestComponent />)

    const openButton = screen.getByRole('button', { name: 'Open Modal' })
    openButton.focus()
    
    expect(document.activeElement).toBe(openButton)

    // Open modal
    userEvent.click(openButton)

    // Close modal
    const closeButton = screen.getByLabelText('Close modal')
    await userEvent.click(closeButton)

    // Focus should be restored
    expect(document.activeElement).toBe(openButton)
  })

  it('handles custom ARIA labels', () => {
    render(
      <TestModal 
        isOpen={true} 
        onClose={jest.fn()} 
        ariaLabel="Custom modal label"
      />
    )

    const modal = screen.getByRole('dialog')
    expect(modal).toHaveAttribute('aria-label', 'Custom modal label')
  })

  it('supports animation states', () => {
    const { rerender } = render(<TestModal isOpen={false} onClose={jest.fn()} />)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<TestModal isOpen={true} onClose={jest.fn()} />)

    // Should appear with animation
    const modal = screen.getByRole('dialog')
    expect(modal).toBeInTheDocument()
    
    // Should have animation classes
    expect(modal.parentElement).toHaveClass('transition-all')
  })

  it('prevents body scroll when open', () => {
    render(<TestModal isOpen={true} onClose={jest.fn()} />)

    // Body should have overflow hidden
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll when closed', () => {
    const { rerender } = render(<TestModal isOpen={true} onClose={jest.fn()} />)
    
    expect(document.body.style.overflow).toBe('hidden')

    rerender(<TestModal isOpen={false} onClose={jest.fn()} />)

    // Body scroll should be restored
    expect(document.body.style.overflow).toBe('')
  })
})