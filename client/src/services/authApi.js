/**
 * authApi.js — talks exclusively to the GapMap backend API.
 *
 * Supabase Auth calls (signUp, signInWithPassword, etc.) do NOT belong here.
 * Those happen directly in page/context code that needs them.
 */

/**
 * createProfile — POSTs to /auth/create-profile to create the user's profile row.
 *
 * @param {Object} params
 * @param {string} params.accessToken  - Fresh access_token from the just-completed signUp session.
 * @param {string} params.id           - Supabase auth user ID (UUID).
 * @param {string} params.full_name    - User's full name.
 * @param {string} params.role         - 'teacher' | 'student'
 * @param {string} [params.school_name] - Required when role === 'teacher'.
 * @param {string} [params.class_code]  - Required when role === 'student'.
 *
 * @returns {Promise<Object>} Parsed success response from the backend.
 * @throws  {Error}          Error whose message is the backend's actual error string.
 */
export async function createProfile({ accessToken, id, full_name, role, school_name, class_code }) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/auth/create-profile`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ id, full_name, role, school_name, class_code }),
    }
  )

  const data = await response.json()

  if (!response.ok) {
    // Throw using the backend's actual error message so the UI can show the real reason
    // (e.g. "Class code not found. Check with your teacher.", "You can only create a profile
    // for your own account.", rate-limit messages, etc.)
    throw new Error(data?.error ?? 'An unexpected error occurred. Please try again.')
  }

  return data
}
