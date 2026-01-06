import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FileUpload from '@/components/FileUpload';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FileUpload', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders upload zone', () => {
    render(<FileUpload onUpload={mockOnUpload} />);
    expect(screen.getByText(/Click or drag photos to upload/i)).toBeInTheDocument();
  });

  it('shows max file information', () => {
    render(<FileUpload onUpload={mockOnUpload} maxFiles={3} />);
    expect(screen.getByText(/Max 3 photos/i)).toBeInTheDocument();
  });

  it('uploads files successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ urls: ['/uploads/test.jpg'] }),
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(['/uploads/test.jpg']);
    });
  });

  it('handles upload errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Upload failed' }),
    });

    render(<FileUpload onUpload={mockOnUpload} />);

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  it('displays uploaded images', () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        existingUrls={['/uploads/existing.jpg']}
      />
    );

    const img = screen.getByAltText('Upload 1');
    expect(img).toHaveAttribute('src', '/uploads/existing.jpg');
  });

  it('removes uploaded files', async () => {
    render(
      <FileUpload
        onUpload={mockOnUpload}
        existingUrls={['/uploads/test1.jpg', '/uploads/test2.jpg']}
      />
    );

    const removeButtons = screen.getAllByRole('button', { name: /remove photo/i });
    fireEvent.click(removeButtons[0]);

    expect(mockOnUpload).toHaveBeenCalledWith(['/uploads/test2.jpg']);
  });
});
