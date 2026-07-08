import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VoteOptions } from './VoteOptions';

describe('VoteOptions', () => {
  it('calls onVote with the healer name when an option is clicked', async () => {
    const onVote = vi.fn();
    render(
      <VoteOptions
        odds={[
          { healer: 'Holy Priest', count: 1, percentage: 50 },
          { healer: 'Restoration Druid', count: 1, percentage: 50 },
        ]}
        disabled={false}
        disabledReason={null}
        onVote={onVote}
        isDark={false}
      />
    );

    await userEvent.click(screen.getByText('Holy Priest'));

    expect(onVote).toHaveBeenCalledWith('Holy Priest');
  });

  it('shows the disabled reason and disables the buttons', () => {
    render(
      <VoteOptions
        odds={[{ healer: 'Holy Priest', count: 0, percentage: 0 }]}
        disabled={true}
        disabledReason="Enter your name to vote."
        onVote={vi.fn()}
        isDark={false}
      />
    );

    expect(screen.getByText('Enter your name to vote.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Holy Priest/i })).toBeDisabled();
  });
});
