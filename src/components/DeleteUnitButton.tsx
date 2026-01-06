'use client';

interface DeleteUnitButtonProps {
  onDelete: () => Promise<void>;
}

export function DeleteUnitButton({ onDelete }: DeleteUnitButtonProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      await onDelete();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <button
        type="submit"
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: 'transparent',
          color: '#dc2626',
          border: '1px solid #dc2626',
          borderRadius: '6px',
          fontSize: '0.875rem',
          cursor: 'pointer',
        }}
      >
        Delete Unit
      </button>
    </form>
  );
}
