const LABELS = {
  'Sign in to your account': ['Войдите в аккаунт', 'Akkauntingizga kiring'],
  Password: ['Пароль', 'Parol'], 'Magic Link': ['Вход по ссылке', 'Havola orqali kirish'], 'Sign Up': ['Регистрация', 'Ro‘yxatdan o‘tish'],
  Email: ['Электронная почта', 'Elektron pochta'], 'Continue with Google': ['Продолжить с Google', 'Google orqali davom etish'], 'Sign In': ['Войти', 'Kirish'],
  'Send Magic Link': ['Отправить ссылку для входа', 'Kirish havolasini yuborish'], "We'll email you a passwordless sign-in link.": ['Отправим на почту ссылку для входа без пароля.', 'Pochtangizga parolsiz kirish havolasini yuboramiz.'],
  'Full name': ['Имя и фамилия', 'Ism va familiya'], 'Your name': ['Ваше имя', 'Ismingiz'], 'At least 6 characters': ['Не менее 6 символов', 'Kamida 6 belgi'], 'Create Account': ['Создать аккаунт', 'Akkaunt yaratish'],
  'Use a different method': ['Другой способ входа', 'Boshqa usul'], 'Check your email': ['Проверьте почту', 'Pochtangizni tekshiring'], 'Verify your email': ['Подтвердите почту', 'Pochtangizni tasdiqlang'],
  'Something went wrong. Please try again.': ['Не удалось выполнить запрос. Попробуйте ещё раз.', 'So‘rov bajarilmadi. Qayta urinib ko‘ring.'],
  'We could not sign you in. Please check your email and password and try again.': ['Не удалось войти. Проверьте почту и пароль.', 'Kirish imkoni bo‘lmadi. Pochta va parolni tekshiring.'],
  'Please verify your email before signing in.': ['Перед входом подтвердите почту.', 'Kirishdan oldin pochtangizni tasdiqlang.'],
  'Too many attempts. Please wait a moment and try again.': ['Слишком много попыток. Подождите и попробуйте снова.', 'Urinishlar juda ko‘p. Biroz kutib qayta urinib ko‘ring.'],
  'Sign-ups are currently unavailable. Please contact support.': ['Регистрация сейчас недоступна. Обратитесь в поддержку.', 'Ro‘yxatdan o‘tish hozir mavjud emas. Yordam xizmatiga murojaat qiling.'],
  'We could not complete that request. Please try again.': ['Не удалось выполнить запрос. Попробуйте ещё раз.', 'So‘rov bajarilmadi. Qayta urinib ko‘ring.'],
};
export function loginText(text, language) { return LABELS[text]?.[language === 'ru' ? 0 : language === 'uz' ? 1 : -1] || text; }
export function loginEmailNotice(email, language, verification = false) {
  if (language === 'ru') return `Письмо отправлено на ${email}. ${verification ? 'Откройте его, чтобы подтвердить аккаунт.' : 'Перейдите по ссылке, чтобы продолжить.'}`;
  if (language === 'uz') return `${email} manziliga xat yuborildi. ${verification ? 'Akkauntni tasdiqlash uchun xatni oching.' : 'Davom etish uchun havolani bosing.'}`;
  return `We sent an email to ${email}. ${verification ? 'Open it to verify your account.' : 'Click the sign-in link to continue.'}`;
}
