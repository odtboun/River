interface RoleCardProps {
  role: 'employer' | 'candidate';
  title: string;
  subtitle: string;
  icon: string;
  value: string;
  isReady: boolean;
  onValueChange: (value: string) => void;
  onLockIn: () => void;
  disabled: boolean;
}

export function RoleCard({
  role,
  title,
  subtitle,
  icon,
  value,
  isReady,
  onValueChange,
  onLockIn,
  disabled
}: RoleCardProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    onValueChange(rawValue);
  };

  const formatDisplayValue = (val: string) => {
    if (!val) return '';
    const num = parseInt(val);
    return num.toLocaleString('en-US');
  };

  return (
    <div className={`role-card ${role}`}>
      <div className="role-header">
        <div className="role-icon">{icon}</div>
        <div>
          <h3 className="role-title">{title}</h3>
          <p className="role-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">
          {role === 'employer' ? 'Maximum Budget' : 'Minimum Requirement'}
        </label>
        <div className="input-wrapper">
          <span className="input-prefix">$</span>
          <input
            type="text"
            className="form-input"
            placeholder={role === 'employer' ? '100,000' : '80,000'}
            value={formatDisplayValue(value)}
            onChange={handleInputChange}
            disabled={isReady || disabled}
          />
        </div>
      </div>

      {!isReady ? (
        <button
          className="btn btn-primary btn-full"
          onClick={onLockIn}
          disabled={!value || disabled}
        >
          Lock In {role === 'employer' ? 'Budget' : 'Requirement'}
        </button>
      ) : (
        <div className="status-badge ready">
          <span>✓</span>
          Locked & Ready
        </div>
      )}

      <div className="privacy-notice">
        <span className="privacy-icon">🔒</span>
        <span>
          Your {role === 'employer' ? 'budget' : 'requirement'} is private. 
          It will never be revealed, even after verification.
        </span>
      </div>
    </div>
  );
}
