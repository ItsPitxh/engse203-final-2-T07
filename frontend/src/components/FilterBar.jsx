import { STATUS_FILTERS } from '../utils/loanStatus.js';

function FilterBar({ value, onFilterChange }) {
  return (
    <div className="filter-bar" role="group" aria-label="กรองสถานะคำขอยืม">
      {STATUS_FILTERS.map(({ value: filterValue, label }) => (
        <button
          className={value === filterValue ? 'filter-active' : 'filter-button'}
          key={filterValue || 'all'}
          type="button"
          onClick={() => onFilterChange(filterValue)}
          aria-pressed={value === filterValue}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default FilterBar;