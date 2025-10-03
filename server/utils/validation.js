const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

const validatePassword = (password) => {
    // Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre
    return password.length >= 8 && 
           /[A-Z]/.test(password) && 
           /[a-z]/.test(password) && 
           /[0-9]/.test(password);
};

const validateUsername = (username) => {
    return username && username.length >= 3 && username.length <= 50;
};

const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
};

module.exports = {
    validateEmail,
    validatePassword,
    validateUsername,
    sanitizeInput
};
