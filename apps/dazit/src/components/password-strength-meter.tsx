function passwordStrength(password: string) {
  if (!password) return { label: '', score: 0 };

  let score = password.length >= 8 ? 1 : 0;
  if (password.length >= 12) score += 1;

  const characterGroups = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  if (characterGroups >= 3) score += 1;
  if (characterGroups === 4 && password.length >= 12) score += 1;

  const labels = ['Sehr schwach', 'Schwach', 'Mittel', 'Gut', 'Stark'];
  return { label: labels[score], score };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = passwordStrength(password);

  return (
    <div
      aria-label={password ? `Passwortstärke: ${strength.label}` : 'Passwortstärke'}
      className="password-strength"
      data-score={strength.score}
      role="status"
    >
      <div aria-hidden="true" className="password-strength-bars">
        {Array.from({ length: 4 }, (_, index) => <span key={index} />)}
      </div>
      <span>{password ? strength.label : 'Mindestens 8 Zeichen'}</span>
    </div>
  );
}