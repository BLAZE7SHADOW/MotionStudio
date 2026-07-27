/**
 * The author details the app actually renders — the credit band in the landing
 * footer, and the /contact page.
 *
 * Deliberately not a CV. This was lifted wholesale from a portfolio site and
 * carried a bio, avatar path, location, availability status, phone number and
 * résumé path — none of which anything rendered any more, and two of which
 * pointed at files that were never added. MotionStudio's contact surface
 * exists so someone using the product can reach whoever made it; the portfolio
 * link is where the fuller story belongs.
 */
export const profile = {
  name: 'Shivam Govind Rao',
  role: 'Software Development Engineer',
  portfolio: 'https://shivamgovindrao.com/',
  email: 'ishivamgovindrao@gmail.com',
  socials: {
    github: 'https://github.com/BLAZE7SHADOW',
    linkedin: 'https://www.linkedin.com/in/shivam-govind-rao-138881157/',
    twitter: 'https://x.com/BLAZE07SHADOW',
  },
} as const;
