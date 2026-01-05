'use client';

interface DeletePropertyButtonProps {
  onDelete: () => Promise<void>;
}

export function DeletePropertyButton({ onDelete }: DeletePropertyButtonProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this property? This will also delete all units.')) {
      await onDelete();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        style={{
          padding: '0.625rem 1.25rem',
          backgroundColor: '#fef2f2',
          color: '#dc2626',
          border: 'none',
          borderRadius: '8px',
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}
      >
        Delete
      </button>
    </form>
  );
}
