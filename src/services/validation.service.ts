export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationService {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): ValidationError[] {
    const errors: ValidationError[] = [];
    if (password.length < 8) {
      errors.push({
        field: "password",
        message: "Mật khẩu phải có ít nhất 8 ký tự.",
      });
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push({
        field: "password",
        message: "Mật khẩu phải có 1 chữ thường",
      });
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push({
        field: "password",
        message: "Mật khẩu phải có ít nhất 1 chữ hoa",
      });
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push({
        field: "password",
        message: "Mật khẩu phải có 1 số",
      });
    }
    return errors;
  }

  static validateUsername(username: string): ValidationError[] {
    const errors: ValidationError[] = [];

    if (username.length < 3) {
      errors.push({
        field: "username",
        message: "Username phải có ít nhất 3 ký tự",
      });
    }
    if (username.length > 50) {
      errors.push({
        field: "username",
        message: "Username không được quá 50 ký tự",
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push({
        field: "username",
        message: "Username chỉ được chứa chữ cái, số và dấu gạch dưới",
      });
    }
    return errors;
  }

  static validatePhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^[0-9+\-\s()]+$/;
    return phoneRegex.test(phoneNumber) && phoneNumber.length >= 10;
  }
  static validateAdminData(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate username
    if (data.username) {
      errors.push(...this.validateUsername(data.username));
    }

    //Validate Email
    if (data.email && !this.validateEmail(data.email)) {
      errors.push({
        field: "email",
        message: "Email không hợp lệ",
      });
    }

    // Validate Password
    if (data.password) {
      errors.push(...this.validatePassword(data.password));
    }

    // Validate phone number
    if (data.phoneNumber && !this.validatePhoneNumber(data.phoneNumber)) {
      errors.push({
        field: "phoneNumber",
        message: "Số điện thoại không hợp lệ",
      });
    }

    // Validate role
    const validRoles = [
      "SUPER_ADMIN",
      "NEWS_ADMIN",
      "TNTT_ADMIN",
      "BIBLE_ADMIN",
    ];
    if (data.role && !validRoles.includes(data.role)) {
      errors.push({
        field: "role",
        message: "Role không hợp lệ",
      });
    }

    return errors;
  }
}
