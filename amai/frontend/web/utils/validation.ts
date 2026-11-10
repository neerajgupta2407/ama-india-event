import type { RegistrationErrors, RegistrationFormValues } from "@/types/registration";

const MOBILE = /^[0-9+\-\s]{8,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateDetails(values: RegistrationFormValues): RegistrationErrors {
  const errors: RegistrationErrors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!MOBILE.test(values.mobile.trim())) errors.mobile = "Please enter a valid mobile number (8–15 digits).";
  if (!EMAIL.test(values.email.trim())) errors.email = "Please enter a valid email address.";
  if (!values.delegates) errors.delegates = "Please select the number of delegates.";
  return errors;
}
