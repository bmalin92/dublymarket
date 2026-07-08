import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NameCapture } from './NameCapture';

describe('NameCapture', () => {
  it('submits trimmed name', async () => {
    const onSubmit = vi.fn();
    render(<NameCapture onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/your name/i), '  Grug ');
    await userEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(onSubmit).toHaveBeenCalledWith('Grug');
  });
});
