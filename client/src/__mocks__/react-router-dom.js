const React = require('react');

module.exports = {
  useNavigate: () => jest.fn(),
  useParams: () => ({ taskId: 'task-123' }),
  useLocation: () => ({ pathname: '/tasks/task-123' }),
  MemoryRouter: ({ children }) => children,
  Route: () => null,
  Routes: ({ children }) => children,
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>
};
