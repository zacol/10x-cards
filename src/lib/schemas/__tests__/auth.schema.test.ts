import { describe, it, expect, expectTypeOf } from "vitest";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type RegisterFormData,
  type LoginFormData,
  type ResetPasswordFormData,
  type UpdatePasswordFormData,
} from "../auth.schema";

describe("registerSchema", () => {
  describe("valid data", () => {
    it("should accept valid registration data", () => {
      const validData = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept password with multiple uppercase letters and numbers", () => {
      const validData = {
        email: "test@example.com",
        password: "ValidPassword123ABC",
        confirmPassword: "ValidPassword123ABC",
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      const invalidData = {
        email: "",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject email without domain", () => {
      const invalidData = {
        email: "user@",
        password: "Password123",
        confirmPassword: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("password validation", () => {
    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        email: "user@example.com",
        password: "Pass1",
        confirmPassword: "Pass1",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("should reject password without uppercase letter", () => {
      const invalidData = {
        email: "user@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must contain an uppercase letter");
      }
    });

    it("should reject password without number", () => {
      const invalidData = {
        email: "user@example.com",
        password: "PasswordABC",
        confirmPassword: "PasswordABC",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must contain a number");
      }
    });

    it("should reject password that is exactly 8 characters but missing requirements", () => {
      const invalidData = {
        email: "user@example.com",
        password: "password",
        confirmPassword: "password",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should accept password with exactly 8 characters meeting all requirements", () => {
      const validData = {
        email: "user@example.com",
        password: "Pass1234",
        confirmPassword: "Pass1234",
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("confirmPassword validation", () => {
    it("should reject empty confirmPassword", () => {
      const invalidData = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please confirm your password");
      }
    });

    it("should reject when passwords do not match", () => {
      const invalidData = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "DifferentPassword123",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.message).toBe("Passwords do not match");
      }
    });

    it("should reject when confirmPassword is similar but not identical", () => {
      const invalidData = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "Password123 ",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: RegisterFormData = {
        email: "user@example.com",
        password: "Password123",
        confirmPassword: "Password123",
      };

      expectTypeOf(data).toMatchTypeOf<RegisterFormData>();
    });
  });
});

describe("loginSchema", () => {
  describe("valid data", () => {
    it("should accept valid login data", () => {
      const validData = {
        email: "user@example.com",
        password: "anypassword",
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept any non-empty password", () => {
      const validData = {
        email: "user@example.com",
        password: "x",
      };

      const result = loginSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      const invalidData = {
        email: "",
        password: "password",
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "not-an-email",
        password: "password",
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("password validation", () => {
    it("should reject empty password", () => {
      const invalidData = {
        email: "user@example.com",
        password: "",
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password is required");
      }
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: LoginFormData = {
        email: "user@example.com",
        password: "password",
      };

      expectTypeOf(data).toMatchTypeOf<LoginFormData>();
    });
  });
});

describe("resetPasswordSchema", () => {
  describe("valid data", () => {
    it("should accept valid email", () => {
      const validData = {
        email: "user@example.com",
      };

      const result = resetPasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept various valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
      ];

      validEmails.forEach((email) => {
        const result = resetPasswordSchema.safeParse({ email });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("email validation", () => {
    it("should reject empty email", () => {
      const invalidData = {
        email: "",
      };

      const result = resetPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please enter a valid email address");
      }
    });

    it("should reject invalid email format", () => {
      const invalidData = {
        email: "invalid-email",
      };

      const result = resetPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject email without @", () => {
      const invalidData = {
        email: "userexample.com",
      };

      const result = resetPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: ResetPasswordFormData = {
        email: "user@example.com",
      };

      expectTypeOf(data).toMatchTypeOf<ResetPasswordFormData>();
    });
  });
});

describe("updatePasswordSchema", () => {
  describe("valid data", () => {
    it("should accept valid password update data", () => {
      const validData = {
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      const result = updatePasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });

    it("should accept long password with all requirements", () => {
      const validData = {
        password: "VeryLongPassword123WithManyCharacters",
        confirmPassword: "VeryLongPassword123WithManyCharacters",
      };

      const result = updatePasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("password validation", () => {
    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        password: "Pass1",
        confirmPassword: "Pass1",
      };

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must be at least 8 characters");
      }
    });

    it("should reject password without uppercase letter", () => {
      const invalidData = {
        password: "password123",
        confirmPassword: "password123",
      };

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must contain an uppercase letter");
      }
    });

    it("should reject password without number", () => {
      const invalidData = {
        password: "PasswordABC",
        confirmPassword: "PasswordABC",
      };

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must contain a number");
      }
    });
  });

  describe("confirmPassword validation", () => {
    it("should reject empty confirmPassword", () => {
      const invalidData = {
        password: "NewPassword123",
        confirmPassword: "",
      };

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Please confirm your password");
      }
    });

    it("should reject when passwords do not match", () => {
      const invalidData = {
        password: "Password123",
        confirmPassword: "DifferentPassword456",
      };

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find((issue) => issue.path[0] === "confirmPassword");
        expect(confirmPasswordError?.message).toBe("Passwords do not match");
      }
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: UpdatePasswordFormData = {
        password: "NewPassword123",
        confirmPassword: "NewPassword123",
      };

      expectTypeOf(data).toMatchTypeOf<UpdatePasswordFormData>();
    });
  });
});
