// Loading Spinner Component

export function LoadingSpinner(text = 'Loading...') {
    return `
    <div class="loading-spinner">
      <div class="poker-chip-spinner"></div>
      <p class="loading-text">${text}</p>
    </div>
  `;
}

// Add styles if not already in main CSS
export const spinnerStyles = `
  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-3xl);
  }
  
  .loading-text {
    margin-top: var(--space-lg);
    color: var(--color-text-muted);
    font-size: 0.9rem;
  }
`;
