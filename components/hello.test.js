import { render, screen } from '@testing-library/react';
import Hello from '/components/hello';


describe('Hello component', () => {
  it('should render hello message', () => {
    render(<Hello />);
    expect(screen.getByText('Halo, ini Next.js!')).toBeInTheDocument();
  });
});