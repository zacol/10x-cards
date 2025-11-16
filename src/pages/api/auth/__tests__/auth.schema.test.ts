import { describe, it, expect, expectTypeOf } from "vitest";
import {
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updatePasswordSchema,
  type LoginCommand,
  type RegisterCommand,
  type ResetPasswordCommand,
  type UpdatePasswordCommand,
} from "../auth.schema";

describe("loginSchema", () => {
  describe("valid data", () => {
    it("should accept valid login credentials", () => {
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

    it("should accept various valid email formats", () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.com",
        "user+tag@example.co.uk",
        "user_name@example-domain.com",
      ];

      validEmails.forEach((email) => {
        const result = loginSchema.safeParse({ email, password: "test" });
        expect(result.success).toBe(true);
      });
    });

    it("should accept single character password", () => {
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

    it("should reject email without domain", () => {
      const invalidData = {
        email: "user@",
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

  describe("missing fields", () => {
    it("should reject missing email field", () => {
      const invalidData = {
        password: "password",
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing password field", () => {
      const invalidData = {
        email: "user@example.com",
      };

      const result = loginSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: LoginCommand = {
        email: "user@example.com",
        password: "password",
      };

      expectTypeOf(data).toMatchTypeOf<LoginCommand>();
    });
  });
});

describe("registerSchema", () => {
  describe("valid data", () => {
    it("should accept valid registration data", () => {
      const validData = {
        email: "user@example.com",
        password: "Password123",
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
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept password with exactly 8 characters meeting all requirements", () => {
      const validData = {
        email: "user@example.com",
        password: "Pass1234",
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
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should accept long passwords with all requirements", () => {
      const validData = {
        email: "user@example.com",
        password: "VeryLongPassword123WithManyCharacters",
      };

      const result = registerSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("missing fields", () => {
    it("should reject missing email field", () => {
      const invalidData = {
        password: "Password123",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });

    it("should reject missing password field", () => {
      const invalidData = {
        email: "user@example.com",
      };

      const result = registerSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: RegisterCommand = {
        email: "user@example.com",
        password: "Password123",
      };

      expectTypeOf(data).toMatchTypeOf<RegisterCommand>();
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

  describe("missing fields", () => {
    it("should reject missing email field", () => {
      const invalidData = {};

      const result = resetPasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: ResetPasswordCommand = {
        email: "user@example.com",
      };

      expectTypeOf(data).toMatchTypeOf<ResetPasswordCommand>();
    });
  });
});

describe("updatePasswordSchema", () => {
  describe("valid data", () => {
    it("should accept valid password", () => {
      const validData = {
        password: "NewPassword123",
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
      };

      const result = updatePasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });

    it("should accept password with exactly 8 characters meeting all requirements", () => {
      const validData = {
        password: "Pass1234",
      };

      const result = updatePasswordSchema.safeParse(validData);

      expect(result.success).toBe(true);
    });
  });

  describe("password validation", () => {
    it("should reject password shorter than 8 characters", () => {
      const invalidData = {
        password: "Pass1",
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
      };

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Password must contain a number");
      }
    });

    it("should reject empty password", () => {
      const invalidData = {
        password: "",
      };

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("missing fields", () => {
    it("should reject missing password field", () => {
      const invalidData = {};

      const result = updatePasswordSchema.safeParse(invalidData);

      expect(result.success).toBe(false);
    });
  });

  describe("type inference", () => {
    it("should infer correct TypeScript type", () => {
      const data: UpdatePasswordCommand = {
        password: "NewPassword123",
      };

      expectTypeOf(data).toMatchTypeOf<UpdatePasswordCommand>();
    });
  });
});
