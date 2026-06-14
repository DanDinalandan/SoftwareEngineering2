export function calculateAge(birthday) {
  if (!birthday) return null;
  const [month, day, year] = String(birthday).split('/').map(Number);
  if (!month || !day || !year) return null;
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function mapDbError(error) {
  if (!error) return null;
  if (error.code === '23505') return { status: 409, message: 'Email, username, or license is already taken.' };
  return { status: 500, message: error.message || 'Database error.' };
}

