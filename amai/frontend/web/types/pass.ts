/** What the public pass API returns for one attendee pass. It carries no email or phone number. */
export interface PassResponse {
  public_id: string;
  name: string;
  company: string;
  category: string;
  event: {
    title: string;
    starts_at: string;
    ends_at: string;
    venue: string;
    city: string;
  };
  /** How many people this pass lets in. */
  admits: number;
  /** How many of them have already been scanned in. */
  admitted: number;
  /** False once the pass has been cancelled or replaced by a newer one. */
  valid: boolean;
}
