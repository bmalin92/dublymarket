import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuessOptions } from './GuessOptions';

describe('GuessOptions', () => {
  it('calls onGuess with the healer name when an option is clicked', async () => {
    const onGuess = vi.fn();
    render(
      <GuessOptions
        odds={[
          { healer: 'Holy Priest', count: 1, percentage: 50 },
          { healer: 'Restoration Druid', count: 1, percentage: 50 },
        ]}
        disabled={false}
        disabledReason={null}
        onGuess={onGuess}
        isDark={false}
      />
    );

    await userEvent.click(screen.getByText('Holy Priest'));

    expect(onGuess).toHaveBeenCalledWith('Holy Priest');
  });

  it('shows the disabled reason and disables the buttons', () => {
    render(
      <GuessOptions
        odds={[{ healer: 'Holy Priest', count: 0, percentage: 0 }]}
        disabled={true}
        disabledReason="Enter your name to guess."
        onGuess={vi.fn()}
        isDark={false}
      />
    );

    expect(screen.getByText('Enter your name to guess.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Holy Priest/i })).toBeDisabled();
  });
});
