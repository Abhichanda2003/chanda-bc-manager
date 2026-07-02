import { statusClass } from '../utils/formatters.js';

export default function Badge({ children }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(children)}`}>
      {children}
    </span>
  );
}
