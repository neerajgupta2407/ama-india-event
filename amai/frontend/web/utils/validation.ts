import type { AdditionalDelegateErrors, RegistrationErrors, RegistrationFormValues } from "@/types/registration";

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

/** One entry per additional delegate row; an empty object means that row is fine. */
export function validateAdditionalDelegates(values: RegistrationFormValues): AdditionalDelegateErrors[] {
  return values.additional_delegates.map((delegate) => {
    const errors: AdditionalDelegateErrors = {};
    if (!delegate.name.trim()) errors.name = "Please enter the delegate's name.";
    if (!EMAIL.test(delegate.email.trim())) errors.email = "Please enter a valid email address.";
    if (!delegate.designation.trim()) errors.designation = "Please enter the delegate's designation.";
    return errors;
  });
}
